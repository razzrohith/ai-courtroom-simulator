/**
 * JudgeBench — AI Courtroom Simulator
 * Main Application Component
 *
 * Phase 6: Courtroom logic and session persistence
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { CourtroomLayout } from './components/CourtroomLayout';
import { createInitialState, startSimulation, processNextTurnAsync, resetSimulation, skipToNextPhase, ruleOnObjection, ruleOnMotion, recordPlayerObjection, getNextSpeakerRole, restartSimulationWithCase, determineObjectionRuling } from './orchestration/courtControllerAsync';
import type { ObjectionType } from './types/courtroom';
import { saveSession, loadSession, clearSession, saveToLibrary, listLibrary, loadFromLibrary, deleteFromLibrary, exportTrialReplay, parseTrialReplay, exportCaseReportMarkdown, exportCaseReportPdf } from './data/sessionPersistence';
import { enrichJurorReasoning } from './utils/juryEnrichment';
import { enrichVerdictDeliberation } from './utils/verdictDeliberation';
import { recordTrialCompletion } from './utils/achievements';
import type { CourtState, TranscriptEntry, CaseData } from './types/courtroom';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  const [state, setState] = useState<CourtState>(() => createInitialState());
  const [isGenerating, setIsGenerating] = useState(false);
  const streamRef = useRef<{ abort: boolean }>({ abort: false });
  const isProcessingRef = useRef<boolean>(false);
  const [hasSession, setHasSession] = useState(false);

  const speech = useSpeechSynthesis();

  // Autoplay states
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Phase 25: Replay Theater state (declared early — referenced by effects below)
  const [isReplaying, setIsReplaying] = useState(false);
  const replayQueueRef = useRef<TranscriptEntry[]>([]);
  const replayFinalRef = useRef<Partial<CourtState> | null>(null);

  // Quick trial mode: skip secondary phases for a shorter show
  const [trialLength, setTrialLength] = useState<'full' | 'quick'>(() => {
    try {
      return localStorage.getItem('judgebench.trialLength') === 'quick' ? 'quick' : 'full';
    } catch {
      return 'full';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('judgebench.trialLength', trialLength);
    } catch {}
  }, [trialLength]);

  // Play-a-role mode: which side (if any) the human argues for.
  // 'both' = hot-seat mode — two humans (or one) argue both sides.
  const [userRole, setUserRole] = useState<'none' | 'prosecutor' | 'defense' | 'both'>(() => {
    try {
      const stored = localStorage.getItem('judgebench.userRole');
      return stored === 'prosecutor' || stored === 'defense' || stored === 'both' ? stored : 'none';
    } catch {
      return 'none';
    }
  });

  const isHumanSide = useCallback((speaker: 'prosecutor' | 'defense' | 'judge' | null) => {
    if (!speaker || speaker === 'judge' || userRole === 'none') return false;
    return userRole === 'both' || speaker === userRole;
  }, [userRole]);
  useEffect(() => {
    try {
      localStorage.setItem('judgebench.userRole', userRole);
    } catch {}
  }, [userRole]);

  // Decoupled live-stage typewriter states
  const [stageEntry, setStageEntry] = useState<TranscriptEntry | null>(null);
  const [isStageTyping, setIsStageTyping] = useState<boolean>(false);

  // Check for saved session on mount
  useEffect(() => {
    const saved = loadSession();
    setHasSession(saved !== null);
  }, []);

  const lastProcessedEntryIdRef = useRef<string | null>(null);

  // Typewriter effect for live stage
  useEffect(() => {
    if (state.transcript.length === 0) {
      setStageEntry(null);
      setIsStageTyping(false);
      lastProcessedEntryIdRef.current = null;
      return;
    }

    const latestCompletedEntry = [...state.transcript].reverse().find(e => e.isComplete);
    if (!latestCompletedEntry) return;

    if (latestCompletedEntry.id !== lastProcessedEntryIdRef.current) {
      lastProcessedEntryIdRef.current = latestCompletedEntry.id;
      setIsStageTyping(true);
      
      let charIndex = 0;
      const fullText = latestCompletedEntry.message || '';
      
      // Clear previous live stage text by setting new speaker but empty message
      setStageEntry({
        ...latestCompletedEntry,
        message: ''
      });

      const interval = setInterval(() => {
        charIndex += 1;
        if (charIndex <= fullText.length) {
          setStageEntry(prev => {
            if (!prev) return null;
            return {
              ...prev,
              message: fullText.slice(0, charIndex)
            };
          });
        } else {
          setIsStageTyping(false);
          clearInterval(interval);
        }
      }, 20); // Cinematic letter-by-letter speed

      return () => clearInterval(interval);
    }
  }, [state.transcript]);

  const handleStart = useCallback(() => {
    streamRef.current.abort = false;
    setState(startSimulation(state));
  }, [state]);

  const handleNextTurn = useCallback(async (userMessageArg?: unknown) => {
    // Guard: onClick handlers pass the click event — only a real string is a
    // play-a-role argument from the human.
    const userMessage = typeof userMessageArg === 'string' ? userMessageArg : undefined;
    if (isGenerating || isProcessingRef.current) return;
    const hasPendingObjection = state.objectionHistory.some(o => o.status === 'pending');
    const isComplete = state.transcript.some(t => t.id.startsWith('trans-summary-'));
    if (hasPendingObjection || isComplete) return;

    // Play-a-role: if it is the human's turn, wait for their argument
    const upcomingSpeaker = getNextSpeakerRole(state);
    if (isHumanSide(upcomingSpeaker) && userMessage === undefined) {
      return; // The layout shows the argument input instead
    }

    isProcessingRef.current = true;
    streamRef.current.abort = false;
    setIsGenerating(true);

    try {
      const speakerRole = upcomingSpeaker || 'judge';
      const speakerName = state.participants.find(p => p.role === speakerRole)?.name || 'Unknown';

      const tempEntry: TranscriptEntry = {
        id: `trans-${Date.now()}-${speakerRole}`,
        speakerRole,
        speakerName,
        message: '',
        phase: state.currentPhase,
        sequenceNumber: state.transcript.length + 1,
        timestamp: new Date().toISOString(),
        providerUsed: 'mock',
        modelUsed: 'streaming...',
        responseSource: 'mock',
        isComplete: false,
      };

      setState(prev => ({
        ...prev,
        transcript: [...prev.transcript, tempEntry],
      }));

      const newState = await processNextTurnAsync(state, userMessage);
      if (streamRef.current.abort) return;

      const finalEntry: TranscriptEntry = {
        ...newState.transcript[newState.transcript.length - 1],
        isComplete: true,
      };

      setState(prev => ({
        ...newState,
        transcript: [...prev.transcript.slice(0, -1), finalEntry],
      }));
    } catch (err) {
      console.error('Generation error:', err);
      setIsAutoplay(false); // Stop autoplay on error
      setState(prev => ({
        ...prev,
        transcript: prev.transcript.filter((_, i) => i < prev.transcript.length - 1),
      }));
    } finally {
      isProcessingRef.current = false;
      if (!streamRef.current.abort) {
        setIsGenerating(false);
      }
    }
  }, [state, isGenerating, userRole, isHumanSide]);

  // Autoplay progression effect
  useEffect(() => {
    if (isReplaying) return;
    const isComplete = state.transcript.some(t => t.id.startsWith('trans-summary-'));
    if (isComplete) {
      setIsAutoplay(false);
      return;
    }

    const hasPendingObjection = state.objectionHistory.some(o => o.status === 'pending');
    if (hasPendingObjection) {
      return; // Awaiting ruling
    }

    if (!isAutoplay || isAutoplayPaused || isGenerating || !state.isActive || isStageTyping) {
      return;
    }

    const nextSpeaker = getNextSpeakerRole(state);
    // Stop autoplay when trial reaches the end
    if (state.currentPhase === 'case_summary' && nextSpeaker === null) {
      setIsAutoplay(false);
      return;
    }

    // Play-a-role: autoplay waits while it is the human's turn to argue
    if (isHumanSide(nextSpeaker)) {
      return;
    }

    // Delay checking if speech synthesis is currently active
    if (speech.supported && speech.settings.enabled && speech.settings.autoRead && speech.speaking) {
      return;
    }

    const delays = {
      slow: 3000,
      normal: 2000,
      fast: 1000,
    };
    const delay = delays[autoplaySpeed];

    const timer = setTimeout(() => {
      handleNextTurn();
    }, delay);

    return () => clearTimeout(timer);
  }, [
    isAutoplay,
    isAutoplayPaused,
    isGenerating,
    state,
    autoplaySpeed,
    speech.supported,
    speech.speaking,
    speech.settings.enabled,
    speech.settings.autoRead,
    handleNextTurn,
    isStageTyping,
    userRole,
    isHumanSide,
    isReplaying
  ]);

  const handleSkip = useCallback(() => {
    streamRef.current.abort = true;
    setState(skipToNextPhase(state));
  }, [state]);

  const handleReset = useCallback(() => {
    streamRef.current.abort = true;
    isProcessingRef.current = false;
    setIsGenerating(false);
    setIsAutoplay(false);
    setIsAutoplayPaused(false);
    speech.stopSpeaking();
    setStageEntry(null);
    setIsStageTyping(false);
    setState(resetSimulation());
    setHasSession(false);
  }, [speech]);

  const handleRestartThisCase = useCallback(() => {
    streamRef.current.abort = true;
    isProcessingRef.current = false;
    setIsGenerating(false);
    setIsAutoplay(false);
    setIsAutoplayPaused(false);
    speech.stopSpeaking();
    setStageEntry(null);
    setIsStageTyping(false);
    setState(prev => restartSimulationWithCase(prev));
  }, [speech]);

  const handleBackToSetup = useCallback(() => {
    streamRef.current.abort = true;
    isProcessingRef.current = false;
    setIsGenerating(false);
    setIsAutoplay(false);
    setIsAutoplayPaused(false);
    speech.stopSpeaking();
    setStageEntry(null);
    setIsStageTyping(false);
    setState(prev => ({
      ...prev,
      isActive: false,
      currentPhase: 'case_setup',
      currentSpeaker: null,
      transcript: [],
      verdict: null,
      objectionHistory: [],
      witnesses: [],
      motionHistory: [],
    }));
  }, [speech]);

  // Session controls
  const handleSave = useCallback(() => {
    saveSession(state);
    setHasSession(true);
  }, [state]);

  const handleLoad = useCallback(() => {
    const saved = loadSession();
    if (saved) {
      setState(prev => ({
        ...prev,
        currentPhase: saved.currentPhase || prev.currentPhase,
        currentSpeaker: saved.currentSpeaker || prev.currentSpeaker,
        transcript: saved.transcript || prev.transcript,
        evidence: saved.evidence || prev.evidence,
        verdict: saved.verdict || prev.verdict,
        isActive: saved.isActive ?? prev.isActive,
        case: saved.case || prev.case,
        objectionHistory: saved.objectionHistory || [],
      }));
      setHasSession(true);
    }
  }, []);

  const handleClear = useCallback(() => {
    clearSession();
    setHasSession(false);
  }, []);

  // Handle case updates from case editor
  const handleCaseUpdate = useCallback((updatedCase: CaseData) => {
    setState(prev => ({
      ...prev,
      case: updatedCase,
      evidence: updatedCase.evidenceItems,
    }));
  }, []);

  // Handle objection ruling from ObjectionHistoryPanel
  const handleRuling = useCallback((objectionId: string, sustained: boolean, targetEvidence?: string) => {
    setState(prev => ruleOnObjection(prev, objectionId, sustained, targetEvidence));
  }, []);

  // Handle motion ruling from MotionPanel
  const handleMotionRuling = useCallback((motionId: string, granted: boolean, rulingNote?: string) => {
    setState(prev => ruleOnMotion(prev, motionId, granted, rulingNote));
  }, []);

  // Quick trial: automatically fast-forward through secondary phases
  useEffect(() => {
    if (isReplaying) return;
    if (trialLength !== 'quick' || !state.isActive || isGenerating) return;
    const QUICK_SKIP_PHASES = ['objection_ruling', 'cross_examination', 'witness_testimony', 'motion_hearing', 'jury_instructions', 'rebuttal'];
    if (!QUICK_SKIP_PHASES.includes(state.currentPhase)) return;
    const hasPendingObjection = state.objectionHistory.some(o => o.status === 'pending');
    if (hasPendingObjection) return;
    const timer = setTimeout(() => {
      setState(prev => skipToNextPhase(prev));
    }, 800);
    return () => clearTimeout(timer);
  }, [trialLength, state, isGenerating, isReplaying]);

  // Case library / replay / report handlers (Phase 24)
  const handleSaveToLibrary = useCallback((name: string) => {
    saveToLibrary(state, name);
  }, [state]);

  const handleLoadFromLibrary = useCallback((name: string) => {
    const saved = loadFromLibrary(name);
    if (saved) {
      setState(prev => ({
        ...prev,
        ...saved,
        participants: prev.participants,
      } as CourtState));
    }
  }, []);

  const handleExportReplay = useCallback(() => {
    exportTrialReplay(state);
  }, [state]);

  const handleImportReplay = useCallback((fileContent: string) => {
    try {
      const saved = parseTrialReplay(fileContent);
      setState(prev => ({
        ...prev,
        ...saved,
        participants: prev.participants,
      } as CourtState));
      return null;
    } catch (err: any) {
      return err?.message || 'Invalid replay file.';
    }
  }, []);

  const handleExportReport = useCallback(() => {
    exportCaseReportMarkdown(state);
  }, [state]);

  // Phase 25: Replay Theater — play an imported trial back turn-by-turn
  const handleWatchReplay = useCallback((fileContent: string) => {
    try {
      const saved = parseTrialReplay(fileContent);
      const entries = (saved.transcript || []).filter(t => t.isComplete && t.message);
      if (entries.length === 0) return 'Replay file contains no transcript.';
      replayQueueRef.current = [...entries];
      replayFinalRef.current = saved;
      setIsAutoplay(false);
      setState(prev => ({
        ...prev,
        case: (saved.case as CaseData) || prev.case,
        evidence: (saved.case as CaseData)?.evidenceItems || [],
        transcript: [],
        objectionHistory: [],
        witnesses: saved.witnesses || [],
        motionHistory: [],
        verdict: null,
        isActive: true,
        currentPhase: entries[0].phase,
        currentSpeaker: entries[0].speakerRole,
      }));
      setIsReplaying(true);
      return null;
    } catch (err: any) {
      return err?.message || 'Invalid replay file.';
    }
  }, []);

  const finishReplay = useCallback(() => {
    const final = replayFinalRef.current;
    replayQueueRef.current = [];
    replayFinalRef.current = null;
    setIsReplaying(false);
    if (final) {
      // A replayed trial must not count toward lifetime stats
      recordedTrialRef.current = `${(final.case as CaseData)?.id || 'replay'}-replayed`;
      setState(prev => ({
        ...prev,
        ...final,
        participants: prev.participants,
      } as CourtState));
    }
  }, []);

  useEffect(() => {
    if (!isReplaying) return;
    if (replayQueueRef.current.length === 0) {
      finishReplay();
      return;
    }
    const timer = setTimeout(() => {
      const next = replayQueueRef.current.shift();
      if (!next) {
        finishReplay();
        return;
      }
      setState(prev => ({
        ...prev,
        transcript: [...prev.transcript, next],
        currentPhase: next.phase,
        currentSpeaker: next.speakerRole,
      }));
      if (replayQueueRef.current.length === 0) {
        setTimeout(finishReplay, 2400);
      }
    }, 2400);
    return () => clearTimeout(timer);
  }, [isReplaying, state.transcript, finishReplay]);

  // Phase 25: record lifetime stats once per completed trial
  const [statsTick, setStatsTick] = useState(0);
  const recordedTrialRef = useRef<string | null>(null);
  useEffect(() => {
    const isComplete = state.transcript.some(t => t.id.startsWith('trans-summary-'));
    if (!isComplete) return;
    const trialKey = `${state.case.id}-${state.transcript.length}`;
    if (recordedTrialRef.current?.startsWith(`${state.case.id}-`)) return;
    recordedTrialRef.current = trialKey;
    recordTrialCompletion(state, userRole);
    setStatsTick(t => t + 1);
  }, [state, userRole]);

  useEffect(() => {
    // A fresh/restarted trial may record again
    if (state.transcript.length === 0) recordedTrialRef.current = null;
  }, [state.transcript.length]);

  const handleExportReportPdf = useCallback(() => {
    exportCaseReportPdf(state);
  }, [state]);

  // Phase 25: player-raised objections — the AI judge rules a few seconds
  // after the player objects, regardless of autoplay state.
  const handlePlayerObjection = useCallback((type: ObjectionType) => {
    if (userRole === 'none') return;
    const side = userRole === 'both'
      ? (state.transcript.filter(t => t.isComplete && t.speakerRole !== 'judge').slice(-1)[0]?.speakerRole === 'prosecutor' ? 'defense' : 'prosecutor')
      : userRole;
    setState(prev => recordPlayerObjection(prev, side, type));
  }, [userRole, state.transcript]);

  useEffect(() => {
    const pending = state.objectionHistory.find(o => o.status === 'pending' && o.id.startsWith('obj-player-'));
    if (!pending) return;
    const timer = setTimeout(() => {
      const sustained = determineObjectionRuling(pending.type, state.currentPhase);
      setState(prev => ruleOnObjection(prev, pending.id, sustained, pending.targetEvidence));
    }, 3500);
    return () => clearTimeout(timer);
  }, [state.objectionHistory, state.currentPhase]);

  // Phase 25/26: once the verdict lands, two background LLM calls enrich it —
  // juror reasoning and the judge's written deliberation (grounded in the real
  // transcript). Silent failure keeps the deterministic text.
  const enrichedVerdictRef = useRef<string | null>(null);
  useEffect(() => {
    if (!state.verdict?.jurors?.length || isReplaying) return;
    const verdictKey = `${state.case.id}-${state.verdict.decision}`;
    if (enrichedVerdictRef.current === verdictKey) return;
    enrichedVerdictRef.current = verdictKey;
    let cancelled = false;
    enrichJurorReasoning(state.case, state.verdict).then(enriched => {
      if (!enriched || cancelled) return;
      setState(prev => {
        if (!prev.verdict?.jurors) return prev;
        return { ...prev, verdict: { ...prev.verdict, jurors: enriched } };
      });
    });
    enrichVerdictDeliberation(state, state.verdict).then(delib => {
      if (!delib || cancelled) return;
      setState(prev => {
        if (!prev.verdict) return prev;
        return { ...prev, verdict: { ...prev.verdict, ...delib } };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [state.verdict, state.case, state, isReplaying]);

  // On autoplay, the AI judge rules pending objections after a dramatic pause
  // so passive viewers are never soft-locked waiting for a manual ruling.
  useEffect(() => {
    if (!isAutoplay || isAutoplayPaused) return;
    const pending = state.objectionHistory.find(o => o.status === 'pending');
    if (!pending) return;
    const timer = setTimeout(() => {
      const sustained = determineObjectionRuling(pending.type, state.currentPhase);
      setState(prev => ruleOnObjection(prev, pending.id, sustained, pending.targetEvidence));
    }, 5000);
    return () => clearTimeout(timer);
  }, [isAutoplay, isAutoplayPaused, state.objectionHistory, state.currentPhase]);

  return (
    <>
      <CourtroomLayout
        state={state}
        onStart={handleStart}
        onNextTurn={handleNextTurn}
        onReset={handleReset}
        onSkip={handleSkip}
        onSave={handleSave}
        onLoad={handleLoad}
        onClear={handleClear}
        onCaseUpdate={handleCaseUpdate}
        onObjectionRuling={handleRuling}
        onMotionRuling={handleMotionRuling}
        userRole={userRole}
        onChangeUserRole={setUserRole}
        onSubmitUserTurn={(message: string) => handleNextTurn(message)}
        onPlayerObjection={handlePlayerObjection}
        nextSpeaker={getNextSpeakerRole(state)}
        trialLength={trialLength}
        onChangeTrialLength={setTrialLength}
        onSaveToLibrary={handleSaveToLibrary}
        onLoadFromLibrary={handleLoadFromLibrary}
        listLibraryEntries={listLibrary}
        onDeleteFromLibrary={deleteFromLibrary}
        onExportReplay={handleExportReplay}
        onImportReplay={handleImportReplay}
        onExportReport={handleExportReport}
        onExportReportPdf={handleExportReportPdf}
        statsTick={statsTick}
        onWatchReplay={handleWatchReplay}
        isReplaying={isReplaying}
        onStopReplay={finishReplay}
        hasSavedSession={hasSession}
        isGenerating={isGenerating}
        isAutoplay={isAutoplay}
        isAutoplayPaused={isAutoplayPaused}
        autoplaySpeed={autoplaySpeed}
        onToggleAutoplay={() => setIsAutoplay(prev => !prev)}
        onToggleAutoplayPause={() => setIsAutoplayPaused(prev => !prev)}
        onChangeAutoplaySpeed={setAutoplaySpeed}
        speech={speech}
        stageEntry={stageEntry}
        isStageTyping={isStageTyping}
        onRestartThisCase={handleRestartThisCase}
        onStartNewCase={handleReset}
        onBackToSetup={handleBackToSetup}
      />
    </>
  );
}

export default function WrappedApp() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

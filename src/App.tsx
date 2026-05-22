/**
 * JudgeBench — AI Courtroom Simulator
 * Main Application Component
 *
 * Phase 6: Courtroom logic and session persistence
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { CourtroomLayout } from './components/CourtroomLayout';
import { createInitialState, startSimulation, processNextTurnAsync, resetSimulation, skipToNextPhase, ruleOnObjection, getNextSpeakerRole } from './orchestration/courtControllerAsync';
import { saveSession, loadSession, clearSession, hasSavedSession } from './data/sessionPersistence';
import type { CourtState, TranscriptEntry, CaseData } from './types/courtroom';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

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

  // Check for saved session on mount
  useEffect(() => {
    setHasSession(hasSavedSession());
  }, []);

  const handleStart = useCallback(() => {
    streamRef.current.abort = false;
    setState(startSimulation(state));
  }, [state]);

  const handleNextTurn = useCallback(async () => {
    if (isGenerating || isProcessingRef.current) return;
    isProcessingRef.current = true;
    streamRef.current.abort = false;
    setIsGenerating(true);

    try {
      const speakerRole = getNextSpeakerRole(state) || 'judge';
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

      const newState = await processNextTurnAsync(state);
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
  }, [state, isGenerating]);

  // Autoplay progression effect
  useEffect(() => {
    if (!isAutoplay || isAutoplayPaused || isGenerating || !state.isActive) {
      return;
    }

    const nextSpeaker = getNextSpeakerRole(state);
    // Stop autoplay when trial reaches the end
    if (state.currentPhase === 'case_summary' && nextSpeaker === null) {
      setIsAutoplay(false);
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
    handleNextTurn
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
    setState(resetSimulation());
    setHasSession(false);
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

  return (
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
      hasSavedSession={hasSession}
      isGenerating={isGenerating}
      isAutoplay={isAutoplay}
      isAutoplayPaused={isAutoplayPaused}
      autoplaySpeed={autoplaySpeed}
      onToggleAutoplay={() => setIsAutoplay(prev => !prev)}
      onToggleAutoplayPause={() => setIsAutoplayPaused(prev => !prev)}
      onChangeAutoplaySpeed={setAutoplaySpeed}
      speech={speech}
    />
  );
}

export default App;

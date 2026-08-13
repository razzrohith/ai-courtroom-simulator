/**
 * CourtroomLayout — Main courtroom interface layout.
 * Gilded Verdict redesign: glass chrome, animated stage transitions,
 * objection flash, verdict celebration, sound effects, keyboard shortcuts.
 */

import { useState, useEffect, useRef } from 'react';
import LanguageSelector from './LanguageSelector';
import { motion } from 'framer-motion';
import type { CourtState, CaseData, AgentRole, TranscriptEntry, ObjectionType } from '../types/courtroom';
import { PHASE_LABELS } from '../types/courtroom';
import {
  loadCourtroomConfig,
  CourtroomModelConfig,
  isProviderPlaceholder,
  AgentModelConfig,
  DEFAULT_MODEL_CONFIG,
  getAgentConnectionStatus,
  AgentConnectionStatus
} from '../types/providers';
import { AgentPanel } from './AgentPanel';
import { TranscriptPanel } from './TranscriptPanel';
import { EvidenceBoard } from './EvidenceBoard';
import { EvidenceTimeline } from './EvidenceTimeline';
import { PhaseTimeline } from './PhaseTimeline';
import { VerdictPanel } from './VerdictPanel';
import { CaseSetupPanel } from './CaseSetupPanel';
import { CaseSummaryReport } from './CaseSummaryReport';
import { ProviderSettings } from './ProviderSettings';
import { ProviderRuntimeStatusPanel } from './ProviderRuntimeStatus';
import { ObjectionHistoryPanel } from './ObjectionHistoryPanel';
import { WitnessPanel } from './WitnessPanel';
import { MotionPanel } from './MotionPanel';
import { JuryInstructionPanel } from './JuryInstructionPanel';
import { DeliberationPanel } from './DeliberationPanel';
import { AppealPanel } from './AppealPanel';
import { ExhibitPanel } from './ExhibitPanel';
import { UsageDashboard } from './UsageDashboard';
import { JuryPanel } from './JuryPanel';
import { PlayerScorecard } from './PlayerScorecard';
import { TrialHighlights } from './TrialHighlights';
import { AchievementsPanel } from './AchievementsPanel';
import { TelemetryDrawer } from './TelemetryDrawer';
import { CourtroomStage } from './visuals/CourtroomStage';
import { WelcomePanel } from './WelcomePanel';
import { ObjectionFlash } from './effects/ObjectionFlash';
import { VerdictCelebration } from './effects/VerdictCelebration';
import { DegradationBanner } from './effects/DegradationBanner';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { isOpenRouterConfigured } from '../providers/openRouterProvider';
import { getParticipantName } from '../orchestration/courtControllerAsync';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface AgentModelInfo {
  providerId: string;
  model: string;
  mode: string;
  isPlaceholder: boolean;
  status: AgentConnectionStatus;
  openRouterMode?: 'demo' | 'personal';
}

interface CourtroomLayoutProps {
  state: CourtState;
  onStart: () => void;
  onNextTurn: () => void;
  onReset: () => void;
  onSkip?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onClear?: () => void;
  onCaseUpdate?: (updatedCase: CaseData) => void;
  onObjectionRuling?: (objectionId: string, sustained: boolean, targetEvidence?: string) => void;
  onMotionRuling?: (motionId: string, granted: boolean, rulingNote?: string) => void;
  userRole?: 'none' | 'prosecutor' | 'defense' | 'both';
  onChangeUserRole?: (role: 'none' | 'prosecutor' | 'defense' | 'both') => void;
  onSubmitUserTurn?: (message: string) => void;
  onPlayerObjection?: (type: ObjectionType) => void;
  nextSpeaker?: AgentRole | null;
  trialLength?: 'full' | 'quick';
  onChangeTrialLength?: (length: 'full' | 'quick') => void;
  onSaveToLibrary?: (name: string) => void;
  onLoadFromLibrary?: (name: string) => void;
  listLibraryEntries?: () => { name: string; savedAt: string; caseTitle: string; phase: string }[];
  onDeleteFromLibrary?: (name: string) => void;
  onExportReplay?: () => void;
  onImportReplay?: (fileContent: string) => string | null;
  onExportReport?: () => void;
  onExportReportPdf?: () => void;
  statsTick?: number;
  onWatchReplay?: (fileContent: string) => string | null;
  isReplaying?: boolean;
  onStopReplay?: () => void;
  isGenerating?: boolean;
  hasSavedSession?: boolean;
  isAutoplay?: boolean;
  isAutoplayPaused?: boolean;
  autoplaySpeed?: 'slow' | 'normal' | 'fast';
  onToggleAutoplay?: () => void;
  onToggleAutoplayPause?: () => void;
  onChangeAutoplaySpeed?: (speed: 'slow' | 'normal' | 'fast') => void;
  speech: ReturnType<typeof useSpeechSynthesis>;
  stageEntry: TranscriptEntry | null;
  isStageTyping: boolean;
  onRestartThisCase?: () => void;
  onStartNewCase?: () => void;
  onBackToSetup?: () => void;
}

export function CourtroomLayout({
  state,
  onStart,
  onNextTurn,
  onReset,
  onSkip,
  onSave,
  onLoad,
  onClear,
  onCaseUpdate,
  onObjectionRuling,
  onMotionRuling,
  userRole = 'none',
  onChangeUserRole,
  onSubmitUserTurn,
  onPlayerObjection,
  nextSpeaker = null,
  trialLength = 'full',
  onChangeTrialLength,
  onSaveToLibrary,
  onLoadFromLibrary,
  listLibraryEntries,
  onDeleteFromLibrary,
  onExportReplay,
  onImportReplay,
  onExportReport,
  onExportReportPdf,
  statsTick = 0,
  onWatchReplay,
  isReplaying = false,
  onStopReplay,
  isGenerating = false,
  hasSavedSession = false,
  isAutoplay = false,
  isAutoplayPaused = false,
  autoplaySpeed = 'normal',
  onToggleAutoplay,
  onToggleAutoplayPause,
  onChangeAutoplaySpeed,
  speech,
  stageEntry,
  isStageTyping,
  onRestartThisCase,
  onStartNewCase,
  onBackToSetup
}: CourtroomLayoutProps) {
  const { currentPhase, currentSpeaker, participants, transcript, evidence, verdict, case: caseData, isActive, objectionHistory, witnesses, motionHistory } = state;
  const phaseLabel = PHASE_LABELS[currentPhase];
  const [showSettings, setShowSettings] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showExhibitView, setShowExhibitView] = useState(false);
  const [modelConfig, setModelConfig] = useState<CourtroomModelConfig | null>(null);
  const [statusTick, setStatusTick] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rightTab, setRightTab] = useState<'transcript' | 'objections'>('transcript');
  const [focusMode, setFocusMode] = useState(false);
  const [userArgument, setUserArgument] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const [libraryTick, setLibraryTick] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importModeRef = useRef<'restore' | 'theater'>('restore');
  const [showTelemetry, setShowTelemetry] = useState(false);

  // Phase 26: quality mode — 'high' adds a self-critique revision pass per turn
  const [qualityMode, setQualityMode] = useState<'fast' | 'high'>(() => {
    try {
      return localStorage.getItem('judgebench.qualityMode') === 'high' ? 'high' : 'fast';
    } catch {
      return 'fast';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('judgebench.qualityMode', qualityMode);
    } catch {}
  }, [qualityMode]);

  const sound = useSoundEffects();

  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('judgebench.layoutPrefs.v1');
      if (stored) {
        return !!JSON.parse(stored).leftCollapsed;
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('judgebench.layoutPrefs.v1', JSON.stringify({ leftCollapsed }));
    } catch {}
  }, [leftCollapsed]);

  useEffect(() => {
    const config = loadCourtroomConfig();
    setModelConfig(config);
  }, []);

  useEffect(() => {
    const handleStatusChange = () => {
      setModelConfig(loadCourtroomConfig());
      setStatusTick(t => t + 1);
    };
    window.addEventListener('judgebench-provider-status-changed', handleStatusChange);
    return () => {
      window.removeEventListener('judgebench-provider-status-changed', handleStatusChange);
    };
  }, []);

  const hasPendingObjection = state.objectionHistory.some(o => o.status === 'pending');
  const isComplete = state.transcript.some(t => t.id.startsWith('trans-summary-'));
  const canAdvance = isActive && currentSpeaker !== null && !hasPendingObjection && !isComplete && !isReplaying;
  const isUserTurn = userRole !== 'none' && nextSpeaker !== null && nextSpeaker !== 'judge'
    && (userRole === 'both' || nextSpeaker === userRole) && canAdvance && !isGenerating;

  // Player objection availability: the human may object right after opposing
  // counsel (any AI counsel) has spoken.
  const lastCounselEntry = [...transcript].reverse().find(t => t.isComplete && t.speakerRole !== 'judge' && t.message);
  const canPlayerObject = userRole !== 'none' && userRole !== 'both' && isActive && !isComplete
    && !hasPendingObjection && !isGenerating
    && lastCounselEntry !== undefined && lastCounselEntry.speakerRole !== userRole
    && lastCounselEntry.providerUsed !== 'human';
  const [showObjectionPicker, setShowObjectionPicker] = useState(false);

  // Phase 25: voice dictation into the argument dock (Web Speech API)
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechRecognitionSupported = typeof window !== 'undefined'
    && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) text += event.results[i][0].transcript;
      }
      if (text) setUserArgument(prev => (prev ? prev + ' ' : '') + text.trim());
    };
    recognition.onend = () => setIsDictating(false);
    recognition.onerror = () => setIsDictating(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsDictating(true);
    } catch {
      setIsDictating(false);
    }
  };

  // ---- Sound cues driven by state changes ----
  const prevPhaseRef = useRef(currentPhase);
  useEffect(() => {
    if (prevPhaseRef.current !== currentPhase) {
      prevPhaseRef.current = currentPhase;
      if (isActive && currentPhase !== 'case_setup') {
        sound.play('phase');
      }
    }
  }, [currentPhase, isActive, sound]);

  const prevAdmittedRef = useRef(0);
  useEffect(() => {
    const admitted = evidence.filter(e => e.status === 'admitted' || e.status === 'offered').length;
    if (admitted > prevAdmittedRef.current && isActive) {
      sound.play('evidence');
    }
    prevAdmittedRef.current = admitted;
  }, [evidence, isActive, sound]);

  const prevActiveRef = useRef(isActive);
  useEffect(() => {
    if (isActive && !prevActiveRef.current) {
      sound.play('gavel');
    }
    prevActiveRef.current = isActive;
  }, [isActive, sound]);

  // ---- Keyboard shortcuts ----
  useKeyboardShortcuts({
    onNextTurn: canAdvance && !isGenerating && !(isAutoplay && !isAutoplayPaused) ? onNextTurn : undefined,
    onToggleAutoplay: isActive && !isComplete ? onToggleAutoplay : undefined,
    onToggleFocusMode: isActive ? () => setFocusMode(f => !f) : undefined,
    onToggleSound: sound.toggle,
  });

  const getAgentModelInfo = (role: AgentRole): AgentModelInfo | null => {
    if (!modelConfig) return null;
    const config = (modelConfig as Record<AgentRole, AgentModelConfig>)[role];
    if (!config) return null;
    return {
      providerId: config.providerId,
      model: config.model,
      mode: config.mode,
      isPlaceholder: isProviderPlaceholder(config.providerId),
      status: getAgentConnectionStatus(role, config),
      openRouterMode: config.openRouterMode,
    };
  };

  const stageProps = {
    judge: {
      ...participants.find(p => p.role === 'judge')!,
      modelInfo: getAgentModelInfo('judge')
    },
    prosecutor: {
      ...participants.find(p => p.role === 'prosecutor')!,
      modelInfo: getAgentModelInfo('prosecutor')
    },
    defense: {
      ...participants.find(p => p.role === 'defense')!,
      modelInfo: getAgentModelInfo('defense')
    },
    currentSpeaker: stageEntry?.speakerRole || null,
    isSpeaking: isStageTyping,
    currentPhase,
    isActive,
    evidence,
    activeObjection: objectionHistory.find(o => o.status === 'pending'),
    showVerdict: currentPhase === 'verdict' && !!verdict,
    verdict,
    compact: false,
    latestEntry: stageEntry,
    isStageTyping,
    simulationSpeaker: currentSpeaker,
    isGenerating,
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col lg:flex-row font-sans">
      {/* Cinematic overlays */}
      <ObjectionFlash objections={objectionHistory} onAppear={() => sound.play('objection')} />
      <VerdictCelebration
        verdict={verdict}
        winnerName={verdict?.winnerName || (verdict?.decision === 'plaintiff_wins' ? caseData.plaintiffSide : caseData.defenseSide)}
        onAppear={() => sound.play('verdict')}
      />

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-ink-850/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <span className="font-display font-bold text-brass-gradient tracking-widest text-sm">JUDGEBENCH</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1 text-gray-400 hover:text-white focus:outline-none"
        >
          {mobileSidebarOpen ? (
            <span className="text-lg font-bold">✕</span>
          ) : (
            <span className="text-lg font-bold">☰</span>
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-auto transition-transform duration-300 ease-in-out z-40 w-64 bg-ink-850/90 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between shrink-0 h-screen lg:sticky lg:top-0`}
      >
        <div className="flex flex-col overflow-y-auto">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
            <motion.div
              className="w-11 h-11 rounded-xl glass-panel-brass flex items-center justify-center text-xl"
              whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
            >
              ⚖️
            </motion.div>
            <div>
              <h1 className="font-display font-bold text-sm text-brass-gradient tracking-widest uppercase leading-none">
                JudgeBench
              </h1>
              <span className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">Courtroom Simulator</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-4 py-6 space-y-1.5">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
              Simulator Menu
            </span>
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold glass-panel-brass !rounded-xl text-brass-200 transition-all duration-200"
            >
              <span className="text-sm">⚖️</span>
              <span>Simulator Panel</span>
            </button>
            <button
              onClick={() => {
                setShowSettings(true);
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200"
            >
              <span className="text-sm">⚙️</span>
              <span>Provider Configuration</span>
            </button>
            <button
              onClick={() => {
                sound.toggle();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200"
              title="Toggle courtroom sound effects (M)"
            >
              <span className="text-sm">{sound.enabled ? '🔊' : '🔇'}</span>
              <span>Sound Effects: {sound.enabled ? 'On' : 'Off'}</span>
            </button>
            <button
              onClick={() => {
                setShowTelemetry(v => !v);
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200"
              title="Provider failures, retries, and fallbacks"
            >
              <span className="text-sm">🔍</span>
              <span>Provider Telemetry</span>
            </button>
            <button
              onClick={() => {
                if (onReset) onReset();
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200"
            >
              <span className="text-sm">🔄</span>
              <span>Reset Courtroom</span>
            </button>
          </div>

          {/* Session Actions (Save, Load, Clear) */}
          <div className="px-4 py-4 border-t border-white/5 space-y-2">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
              Simulation Sessions
            </span>
            {onSave && (
              <button
                onClick={onSave}
                disabled={isGenerating}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-sky-900/20 hover:bg-sky-800/25 border border-sky-800/25 hover:border-sky-700/35 text-sky-300 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
              >
                <span>💾</span>
                <span>Save Case Session</span>
              </button>
            )}
            {onLoad && (
              <button
                onClick={onLoad}
                disabled={isGenerating}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-purple-900/20 hover:bg-purple-800/25 border border-purple-800/25 hover:border-purple-700/35 text-purple-300 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
              >
                <span>📂</span>
                <span>Load Saved Case</span>
              </button>
            )}
            {onClear && hasSavedSession && (
              <button
                onClick={onClear}
                disabled={isGenerating}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-red-900/20 hover:bg-red-800/25 border border-red-800/25 hover:border-red-700/35 text-red-300 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
              >
                <span>🗑️</span>
                <span>Clear Local Cache</span>
              </button>
            )}
          </div>

          {/* Case Files: library, replay, report */}
          <div className="px-4 py-4 border-t border-white/5 space-y-2">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
              Case Files
            </span>
            <button
              onClick={() => { setShowLibrary(true); setLibraryTick(t => t + 1); setMobileSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-brass-900/20 hover:bg-brass-900/30 border border-brass-800/25 hover:border-brass-700/35 text-brass-200 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98]"
            >
              <span>🗂️</span>
              <span>Case Library</span>
            </button>
            <button
              onClick={onExportReplay}
              disabled={!isActive && transcript.length === 0}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-teal-900/20 hover:bg-teal-800/25 border border-teal-800/25 text-teal-300 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
            >
              <span>📤</span>
              <span>Export Trial Replay</span>
            </button>
            <button
              onClick={() => { importModeRef.current = 'restore'; importInputRef.current?.click(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-teal-900/20 hover:bg-teal-800/25 border border-teal-800/25 text-teal-300 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98]"
            >
              <span>📥</span>
              <span>Import Trial Replay</span>
            </button>
            <button
              onClick={() => { importModeRef.current = 'theater'; importInputRef.current?.click(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-amber-900/20 hover:bg-amber-800/25 border border-amber-800/25 text-amber-300 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98]"
              title="Play an exported trial back turn-by-turn on the stage"
            >
              <span>🎞️</span>
              <span>Watch Replay (Theater)</span>
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const handler = importModeRef.current === 'theater' ? onWatchReplay : onImportReplay;
                if (!handler) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const error = handler(String(reader.result || ''));
                  setImportError(error);
                  if (error) setTimeout(() => setImportError(null), 5000);
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
            {importError && (
              <p className="text-[10px] text-red-400 font-semibold px-3">⚠️ {importError}</p>
            )}
            <button
              onClick={onExportReport}
              disabled={transcript.length === 0}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-indigo-900/20 hover:bg-indigo-800/25 border border-indigo-800/25 text-indigo-300 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
            >
              <span>📄</span>
              <span>Export Case Report (.md)</span>
            </button>
            <button
              onClick={onExportReportPdf}
              disabled={transcript.length === 0}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-indigo-900/20 hover:bg-indigo-800/25 border border-indigo-800/25 text-indigo-300 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
            >
              <span>🖨️</span>
              <span>Print / Save as PDF</span>
            </button>
          </div>

          {/* Language mode */}
          <div className="border-t border-white/5 py-2 px-1">
            <LanguageSelector />
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="px-4 py-4 border-t border-white/5">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
              Hotkeys
            </span>
            <div className="px-3 space-y-1.5 text-[10px] text-gray-500">
              {[
                ['Space / N', 'Next turn'],
                ['A', 'Toggle autoplay'],
                ['F', 'Focus mode'],
                ['M', 'Sound on/off'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-gray-400">{key}</kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer / Gateway Status */}
        <div className="p-4 border-t border-white/5">
          <div className="glass-panel !rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpenRouterConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">API Gateway</span>
            </div>
            <p className="text-[11px] font-bold text-gray-200 leading-tight">
              {isOpenRouterConfigured() ? 'OpenRouter Free Demo' : 'Mock Fallback Mode'}
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full text-center text-[10px] text-brass-300 hover:text-brass-200 font-bold hover:underline block pt-1.5 border-t border-white/5 mt-2"
            >
              Gateway Settings ⚙️
            </button>
          </div>
          <p className="text-[9px] text-gray-600 text-center mt-3 tracking-[0.25em] uppercase">
            Judgebench Simulator
          </p>
        </div>
      </div>

      {/* Backdrop for mobile menu */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 z-30 lg:hidden"
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative pb-32 lg:pb-28">
        {/* Sticky Dashboard Header */}
        <div className="bg-ink-900/80 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-500 mb-0.5">
              <span>COURTROOM STATE</span>
              <span className="text-gray-700">/</span>
              <span className="text-brass-300 font-bold uppercase">
                {isActive ? phaseLabel : 'Awaiting Case File'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isActive && caseData?.title ? (
                <>
                  <span className="text-brass-400">⚖️</span>
                  <span className="font-display tracking-wide">{caseData.title}</span>
                </>
              ) : (
                <span className="font-display tracking-wide">Simulation Sandbox</span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {isActive && currentSpeaker && (
              <div className="flex items-center gap-2 glass-panel !rounded-full px-3 py-1 text-xs">
                <span className="text-gray-500">Speaker:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    currentSpeaker === 'judge' ? 'bg-brass-400' :
                    currentSpeaker === 'prosecutor' ? 'bg-sky-400' :
                    'bg-rose-400'
                  }`}></span>
                  {getParticipantName(state, currentSpeaker)}
                  <span className="opacity-50 text-[9px] font-mono">({currentSpeaker.toUpperCase()})</span>
                </span>
              </div>
            )}

            {isGenerating && (
              <div className="flex items-center gap-1.5 glass-panel-brass !rounded-full text-brass-200 px-3 py-1.5 text-xs animate-pulse font-bold">
                <span>⏳ Running Agent LLM...</span>
              </div>
            )}

            {isReplaying && (
              <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-500/40 rounded-full text-amber-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                🎞️ Replay Theater
                <button
                  onClick={onStopReplay}
                  className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 text-[10px] font-bold normal-case tracking-normal"
                >
                  Skip to End ⏭
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Grid Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Phase 26: honest degradation — never silently fake the AI */}
          {isActive && (
            <DegradationBanner transcript={transcript} onOpenSettings={() => setShowSettings(true)} />
          )}
          {!isActive ? (
            /* Setup State Layout: Spacious welcome on left, case setup on right */
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              <div className="lg:col-span-8 h-full">
                <WelcomePanel
                  caseData={caseData}
                  onStart={onStart}
                  onOpenSettings={() => setShowSettings(true)}
                  isOpenRouterConfigured={isOpenRouterConfigured()}
                />
              </div>
              <div className="lg:col-span-4">
                <CaseSetupPanel caseData={caseData} onUpdateCase={onCaseUpdate} />
              </div>
            </motion.div>
          ) : (
            /* Simulation State Layout: Cinematic Stage + Grid of Panels */
            <motion.div
              key="simulation"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full"
            >
              {focusMode ? (
                <>
                  {/* Theater Layout - Left Column: Stage (col-span-8) */}
                  <div className="col-span-12 lg:col-span-8 relative glass-panel overflow-hidden w-full">
                    {/* Focus Mode toggle button */}
                    <button
                      id="focus-mode-toggle"
                      onClick={() => setFocusMode(false)}
                      className="absolute top-2 right-2 px-3 py-1 text-xs font-bold rounded-lg btn-ghost z-10"
                    >
                      Exit Focus Mode
                    </button>
                    <CourtroomStage {...stageProps} />
                  </div>

                  {/* Theater Layout - Right Column: Transcript (col-span-4) */}
                  <div className="col-span-12 lg:col-span-4 flex flex-col glass-panel overflow-hidden h-[600px] md:h-[650px]">
                    <div className="flex items-center justify-between border-b border-white/5 p-3 bg-white/[0.02]">
                      <span className="text-xs font-bold text-brass-300">📜 Transcript</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {verdict && currentPhase === 'verdict' ? (
                        <VerdictPanel verdict={verdict} evidence={evidence} objections={objectionHistory} />
                      ) : (
                        <TranscriptPanel transcript={transcript} currentPhase={phaseLabel} speech={speech} />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Normal Layout - Stage Hero (Full Width - col-span-12) */}
                  <div className="col-span-12 relative glass-panel overflow-hidden w-full">
                    {/* Focus Mode toggle button */}
                    <button
                      id="focus-mode-toggle"
                      onClick={() => setFocusMode(true)}
                      className="absolute top-2 right-2 px-3 py-1 text-xs font-bold rounded-lg btn-ghost z-10"
                      title="Focus / theater mode (F)"
                    >
                      Expand Courtroom
                    </button>
                    <CourtroomStage {...stageProps} />
                  </div>

                  {/* Normal Layout - Left/Main Column (col-span-12 lg:col-span-7) */}
                  <div className="col-span-12 lg:col-span-7 order-3 lg:order-1 space-y-6">
                    {isComplete && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                        className="glass-panel-brass p-5 md:p-6 space-y-6 relative overflow-hidden"
                      >
                        {/* Decorative background glow */}
                        <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-brass-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-brass-300 tracking-widest uppercase">Simulation Adjourned</span>
                            <h3 className="font-display text-xl md:text-2xl font-bold text-white tracking-wide mt-0.5">Final Case Disposition</h3>
                          </div>
                          <div className="px-3 py-1 glass-panel-brass !rounded-full text-xs font-bold text-brass-200">
                            Trial Completed ✅
                          </div>
                        </div>

                        {/* Winner & Loser Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Winner card */}
                          <motion.div
                            initial={{ opacity: 0, x: -18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden"
                          >
                            <div className="absolute right-3 top-3 text-3xl opacity-25">🏆</div>
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Prevailing Party</span>
                            <h4 className="text-lg font-bold text-white mt-1">
                              {verdict?.winnerName || (verdict?.decision === 'plaintiff_wins' ? caseData.plaintiffSide : caseData.defenseSide)}
                            </h4>
                            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                              <span className="font-semibold text-emerald-300">Why Winner Won: </span>
                              {verdict?.whyWinnerWon || verdict?.reasoningSummary}
                            </p>
                          </motion.div>

                          {/* Loser card */}
                          <motion.div
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-rose-950/20 border border-rose-500/25 rounded-xl p-4 relative overflow-hidden"
                          >
                            <div className="absolute right-3 top-3 text-3xl opacity-15">⚖️</div>
                            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Opposing Party</span>
                            <h4 className="text-lg font-bold text-gray-300 mt-1">
                              {verdict?.decision === 'plaintiff_wins' ? caseData.defenseSide : caseData.plaintiffSide}
                            </h4>
                            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                              <span className="font-semibold text-rose-300">Why Loser Did Not Win: </span>
                              {verdict?.whyLoserLost || "The arguments and exhibits introduced by this party were insufficient to establish preponderance of evidence over the opposing side's priority assertions."}
                            </p>
                          </motion.div>
                        </div>

                        {/* Key Reasons Considered */}
                        {((verdict?.keyReasons && verdict.keyReasons.length > 0) || (verdict?.plaintiffPoints && verdict.plaintiffPoints.length > 0)) && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Decisive Factors</h5>
                            <ul className="space-y-2">
                              {(verdict?.keyReasons || verdict?.plaintiffPoints || []).map((reason, idx) => (
                                <motion.li
                                  key={idx}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 + idx * 0.08 }}
                                  className="text-xs text-gray-300 flex items-start gap-2.5 glass-panel !rounded-lg p-2.5"
                                >
                                  <span className="text-brass-400 mt-0.5 select-none">🔨</span>
                                  <span className="leading-relaxed">{reason}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Evidence Considered */}
                        {((verdict?.evidenceConsidered && verdict.evidenceConsidered.length > 0) || evidence.length > 0) && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Evidence / Facts Weighed</h5>
                            <div className="flex flex-wrap gap-2">
                              {(verdict?.evidenceConsidered || evidence.filter(e => e.status === 'admitted').map(e => `${e.exhibitNumber || e.id}: ${e.title}`)).map((ev, idx) => (
                                <span key={idx} className="text-[11px] font-medium glass-panel !rounded-full text-gray-400 px-2.5 py-1 flex items-center gap-1.5">
                                  <span className="text-emerald-500">📎</span>
                                  {ev}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons inside the card */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-white/10">
                          {onRestartThisCase && (
                            <button
                              onClick={onRestartThisCase}
                              className="btn-brass w-full sm:w-auto px-5 py-2.5 text-xs"
                            >
                              🔄 Restart This Case
                            </button>
                          )}
                          {onBackToSetup && (
                            <button
                              onClick={onBackToSetup}
                              className="btn-ghost w-full sm:w-auto px-5 py-2.5 text-xs"
                            >
                              ⚙️ Back to Setup
                            </button>
                          )}
                          {onStartNewCase && (
                            <button
                              onClick={onStartNewCase}
                              className="btn-ghost w-full sm:w-auto px-5 py-2.5 text-xs text-sky-300"
                            >
                              📁 Start New Case
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {isComplete && userRole !== 'none' && (
                      <PlayerScorecard state={state} userRole={userRole} />
                    )}

                    {isComplete && <TrialHighlights state={state} />}
                    {isComplete && <AchievementsPanel refreshKey={statsTick} />}

                    {isActive && (
                      <CaseContextCard caseData={caseData} />
                    )}
                    <PhaseTimeline currentPhase={currentPhase} />

                    <div className="glass-panel p-4 space-y-4">
                      <div className="flex gap-2 border-b border-white/5 pb-3">
                        {[
                          { label: 'Evidence Board', active: !showTimeline && !showExhibitView, onClick: () => { setShowTimeline(false); setShowExhibitView(false); } },
                          { label: 'Evidence Timeline', active: showTimeline, onClick: () => { setShowTimeline(true); setShowExhibitView(false); } },
                          { label: 'Exhibits Folder', active: showExhibitView, onClick: () => { setShowExhibitView(true); setShowTimeline(false); } },
                        ].map(tab => (
                          <button
                            key={tab.label}
                            onClick={tab.onClick}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all duration-200 ${
                              tab.active
                                ? 'glass-panel-brass !rounded-lg text-brass-200'
                                : 'bg-white/[0.03] text-gray-400 border-white/5 hover:bg-white/[0.06] hover:text-gray-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {showTimeline ? (
                        <EvidenceTimeline evidence={evidence} />
                      ) : showExhibitView ? (
                        <ExhibitPanel exhibits={evidence} showRestricted={false} />
                      ) : (
                        <EvidenceBoard evidence={evidence} />
                      )}
                    </div>
                  </div>

                  {/* Normal Layout - Right Column (col-span-12 lg:col-span-5) */}
                  <div className="col-span-12 lg:col-span-5 order-2 lg:order-2">
                    <div className="flex flex-col glass-panel overflow-hidden h-full">
                      <div className="flex items-center justify-between border-b border-white/5 p-3 bg-white/[0.02]">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRightTab('transcript')}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                              rightTab === 'transcript'
                                ? 'glass-panel-brass !rounded-lg text-brass-200'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            📜 Transcript
                          </button>
                          <button
                            onClick={() => setRightTab('objections')}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                              rightTab === 'objections'
                                ? 'glass-panel-brass !rounded-lg text-brass-200'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            ⚖️ Records
                          </button>
                        </div>
                      </div>

                      {rightTab === 'transcript' ? (
                        <div className="h-[600px] md:h-[650px] flex flex-col overflow-y-auto">
                          {verdict && currentPhase === 'verdict' ? (
                            <VerdictPanel verdict={verdict} evidence={evidence} objections={objectionHistory} />
                          ) : (
                            <TranscriptPanel transcript={transcript} currentPhase={phaseLabel} speech={speech} />
                          )}
                        </div>
                      ) : (
                        <div className="h-[600px] md:h-[650px] overflow-y-auto p-4 space-y-4">
                          <ObjectionHistoryPanel objections={objectionHistory} onRuling={onObjectionRuling} />

                          <UsageDashboard transcript={transcript} />

                          {witnesses.length > 0 && <WitnessPanel witnesses={witnesses} />}
                          {motionHistory.length > 0 && (
                            <MotionPanel
                              motions={motionHistory}
                              onRuling={onMotionRuling}
                            />
                          )}

                          {currentPhase === 'jury_instructions' && (
                            <JuryInstructionPanel instructions={
                              transcript.find(t => t.speakerRole === 'judge' && t.phase === 'jury_instructions')?.message
                            } />
                          )}

                          {currentPhase === 'judge_deliberation' && (
                            <DeliberationPanel
                              summary={verdict?.deliberationSummary}
                              evidenceImpact="Exhibits E01-E04 reviewed. Speciation genetics validated."
                              witnessImpact={verdict?.witnessImpact}
                              motionImpact={verdict?.motionImpact}
                              objectionImpact="Objection to hearsay ruled upon by the court."
                            />
                          )}

                          {verdict?.jurors && verdict.jurors.length > 0 && (
                            <JuryPanel
                              jurors={verdict.jurors}
                              plaintiffName={caseData.plaintiffSide || 'Plaintiff'}
                              defenseName={caseData.defenseSide || 'Defense'}
                            />
                          )}

                          {(currentPhase === 'verdict' || currentPhase === 'case_summary') && (
                            <AppealPanel
                              grounds={verdict?.appealGrounds}
                              decision={verdict?.decision}
                            />
                          )}

                          <CaseSummaryReport state={state} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Normal Layout - Collapsible/Compact Profiles (col-span-12 lg:col-span-7) */}
                  <div className="col-span-12 lg:col-span-7 order-4 lg:order-3">
                    <div className="glass-panel p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Courtroom Profiles
                        </span>
                        <button
                          onClick={() => setLeftCollapsed(!leftCollapsed)}
                          className="btn-ghost text-[10px] px-2 py-1 !rounded-lg"
                        >
                          {leftCollapsed ? 'Expand Profiles ▼' : 'Collapse Profiles ▲'}
                        </button>
                      </div>

                      {!leftCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <AgentPanel
                            participant={participants.find(p => p.role === 'judge')!}
                            isCurrentSpeaker={currentSpeaker === 'judge'}
                            isActive={isActive}
                            modelInfo={getAgentModelInfo('judge')}
                          />
                          <AgentPanel
                            participant={participants.find(p => p.role === 'prosecutor')!}
                            isCurrentSpeaker={currentSpeaker === 'prosecutor'}
                            isActive={isActive}
                            modelInfo={getAgentModelInfo('prosecutor')}
                          />
                          <AgentPanel
                            participant={participants.find(p => p.role === 'defense')!}
                            isCurrentSpeaker={currentSpeaker === 'defense'}
                            isActive={isActive}
                            modelInfo={getAgentModelInfo('defense')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Sticky Bottom Control Bar */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-30 bg-ink-900/85 border-t border-white/5 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Phase</span>
            <span className="text-sm font-bold text-brass-300 font-display tracking-wide">{phaseLabel}</span>
          </div>

          <div className="flex flex-1 md:flex-initial items-center justify-center gap-3">
            {!isActive ? (
              <>
                {/* Play-a-role selector */}
                <div className="flex items-center gap-1.5 glass-panel !rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Play as</span>
                  <select
                    value={userRole}
                    onChange={e => onChangeUserRole?.(e.target.value as 'none' | 'prosecutor' | 'defense')}
                    className="bg-ink-800 border border-white/10 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-brass-500 font-medium"
                    title="Argue one side yourself, or watch the AI battle"
                  >
                    <option value="none">👀 Audience</option>
                    <option value="prosecutor">⚔️ Prosecutor</option>
                    <option value="defense">🛡️ Defense</option>
                    <option value="both">🎭 Both (Hot-seat)</option>
                  </select>
                </div>

                {/* Trial length selector */}
                <div className="flex items-center gap-1.5 glass-panel !rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Length</span>
                  <select
                    value={trialLength}
                    onChange={e => onChangeTrialLength?.(e.target.value as 'full' | 'quick')}
                    className="bg-ink-800 border border-white/10 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-brass-500 font-medium"
                    title="Quick trials skip secondary phases like cross-examination and motions"
                  >
                    <option value="full">🏛️ Full Trial</option>
                    <option value="quick">⚡ Quick Trial</option>
                  </select>
                </div>

                {/* Quality mode selector */}
                <div className="flex items-center gap-1.5 glass-panel !rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quality</span>
                  <select
                    value={qualityMode}
                    onChange={e => setQualityMode(e.target.value as 'fast' | 'high')}
                    className="bg-ink-800 border border-white/10 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-brass-500 font-medium"
                    title="High quality adds a self-critique revision pass to every AI argument (2x API calls, slower on the free tier)"
                  >
                    <option value="fast">🚀 Fast</option>
                    <option value="high">💎 High (self-critique)</option>
                  </select>
                </div>
                <button
                  onClick={onStart}
                  disabled={!isCaseSetupComplete(caseData)}
                  className={`w-full md:w-auto px-6 py-3 text-sm ${
                    isCaseSetupComplete(caseData)
                      ? 'btn-brass animate-pulse-glow'
                      : 'btn-ghost opacity-50 cursor-not-allowed'
                  }`}
                  title={isCaseSetupComplete(caseData) ? 'Start the simulation' : 'Case setup is incomplete'}
                >
                  ⚖️ Start Courtroom Simulation
                </button>
              </>
            ) : (
              <>
                {isComplete ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {onRestartThisCase && (
                      <button
                        onClick={onRestartThisCase}
                        className="btn-brass px-5 py-2.5 text-xs"
                      >
                        🔄 Restart This Case
                      </button>
                    )}
                    {onBackToSetup && (
                      <button
                        onClick={onBackToSetup}
                        className="btn-ghost px-5 py-2.5 text-xs"
                      >
                        ⚙️ Back to Setup
                      </button>
                    )}
                    {onStartNewCase && (
                      <button
                        onClick={onStartNewCase}
                        className="btn-ghost px-5 py-2.5 text-xs text-sky-300"
                      >
                        📁 Start New Case
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {isUserTurn ? (
                      /* Play-a-role argument dock */
                      <div className="flex flex-1 md:flex-initial items-center gap-2 glass-panel-brass !rounded-xl px-3 py-2 w-full md:min-w-[420px]">
                        <span className="text-lg shrink-0" title={userRole === 'both' ? `Hot-seat: ${nextSpeaker} speaks` : undefined}>
                          {nextSpeaker === 'prosecutor' ? '⚔️' : '🛡️'}
                        </span>
                        <textarea
                          value={userArgument}
                          onChange={e => setUserArgument(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey && userArgument.trim()) {
                              e.preventDefault();
                              onSubmitUserTurn?.(userArgument.trim());
                              setUserArgument('');
                            }
                          }}
                          placeholder={
                            currentPhase === 'witness_testimony'
                              ? 'Your turn, counsel — question the witness (answers appear in Records → Witness panel)…'
                              : `Your turn, counsel — make your argument for the ${nextSpeaker === 'prosecutor' ? 'plaintiff' : 'defense'}…`
                          }
                          rows={1}
                          className="flex-1 bg-ink-800/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brass-500 resize-none"
                        />
                        {speechRecognitionSupported && (
                          <button
                            onClick={toggleDictation}
                            className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 border transition-all ${
                              isDictating
                                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                            }`}
                            title={isDictating ? 'Stop dictation' : 'Dictate your argument by voice'}
                          >
                            {isDictating ? '⏺ Listening…' : '🎙️ Dictate'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (userArgument.trim()) {
                              recognitionRef.current?.stop();
                              setIsDictating(false);
                              onSubmitUserTurn?.(userArgument.trim());
                              setUserArgument('');
                            }
                          }}
                          disabled={!userArgument.trim()}
                          className="btn-brass px-4 py-2 text-xs shrink-0"
                        >
                          🎤 Address the Court
                        </button>
                      </div>
                    ) : hasPendingObjection ? (
                      /* Inline objection ruling dock — the court must rule to proceed */
                      <div className="flex items-center gap-2 glass-panel-brass !rounded-xl px-3 py-2 animate-pulse-glow">
                        {(() => {
                          const pending = objectionHistory.find(o => o.status === 'pending');
                          if (!pending) return null;
                          if (pending.id.startsWith('obj-player-')) {
                            return (
                              <span className="text-xs font-bold text-brass-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brass-400 animate-ping" />
                                The Court is considering your {pending.type.replace(/_/g, ' ')} objection…
                              </span>
                            );
                          }
                          return (
                            <>
                              <span className="text-xs font-black text-rose-300 uppercase tracking-wider hidden sm:inline">
                                ✋ Objection — Your Ruling:
                              </span>
                              <span className="text-[10px] text-gray-300 capitalize font-semibold hidden md:inline">
                                {pending.type.replace(/_/g, ' ')}
                              </span>
                              <button
                                onClick={() => onObjectionRuling?.(pending.id, true, pending.targetEvidence)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white active:scale-95 transition-all"
                              >
                                ❌ Sustain
                              </button>
                              <button
                                onClick={() => onObjectionRuling?.(pending.id, false, pending.targetEvidence)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 transition-all"
                              >
                                ✅ Overrule
                              </button>
                              {isAutoplay && !isAutoplayPaused && (
                                <span className="text-[9px] text-gray-400 italic hidden lg:inline">AI judge rules in 5s…</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                    <button
                      onClick={onNextTurn}
                      disabled={!canAdvance || isGenerating || (isAutoplay && !isAutoplayPaused)}
                      className={`w-full md:w-auto px-6 py-3 text-sm ${
                        canAdvance && !isGenerating && !(isAutoplay && !isAutoplayPaused)
                          ? 'btn-brass'
                          : 'btn-ghost opacity-60 cursor-not-allowed'
                      }`}
                      title="Advance the trial (Space or N)"
                    >
                      {isGenerating
                        ? '⏳ Generating...'
                        : (isAutoplay && !isAutoplayPaused)
                        ? '🤖 Autoplay...'
                        : 'Next Turn ➡️'}
                    </button>
                    )}

                    {/* Autoplay Controls */}
                    <div className="flex items-center gap-2 glass-panel !rounded-xl p-1">
                      <button
                        onClick={onToggleAutoplay}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 ${
                          isAutoplay
                            ? 'btn-brass !rounded-lg'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                        title="Toggle autoplay (A)"
                      >
                        {isAutoplay ? 'Auto ON' : 'Auto OFF'}
                      </button>

                      {isAutoplay && (
                        <>
                          <button
                            onClick={onToggleAutoplayPause}
                            className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                              isAutoplayPaused
                                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/30 hover:bg-emerald-950/60'
                                : 'bg-amber-950/40 text-amber-300 border border-amber-700/30 hover:bg-amber-950/60'
                            }`}
                          >
                            {isAutoplayPaused ? 'Resume' : 'Pause'}
                          </button>

                          <select
                            value={autoplaySpeed}
                            onChange={(e) => onChangeAutoplaySpeed?.(e.target.value as 'slow' | 'normal' | 'fast')}
                            className="bg-ink-800 border border-white/10 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brass-500 font-medium"
                          >
                            <option value="slow">Slow</option>
                            <option value="normal">Normal</option>
                            <option value="fast">Fast</option>
                          </select>
                        </>
                      )}
                    </div>

                    {onSkip && (
                      <button
                        onClick={onSkip}
                        disabled={isGenerating}
                        className="btn-ghost px-4 py-3 text-sm"
                      >
                        Skip ⏭️
                      </button>
                    )}

                    {/* Player objection button (play-a-role only) */}
                    {canPlayerObject && onPlayerObjection && (
                      <div className="relative">
                        <button
                          onClick={() => setShowObjectionPicker(v => !v)}
                          className="px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_4px_18px_rgba(244,63,94,0.4)] hover:brightness-110 active:scale-[0.96] transition-all"
                          title="Object to opposing counsel's last statement"
                        >
                          ✋ Object!
                        </button>
                        {showObjectionPicker && (
                          <div className="absolute bottom-full mb-2 right-0 glass-panel-brass !rounded-xl p-2 w-56 space-y-1 z-40">
                            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 pb-1">
                              Grounds for objection
                            </span>
                            {([
                              ['relevance', 'Relevance'],
                              ['hearsay', 'Hearsay'],
                              ['speculation', 'Speculation'],
                              ['lack_of_foundation', 'Lack of Foundation'],
                              ['argumentative', 'Argumentative'],
                            ] as [ObjectionType, string][]).map(([type, label]) => (
                              <button
                                key={type}
                                onClick={() => {
                                  setShowObjectionPicker(false);
                                  onPlayerObjection(type);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-200 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={sound.toggle}
              className="btn-ghost px-2.5 py-1.5 text-xs"
              title="Toggle sound effects (M)"
            >
              {sound.enabled ? '🔊' : '🔇'}
            </button>
            <span className="text-[10px] text-gray-600 tracking-[0.2em] uppercase">
              Judgebench Simulator
            </span>
          </div>
      </div>
      </div>

      {/* Case Library Modal */}
      {showLibrary && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowLibrary(false)}
        >
          <div
            className="glass-panel-brass max-w-md w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-brass-gradient tracking-wide">🗂️ Case Library</h3>
              <button
                onClick={() => setShowLibrary(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-sm font-bold"
                aria-label="Close case library"
              >
                ✕
              </button>
            </div>

            {/* Save current */}
            <div className="flex gap-2">
              <input
                value={libraryName}
                onChange={e => setLibraryName(e.target.value)}
                placeholder={caseData.title ? `e.g. ${caseData.title.slice(0, 30)}` : 'Slot name…'}
                className="flex-1 bg-ink-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brass-500"
              />
              <button
                onClick={() => {
                  const name = libraryName.trim() || caseData.title || `Case ${new Date().toLocaleString()}`;
                  onSaveToLibrary?.(name);
                  setLibraryName('');
                  setLibraryTick(t => t + 1);
                }}
                className="btn-brass px-3 py-2 text-xs shrink-0"
              >
                💾 Save Current
              </button>
            </div>

            {/* Slots */}
            <div className="space-y-2" key={`lib-${libraryTick}`}>
              {(listLibraryEntries?.() || []).length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  No saved cases yet. Save the current case to build your library.
                </p>
              ) : (
                (listLibraryEntries?.() || []).map(entry => (
                  <div key={entry.name} className="glass-panel !rounded-lg p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-200 truncate">{entry.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {entry.caseTitle} · {entry.phase.replace(/_/g, ' ')} · {new Date(entry.savedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onLoadFromLibrary?.(entry.name);
                        setShowLibrary(false);
                      }}
                      className="btn-ghost px-2.5 py-1.5 text-[10px] shrink-0"
                    >
                      📂 Load
                    </button>
                    <button
                      onClick={() => {
                        onDeleteFromLibrary?.(entry.name);
                        setLibraryTick(t => t + 1);
                      }}
                      className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-950/60 shrink-0"
                      title="Delete this saved case"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ProviderSettings
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setModelConfig(loadCourtroomConfig());
        }}
      />

      <ProviderRuntimeStatusPanel
        configs={modelConfig !== null ? modelConfig : DEFAULT_MODEL_CONFIG}
        onStatusChange={() => setStatusTick(t => t + 1)}
        key={`runtime-status-${statusTick}`}
      />

      <TelemetryDrawer isOpen={showTelemetry} onClose={() => setShowTelemetry(false)} />
    </div>
  );
}

const isCaseSetupComplete = (c: CaseData): boolean => {
  return !!(
    c.title?.trim() &&
    c.caseType?.trim() &&
    c.plaintiffSide?.trim() &&
    c.defenseSide?.trim() &&
    c.claimSummary?.trim()
  );
};

function CaseContextCard({ caseData }: { caseData: CaseData }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="glass-panel overflow-hidden transition-all duration-300">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] select-none transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-xs font-bold text-brass-300 uppercase tracking-widest">Active Case Context</span>
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-white/5 rounded-full truncate max-w-[200px] sm:max-w-xs">
            {caseData.title}
          </span>
        </div>
        <span className="text-gray-400 text-xs font-bold transition-transform duration-200">
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </span>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 border-t border-white/5' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 space-y-3 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sky-950/20 border border-sky-800/30 rounded-lg p-2.5">
              <span className="block text-[10px] text-sky-400 font-bold uppercase mb-0.5">Plaintiff</span>
              <span className="text-gray-200 font-medium">{caseData.plaintiffSide}</span>
            </div>
            <div className="bg-rose-950/20 border border-rose-800/30 rounded-lg p-2.5">
              <span className="block text-[10px] text-rose-400 font-bold uppercase mb-0.5">Defendant</span>
              <span className="text-gray-200 font-medium">{caseData.defenseSide}</span>
            </div>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Case Type</span>
            <span className="text-gray-300">{caseData.caseType}</span>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Claim Summary</span>
            <span className="text-gray-300 leading-relaxed">{caseData.claimSummary}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

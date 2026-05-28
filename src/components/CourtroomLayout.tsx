/**
 * CourtroomLayout — Main courtroom interface layout
 * Phase 16: Full courtroom stage integration
 */

import { useState, useEffect } from 'react';
import type { CourtState, CaseData, AgentRole, TranscriptEntry } from '../types/courtroom';
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
import { CourtroomStage } from './visuals/CourtroomStage';
import { WelcomePanel } from './WelcomePanel';
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
  const canAdvance = isActive && currentSpeaker !== null && !hasPendingObjection && !isComplete;

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

  // Spans configured statically

  return (
    <div className="min-h-screen bg-[#090d11] text-gray-100 flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0d131a] border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <span className="font-bold text-yellow-500 tracking-wider font-sans">JudgeBench</span>
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
        } lg:translate-x-0 lg:static lg:inset-auto transition-transform duration-300 ease-in-out z-40 w-64 bg-[#0d131a] border-r border-gray-800 flex flex-col justify-between shrink-0 h-screen lg:sticky lg:top-0`}
      >
        <div className="flex flex-col overflow-y-auto">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-850">
            <div className="w-10 h-10 rounded-xl bg-yellow-950/40 border border-yellow-750/30 flex items-center justify-center text-xl text-yellow-500 shadow-md">
              ⚖️
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-yellow-500 tracking-wider uppercase leading-none font-sans">
                JudgeBench
              </h1>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide">Courtroom Simulator</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-4 py-6 space-y-1.5">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2 font-sans">
              Simulator Menu
            </span>
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-yellow-950/35 border border-yellow-750/20 text-yellow-500 transition-all duration-200"
            >
              <span className="text-sm">⚖️</span>
              <span>Simulator Panel</span>
            </button>
            <button
              onClick={() => {
                setShowSettings(true);
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border border-transparent hover:border-gray-800 transition-all duration-200"
            >
              <span className="text-sm">⚙️</span>
              <span>Provider Configuration</span>
            </button>
            <button
              onClick={() => {
                if (onReset) onReset();
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border border-transparent hover:border-gray-800 transition-all duration-200 animate-none"
            >
              <span className="text-sm">🔄</span>
              <span>Reset Courtroom</span>
            </button>
          </div>

          {/* Session Actions (Save, Load, Clear) */}
          <div className="px-4 py-4 border-t border-gray-800/80 space-y-2">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2 font-sans">
              Simulation Sessions
            </span>
            {onSave && (
              <button
                onClick={onSave}
                disabled={isGenerating}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-blue-900/25 hover:bg-blue-800/30 border border-blue-800/20 hover:border-blue-700/30 text-blue-400 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
              >
                <span>💾</span>
                <span>Save Case Session</span>
              </button>
            )}
            {onLoad && (
              <button
                onClick={onLoad}
                disabled={isGenerating}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-purple-900/25 hover:bg-purple-800/30 border border-purple-800/20 hover:border-purple-700/30 text-purple-400 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
              >
                <span>📂</span>
                <span>Load Saved Case</span>
              </button>
            )}
            {onClear && hasSavedSession && (
              <button
                onClick={onClear}
                disabled={isGenerating}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-red-900/25 hover:bg-red-800/30 border border-red-800/20 hover:border-red-700/30 text-red-400 font-semibold rounded-xl transition-all duration-200 text-xs active:scale-[0.98] disabled:opacity-50"
              >
                <span>🗑️</span>
                <span>Clear Local Cache</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer / Gateway Status */}
        <div className="p-4 border-t border-gray-800/80 bg-[#0a0e14]">
          <div className="rounded-xl p-3 border border-gray-800 bg-[#0d131a] space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpenRouterConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">API Gateway</span>
            </div>
            <p className="text-[11px] font-bold text-gray-200 leading-tight">
              {isOpenRouterConfigured() ? 'OpenRouter Free Demo' : 'Mock Fallback Mode'}
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full text-center text-[10px] text-blue-400 hover:text-blue-300 font-bold hover:underline block pt-1.5 border-t border-gray-800 mt-2"
            >
              Gateway Settings ⚙️
            </button>
          </div>
          <p className="text-[9px] text-gray-500 text-center mt-3 tracking-wider">
            JUDGEBENCH SIMULATOR
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
        <div className="bg-[#0b0f15]/95 border-b border-gray-800/80 sticky top-0 z-20 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-400 mb-0.5">
              <span>COURTROOM STATE</span>
              <span>/</span>
              <span className="text-yellow-500 font-bold uppercase">
                {isActive ? phaseLabel : 'Awaiting Case File'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isActive && caseData?.title ? (
                <>
                  <span className="text-yellow-500">⚖️</span>
                  <span className="font-sans">{caseData.title}</span>
                </>
              ) : (
                'Simulation Sandbox'
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {isActive && currentSpeaker && (
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full text-xs shadow-inner">
                <span className="text-gray-400">Speaker:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    currentSpeaker === 'judge' ? 'bg-yellow-500 animate-pulse' :
                    currentSpeaker === 'prosecutor' ? 'bg-blue-500 animate-pulse' :
                    'bg-green-500 animate-pulse'
                  }`}></span>
                  {getParticipantName(state, currentSpeaker)}
                  <span className="opacity-60 text-[9px] font-mono">({currentSpeaker.toUpperCase()})</span>
                </span>
              </div>
            )}

            {isGenerating && (
              <div className="flex items-center gap-1.5 bg-yellow-950/40 text-yellow-500 px-3 py-1.5 rounded-full border border-yellow-500/20 text-xs animate-pulse font-bold">
                <span>⏳ Running Agent LLM...</span>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Grid Content */}
        <div className="p-4 md:p-6 space-y-6">
          {!isActive ? (
            /* Setup State Layout: Spacious welcome on left, case setup on right */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
            </div>
          ) : (
            /* Simulation State Layout: Cinematic Stage + Grid of Panels */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
              {focusMode ? (
                <>
                  {/* Theater Layout - Left Column: Stage (col-span-8) */}
                  <div className="col-span-12 lg:col-span-8 relative bg-[#0d131a] rounded-xl border border-gray-8-00 overflow-hidden shadow-lg w-full">
                    {/* Focus Mode toggle button */}
                    <button
                      id="focus-mode-toggle"
                      onClick={() => setFocusMode(false)}
                      className="absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded bg-gray-8-00 hover:bg-gray-700 border border-gray-6-00 text-gray-200 z-10 transition"
                    >
                      Exit Focus Mode
                    </button>
                    <CourtroomStage
                      judge={{
                        ...participants.find(p => p.role === 'judge')!,
                        modelInfo: getAgentModelInfo('judge')
                      }}
                      prosecutor={{
                        ...participants.find(p => p.role === 'prosecutor')!,
                        modelInfo: getAgentModelInfo('prosecutor')
                      }}
                      defense={{
                        ...participants.find(p => p.role === 'defense')!,
                        modelInfo: getAgentModelInfo('defense')
                      }}
                      currentSpeaker={stageEntry?.speakerRole || null}
                      isSpeaking={isStageTyping}
                      currentPhase={currentPhase}
                      isActive={isActive}
                      evidence={evidence}
                      activeObjection={objectionHistory.find(o => o.status === 'pending')}
                      showVerdict={currentPhase === 'verdict' && !!verdict}
                      verdict={verdict}
                      compact={false}
                      latestEntry={stageEntry}
                      isStageTyping={isStageTyping}
                      simulationSpeaker={currentSpeaker}
                      isGenerating={isGenerating}
                    />
                  </div>

                  {/* Theater Layout - Right Column: Transcript (col-span-4) */}
                  <div className="col-span-12 lg:col-span-4 flex flex-col bg-[#0d131a]/95 border border-gray-8-50 rounded-xl overflow-hidden shadow-2xl h-[600px] md:h-[650px]">
                    <div className="flex items-center justify-between border-b border-gray-800 p-3 bg-gray-950/40">
                      <span className="text-xs font-bold text-yellow-500">📜 Transcript</span>
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
                  <div className="col-span-12 relative bg-[#0d131a] rounded-xl border border-gray-8-00 overflow-hidden shadow-lg w-full">
                    {/* Focus Mode toggle button */}
                    <button
                      id="focus-mode-toggle"
                      onClick={() => setFocusMode(true)}
                      className="absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded bg-gray-8-00 hover:bg-gray-750 border border-gray-6-00 text-gray-250 z-10 transition"
                    >
                      Expand Courtroom
                    </button>
                    <CourtroomStage
                      judge={{
                        ...participants.find(p => p.role === 'judge')!,
                        modelInfo: getAgentModelInfo('judge')
                      }}
                      prosecutor={{
                        ...participants.find(p => p.role === 'prosecutor')!,
                        modelInfo: getAgentModelInfo('prosecutor')
                      }}
                      defense={{
                        ...participants.find(p => p.role === 'defense')!,
                        modelInfo: getAgentModelInfo('defense')
                      }}
                      currentSpeaker={stageEntry?.speakerRole || null}
                      isSpeaking={isStageTyping}
                      currentPhase={currentPhase}
                      isActive={isActive}
                      evidence={evidence}
                      activeObjection={objectionHistory.find(o => o.status === 'pending')}
                      showVerdict={currentPhase === 'verdict' && !!verdict}
                      verdict={verdict}
                      compact={false}
                      latestEntry={stageEntry}
                      isStageTyping={isStageTyping}
                      simulationSpeaker={currentSpeaker}
                      isGenerating={isGenerating}
                    />
                  </div>

                  {/* Normal Layout - Left/Main Column (col-span-12 lg:col-span-7) */}
                  <div className="col-span-12 lg:col-span-7 order-3 lg:order-1 space-y-6">
                    {isComplete && (
                      <div className="bg-gradient-to-br from-gray-900 via-gray-955 to-gray-900 border-2 border-yellow-500/40 rounded-xl p-5 md:p-6 shadow-2xl space-y-6 relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-855 pb-4 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-yellow-500 tracking-widest uppercase">Simulation Adjourned</span>
                            <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mt-0.5">Final Case Disposition</h3>
                          </div>
                          <div className="px-3 py-1 bg-yellow-955/40 border border-yellow-800/30 rounded-full text-xs font-bold text-yellow-400">
                            Trial Completed ✅
                          </div>
                        </div>

                        {/* Winner & Loser Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Winner card */}
                          <div className="bg-emerald-950/15 border border-emerald-500/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-3xl opacity-20">🏆</div>
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Prevailing Party</span>
                            <h4 className="text-lg font-bold text-white mt-1">
                              {verdict?.winnerName || (verdict?.decision === 'plaintiff_wins' ? caseData.plaintiffSide : caseData.defenseSide)}
                            </h4>
                            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                              <span className="font-semibold text-emerald-300">Why Winner Won: </span>
                              {verdict?.whyWinnerWon || verdict?.reasoningSummary}
                            </p>
                          </div>

                          {/* Loser card */}
                          <div className="bg-rose-950/15 border border-rose-500/20 rounded-xl p-4 shadow-sm relative overflow-hidden">
                            <div className="absolute right-3 top-3 text-3xl opacity-15">⚖️</div>
                            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Opposing Party</span>
                            <h4 className="text-lg font-bold text-gray-300 mt-1">
                              {verdict?.decision === 'plaintiff_wins' ? caseData.defenseSide : caseData.plaintiffSide}
                            </h4>
                            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                              <span className="font-semibold text-rose-300">Why Loser Did Not Win: </span>
                              {verdict?.whyLoserLost || "The arguments and exhibits introduced by this party were insufficient to establish preponderance of evidence over the opposing side's priority assertions."}
                            </p>
                          </div>
                        </div>

                        {/* Key Reasons Considered */}
                        {((verdict?.keyReasons && verdict.keyReasons.length > 0) || (verdict?.plaintiffPoints && verdict.plaintiffPoints.length > 0)) && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Key Decisive Factors</h5>
                            <ul className="space-y-2">
                              {(verdict?.keyReasons || verdict?.plaintiffPoints || []).map((reason, idx) => (
                                <li key={idx} className="text-xs text-gray-305 flex items-start gap-2.5 bg-gray-900/60 p-2.5 rounded-lg border border-gray-850">
                                  <span className="text-yellow-500 mt-0.5 select-none">🔨</span>
                                  <span className="leading-relaxed">{reason}</span>
                                </li>
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
                                <span key={idx} className="text-[11px] font-medium bg-gray-900 border border-gray-800 text-gray-400 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                  <span className="text-emerald-500">📎</span>
                                  {ev}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons inside the card */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-gray-850">
                          {onRestartThisCase && (
                            <button
                              onClick={onRestartThisCase}
                              className="w-full sm:w-auto px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all duration-200 text-xs flex items-center justify-center gap-2"
                            >
                              🔄 Restart This Case
                            </button>
                          )}
                          {onBackToSetup && (
                            <button
                              onClick={onBackToSetup}
                              className="w-full sm:w-auto px-5 py-2.5 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold rounded-xl border border-gray-800 active:scale-[0.98] transition-all duration-200 text-xs flex items-center justify-center gap-2"
                            >
                              ⚙️ Back to Setup
                            </button>
                          )}
                          {onStartNewCase && (
                            <button
                              onClick={onStartNewCase}
                              className="w-full sm:w-auto px-5 py-2.5 bg-blue-955/30 hover:bg-blue-900/40 text-blue-400 font-bold rounded-xl border border-blue-900/30 active:scale-[0.98] transition-all duration-200 text-xs flex items-center justify-center gap-2"
                            >
                              📁 Start New Case
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {isActive && (
                      <CaseContextCard caseData={caseData} />
                    )}
                    <PhaseTimeline currentPhase={currentPhase} />

                    <div className="bg-[#0d131a] rounded-xl border border-gray-850 p-4 space-y-4">
                      <div className="flex gap-2 border-b border-gray-800 pb-3">
                        <button
                          onClick={() => { setShowTimeline(false); setShowExhibitView(false); }}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all duration-200 ${
                            !showTimeline && !showExhibitView
                              ? 'bg-yellow-955/40 text-yellow-500 border-yellow-750/30' 
                              : 'bg-gray-800/40 text-gray-400 border-gray-700/50 hover:bg-gray-800/60'
                          }`}
                        >
                          Evidence Board
                        </button>
                        <button
                          onClick={() => { setShowTimeline(true); setShowExhibitView(false); }}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all duration-200 ${
                            showTimeline 
                              ? 'bg-yellow-955/40 text-yellow-500 border-yellow-750/30' 
                              : 'bg-gray-800/40 text-gray-400 border-gray-700/50 hover:bg-gray-800/60'
                          }`}
                        >
                          Evidence Timeline
                        </button>
                        <button
                          onClick={() => { setShowExhibitView(true); setShowTimeline(false); }}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all duration-200 ${
                            showExhibitView 
                              ? 'bg-yellow-955/40 text-yellow-500 border-yellow-750/30' 
                              : 'bg-gray-800/40 text-gray-400 border-gray-700/50 hover:bg-gray-800/60'
                          }`}
                        >
                          Exhibits Folder
                        </button>
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
                    <div className="flex flex-col bg-[#0d131a]/95 border border-gray-850 rounded-xl overflow-hidden shadow-2xl h-full">
                      <div className="flex items-center justify-between border-b border-gray-800 p-3 bg-gray-955/40">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRightTab('transcript')}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                              rightTab === 'transcript'
                                ? 'bg-yellow-955/40 text-yellow-500 border-yellow-750/30'
                                : 'text-gray-400 hover:text-gray-250 hover:bg-gray-800/40 border border-transparent'
                            }`}
                          >
                            📜 Transcript
                          </button>
                          <button
                            onClick={() => setRightTab('objections')}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                              rightTab === 'objections'
                                ? 'bg-yellow-955/40 text-yellow-500 border-yellow-750/30'
                                : 'text-gray-400 hover:text-gray-250 hover:bg-gray-800/40 border border-transparent'
                            }`}
                          >
                            ⚖️ Records
                          </button>
                        </div>
                      </div>

                      {rightTab === 'transcript' ? (
                        <div className="h-[600px] md:h-[650px] flex flex-col bg-[#0d131a] overflow-y-auto">
                          {verdict && currentPhase === 'verdict' ? (
                            <VerdictPanel verdict={verdict} evidence={evidence} objections={objectionHistory} />
                          ) : (
                            <TranscriptPanel transcript={transcript} currentPhase={phaseLabel} speech={speech} />
                          )}
                        </div>
                      ) : (
                        <div className="h-[600px] md:h-[650px] overflow-y-auto p-4 space-y-4">
                          <ObjectionHistoryPanel objections={objectionHistory} onRuling={onObjectionRuling} />

                          {(currentPhase === 'witness_testimony' || currentPhase === 'motion_hearing' || currentPhase === 'cross_examination') && (
                            <>
                              <WitnessPanel witnesses={witnesses} />
                              <MotionPanel 
                                motions={motionHistory} 
                                onRuling={(mid, granted) => { 
                                  console.log('Motion ruling:', mid, granted); 
                                }} 
                              />
                            </>
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
                    <div className="bg-[#0d131a] rounded-xl border border-gray-850 p-4 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between border-b border-gray-855 pb-2">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest font-sans">
                          Courtroom Profiles
                        </span>
                        <button
                          onClick={() => setLeftCollapsed(!leftCollapsed)}
                          className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-850 hover:bg-gray-800 border border-gray-800 transition-all duration-150"
                        >
                          {leftCollapsed ? 'Expand Profiles ▼' : 'Collapse Profiles ▲'}
                        </button>
                      </div>

                      {!leftCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-scale-in">
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
            </div>
          )}
        </div>

        {/* Sticky Bottom Control Bar */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-30 bg-[#0d131a]/95 border-t border-gray-800/80 backdrop-blur-md px-6 py-4 shadow-xl flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Phase</span>
            <span className="text-sm font-bold text-yellow-500">{phaseLabel}</span>
          </div>

          <div className="flex flex-1 md:flex-initial items-center justify-center gap-3">
            {!isActive ? (
              <button
                onClick={onStart}
                disabled={!isCaseSetupComplete(caseData)}
                className={`w-full md:w-auto px-6 py-3 font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                  isCaseSetupComplete(caseData)
                    ? 'bg-yellow-600 hover:bg-yellow-500 active:scale-[0.98] shadow-yellow-950/20 text-white animate-pulse-glow'
                    : 'bg-gray-850 text-gray-500 cursor-not-allowed border border-gray-800'
                }`}
                title={isCaseSetupComplete(caseData) ? 'Start the simulation' : 'Case setup is incomplete'}
              >
                ⚖️ Start Courtroom Simulation
              </button>
            ) : (
              <>
                {isComplete ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {onRestartThisCase && (
                      <button
                        onClick={onRestartThisCase}
                        className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all duration-200 text-xs"
                      >
                        🔄 Restart This Case
                      </button>
                    )}
                    {onBackToSetup && (
                      <button
                        onClick={onBackToSetup}
                        className="px-5 py-2.5 bg-gray-850 hover:bg-gray-800 text-gray-300 font-bold rounded-xl border border-gray-800 active:scale-[0.98] transition-all duration-200 text-xs"
                      >
                        ⚙️ Back to Setup
                      </button>
                    )}
                    {onStartNewCase && (
                      <button
                        onClick={onStartNewCase}
                        className="px-5 py-2.5 bg-blue-950/30 hover:bg-blue-900/40 text-blue-400 font-bold rounded-xl border border-blue-900/30 active:scale-[0.98] transition-all duration-200 text-xs"
                      >
                        📁 Start New Case
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={onNextTurn}
                      disabled={!canAdvance || isGenerating || (isAutoplay && !isAutoplayPaused)}
                      className={`w-full md:w-auto px-6 py-3 font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm active:scale-[0.98] ${
                        canAdvance && !isGenerating && !(isAutoplay && !isAutoplayPaused)
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
                          : 'bg-gray-850 text-gray-500 cursor-not-allowed border border-gray-800'
                      }`}
                    >
                      {isGenerating 
                        ? '⏳ Generating...' 
                        : hasPendingObjection 
                        ? 'Awaiting Ruling... ⚖️' 
                        : (isAutoplay && !isAutoplayPaused) 
                        ? '🤖 Autoplay...' 
                        : 'Next Turn ➡️'}
                    </button>

                    {/* Autoplay Controls */}
                    <div className="flex items-center gap-2 bg-[#090d11] border border-gray-800 rounded-xl p-1 shadow-inner">
                      <button
                        onClick={onToggleAutoplay}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 ${
                          isAutoplay
                            ? 'bg-yellow-600 text-white hover:bg-yellow-500 shadow-sm'
                            : 'bg-gray-850 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        {isAutoplay ? 'Auto ON' : 'Auto OFF'}
                      </button>

                      {isAutoplay && (
                        <>
                          <button
                            onClick={onToggleAutoplayPause}
                            className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                              isAutoplayPaused
                                ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/30 hover:bg-emerald-950/50'
                                : 'bg-amber-950/30 text-amber-400 border border-amber-800/30 hover:bg-amber-950/50'
                            }`}
                          >
                            {isAutoplayPaused ? 'Resume' : 'Pause'}
                          </button>

                          <select
                            value={autoplaySpeed}
                            onChange={(e) => onChangeAutoplaySpeed?.(e.target.value as 'slow' | 'normal' | 'fast')}
                            className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-yellow-500 font-medium"
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
                        className="px-4 py-3 bg-[#131a24] hover:bg-[#1a2533] text-gray-300 font-semibold rounded-xl border border-gray-800 transition-all duration-200 text-sm active:scale-[0.98]"
                      >
                        Skip ⏭️
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:block">
            <span className="text-[10px] text-gray-500 tracking-wider">
              JUDGEBENCH SIMULATOR
            </span>
          </div>
      </div>
      </div>

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
    <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/40 select-none transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Active Case Context</span>
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-800 rounded-full truncate max-w-[200px] sm:max-w-xs">
            {caseData.title}
          </span>
        </div>
        <span className="text-gray-400 text-xs font-bold transition-transform duration-200">
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </span>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 border-t border-gray-800' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 space-y-3 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-lg p-2.5">
              <span className="block text-[10px] text-emerald-400 font-bold uppercase mb-0.5">Plaintiff</span>
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

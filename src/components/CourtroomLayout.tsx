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
  isStageTyping
}: CourtroomLayoutProps) {
  const { currentPhase, currentSpeaker, participants, transcript, evidence, verdict, case: caseData, isActive, objectionHistory, witnesses, motionHistory } = state;
  const phaseLabel = PHASE_LABELS[currentPhase];
  const [showSettings, setShowSettings] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showExhibitView, setShowExhibitView] = useState(false);
  const [modelConfig, setModelConfig] = useState<CourtroomModelConfig | null>(null);
  const [statusTick, setStatusTick] = useState(0);

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

  const canAdvance = isActive && currentSpeaker !== null;

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

  return (
    <div className="min-h-screen bg-courtroom-bg p-4 md:p-6 pb-52 sm:pb-36 md:pb-40">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="text-center py-4 border-b border-gray-700">
          <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-2">
            ⚖️ JudgeBench
          </h1>
          <p className="text-sm text-gray-400">
            AI Courtroom Simulator — Education & Experimentation
          </p>
        </header>

        {/* Sticky Top Status & Speaker Banner */}
        <div className="sticky top-[16px] z-40 bg-gray-900/90 backdrop-blur-md border border-gray-700/60 shadow-lg py-2 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Status:</span>
            <span className="text-sm font-semibold text-yellow-500">{isActive ? phaseLabel : 'Awaiting Setup'}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isActive && currentSpeaker && (
              <div className="flex items-center gap-2 bg-gray-950/60 px-3 py-1 rounded-full border border-gray-800">
                <span className="text-xs text-gray-400">Active:</span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    currentSpeaker === 'judge' ? 'bg-yellow-500 animate-pulse' :
                    currentSpeaker === 'prosecutor' ? 'bg-blue-500 animate-pulse' :
                    'bg-green-500 animate-pulse'
                  }`}></span>
                  {getParticipantName(state, currentSpeaker)} 
                  <span className="opacity-60 text-[10px]">({currentSpeaker.toUpperCase()})</span>
                </span>
              </div>
            )}
            
            {isGenerating && (
              <div className="flex items-center gap-1.5 bg-yellow-950/40 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20 text-xs animate-pulse">
                <span>⏳ Generating response...</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Courtroom Stage - Cinematic top */}
          {isActive && (
            <div className="lg:col-span-12">
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
          )}
          
          <div className="lg:col-span-3 space-y-4">
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

          <div className="lg:col-span-6 space-y-4">
            <PhaseTimeline currentPhase={currentPhase} />
            <div className="h-[600px] md:h-[650px] flex flex-col">
              {verdict && currentPhase === 'verdict' ? (
                <VerdictPanel verdict={verdict} evidence={evidence} objections={objectionHistory} />
              ) : (
                <TranscriptPanel transcript={transcript} currentPhase={phaseLabel} speech={speech} />
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {currentPhase === 'case_setup' ? (
              <CaseSetupPanel caseData={caseData} onUpdateCase={onCaseUpdate} />
            ) : (
              <>
                {/* Phase 8: Add toggle for evidence timeline or standard view */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    className={`text-xs px-2 py-1 rounded ${showTimeline ? 'bg-blue-700' : 'bg-gray-700'} text-gray-300`}
                  >
                    {showTimeline ? 'Timeline' : 'Evidence'}
                  </button>
                  <button
                    onClick={() => setShowExhibitView(!showExhibitView)}
                    className={`text-xs px-2 py-1 rounded ${showExhibitView ? 'bg-purple-700' : 'bg-gray-700'} text-gray-300`}
                  >
                    Exhibits
                  </button>
                </div>
                
                {showTimeline ? (
                  <EvidenceTimeline evidence={evidence} />
                ) : showExhibitView ? (
                  <ExhibitPanel exhibits={evidence} showRestricted={false} />
                ) : (
                  <EvidenceBoard evidence={evidence} />
                )}
                
                <ObjectionHistoryPanel objections={objectionHistory} onRuling={onObjectionRuling} />

                {/* Phase 9: Witness and Motion panels */}
                {(currentPhase === 'witness_testimony' || currentPhase === 'motion_hearing' || currentPhase === 'cross_examination') && (
                  <>
                    <WitnessPanel witnesses={witnesses} />
                    <MotionPanel 
                      motions={motionHistory} 
                      onRuling={(mid, granted) => { 
                        // Simple handler - will integrate with parent
                        console.log('Motion ruling:', mid, granted); 
                      }} 
                    />
                  </>
                )}

                {/* Phase 11: Jury Instructions */}
                {currentPhase === 'jury_instructions' && (
                  <JuryInstructionPanel instructions={
                    transcript.find(t => t.speakerRole === 'judge' && t.phase === 'jury_instructions')?.message
                  } />
                )}

                {/* Phase 12: Deliberation Chamber */}
                {currentPhase === 'judge_deliberation' && (
                  <DeliberationPanel 
                    summary={verdict?.deliberationSummary}
                    evidenceImpact="Exhibits E01-E04 reviewed. Force majeure valid for April."
                    witnessImpact={verdict?.witnessImpact}
                    motionImpact={verdict?.motionImpact}
                    objectionImpact="Prosecution objection to hearsay GRANTED. Defense relevance challenge OVERRULED."
                  />
                )}

                {/* Phase 12: Appeal Grounds (show after verdict/case_summary) */}
                {(currentPhase === 'verdict' || currentPhase === 'case_summary') && (
                  <AppealPanel 
                    grounds={verdict?.appealGrounds}
                    decision={verdict?.decision}
                  />
                )}

                {/* Phase 8: Case summary report */}
                <CaseSummaryReport state={state} />
              </>
            )}
          </div>
        </div>

        <footer className="text-center py-4 border-t border-gray-700 mt-8">
          <p className="text-xs text-gray-500">
            ⚠️ DISCLAIMER: This is an AI courtroom simulation for education and experimentation only.
            It is not legal advice and should not be used for any legal proceeding.
          </p>
        </footer>
      </div>

      <ProviderSettings 
        isOpen={showSettings} 
        onClose={() => {
          setShowSettings(false);
          setModelConfig(loadCourtroomConfig());
        }} 
      />
      
      {/* Provider Runtime Status */}
      <ProviderRuntimeStatusPanel 
        configs={modelConfig !== null ? modelConfig : DEFAULT_MODEL_CONFIG} 
        onStatusChange={() => setStatusTick(t => t + 1)}
        key={`runtime-status-${statusTick}`}
      />

      {/* Sticky Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-md border-t border-gray-700/60 shadow-[0_-8px_30px_rgb(0,0,0,0.5)] px-4 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left part: Phase info */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Phase:</span>
            <span className="text-sm font-bold text-yellow-500">{phaseLabel}</span>
          </div>

          {/* Center part: Main control buttons */}
          <div className="flex flex-1 sm:flex-initial items-center justify-center gap-2 md:gap-3 w-full sm:w-auto">
            {!isActive ? (
              <button
                onClick={onStart}
                className="w-full sm:w-auto px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-white font-bold rounded-lg shadow-lg shadow-yellow-900/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base animate-pulse"
              >
                ▶️ Start Simulation
              </button>
            ) : (
              <>
                <button
                  onClick={onNextTurn}
                  disabled={!canAdvance || isGenerating || (isAutoplay && !isAutoplayPaused)}
                  className={`w-full sm:w-auto px-6 py-2.5 font-bold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base active:scale-95 ${
                    canAdvance && !isGenerating && !(isAutoplay && !isAutoplayPaused)
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isGenerating ? '⏳ Generating...' : (isAutoplay && !isAutoplayPaused) ? '🤖 Autoplay...' : 'Next Turn ➡️'}
                </button>

                {/* Autoplay Controls */}
                <div className="flex items-center gap-1.5 bg-gray-800/80 border border-gray-700 rounded-lg p-1">
                  <button
                    onClick={onToggleAutoplay}
                    className={`px-3 py-1 rounded font-semibold text-xs md:text-sm transition-all duration-200 ${
                      isAutoplay
                        ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-650'
                    }`}
                    title={isAutoplay ? 'Turn off autoplay' : 'Turn on autoplay'}
                  >
                    {isAutoplay ? '🤖 Auto ON' : '🤖 Auto OFF'}
                  </button>

                  {isAutoplay && (
                    <>
                      <button
                        onClick={onToggleAutoplayPause}
                        className={`px-2 py-1 rounded font-semibold text-xs md:text-sm transition-all duration-200 ${
                          isAutoplayPaused
                            ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40'
                            : 'bg-amber-600/30 text-amber-400 border border-amber-500/30 hover:bg-amber-600/40'
                        }`}
                      >
                        {isAutoplayPaused ? '▶️ Resume' : '⏸️ Pause'}
                      </button>

                      <select
                        value={autoplaySpeed}
                        onChange={(e) => onChangeAutoplaySpeed?.(e.target.value as 'slow' | 'normal' | 'fast')}
                        className="bg-gray-900 border border-gray-700 text-gray-300 text-xs md:text-sm rounded px-1 py-1 focus:outline-none focus:border-yellow-500 font-medium"
                        title="Select Autoplay Speed"
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
                    className="px-3 md:px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg border border-gray-700 transition-all duration-200 text-xs md:text-sm active:scale-95"
                    title="Skip Phase"
                  >
                    ⏭️ Skip
                  </button>
                )}
              </>
            )}

            {onSave && (
              <button
                onClick={onSave}
                disabled={isGenerating}
                className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all duration-200 text-xs md:text-sm active:scale-95"
                title="Save Simulation"
              >
                💾 Save
              </button>
            )}

            {onLoad && (
              <button
                onClick={onLoad}
                disabled={isGenerating}
                className="px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-all duration-200 text-xs md:text-sm active:scale-95"
                title="Load Simulation"
              >
                📂 Load
              </button>
            )}

            {onClear && hasSavedSession && (
              <button
                onClick={onClear}
                disabled={isGenerating}
                className="px-3 md:px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-all duration-200 text-xs md:text-sm active:scale-95"
                title="Clear Saved Session"
              >
                🗑️ Clear
              </button>
            )}

            {isActive && (
              <button
                onClick={onReset}
                disabled={isGenerating}
                className="px-3 md:px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg border border-gray-700 transition-all duration-200 text-xs md:text-sm active:scale-95"
                title="Reset Simulation"
              >
                🔄 Reset
              </button>
            )}
          </div>

          {/* Right part: Provider Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg border border-gray-700 transition-all duration-200 flex items-center justify-center gap-1.5 text-xs md:text-sm active:scale-95"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );
}

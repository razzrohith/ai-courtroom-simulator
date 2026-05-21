/**
 * CourtroomLayout — Main courtroom interface layout
 */

import { useState, useEffect } from 'react';
import type { CourtState } from '../types/courtroom';
import { PHASE_LABELS } from '../types/courtroom';
import type { AgentRole } from '../types/courtroom';
import { loadCourtroomConfig, CourtroomModelConfig, isProviderPlaceholder, AgentModelConfig, DEFAULT_MODEL_CONFIG } from '../types/providers';
import { AgentPanel } from './AgentPanel';
import { TranscriptPanel } from './TranscriptPanel';
import { EvidenceBoard } from './EvidenceBoard';
import { PhaseTimeline } from './PhaseTimeline';
import { VerdictPanel } from './VerdictPanel';
import { CaseSetupPanel } from './CaseSetupPanel';
import { ProviderSettings } from './ProviderSettings';
import { ProviderRuntimeStatusPanel } from './ProviderRuntimeStatus';

interface AgentModelInfo {
  providerId: string;
  model: string;
  mode: string;
  isPlaceholder: boolean;
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
  isGenerating?: boolean;
  hasSavedSession?: boolean;
}

export function CourtroomLayout({ state, onStart, onNextTurn, onReset, onSkip, onSave, onLoad, onClear, isGenerating = false, hasSavedSession = false }: CourtroomLayoutProps) {
  const { currentPhase, currentSpeaker, participants, transcript, evidence, verdict, case: caseData, isActive } = state;
  const phaseLabel = PHASE_LABELS[currentPhase];
  const [showSettings, setShowSettings] = useState(false);
  const [modelConfig, setModelConfig] = useState<CourtroomModelConfig | null>(null);

  useEffect(() => {
    const config = loadCourtroomConfig();
    setModelConfig(config);
  }, []);

  const currentPhaseTranscript = transcript.filter(t => t.phase === currentPhase);
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
    };
  };

  return (
    <div className="min-h-screen bg-courtroom-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="text-center py-4 border-b border-gray-700">
          <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-2">
            ⚖️ JudgeBench
          </h1>
          <p className="text-sm text-gray-400">
            AI Courtroom Simulator — Education & Experimentation
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-center gap-3 py-3">
          {!isActive ? (
            <button
              onClick={onStart}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-lg transition-smooth"
            >
              ▶️ Start Simulation
            </button>
          ) : (
            <>
              <button
                onClick={onNextTurn}
                disabled={!canAdvance || isGenerating}
                className={`px-6 py-2 font-medium rounded-lg transition-smooth ${
                  canAdvance && !isGenerating 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? '⏳ Generating...' : 'Next Turn ➡️'}
              </button>
              
              {onSkip && (
                <button
                  onClick={onSkip}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-smooth"
                >
                  ⏭️ Skip Phase
                </button>
              )}
              
              {onSave && (
                <button
                  onClick={onSave}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-smooth"
                >
                  💾 Save
                </button>
              )}
              
              {onLoad && (
                <button
                  onClick={onLoad}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-smooth"
                >
                  {hasSavedSession ? '📂 Load' : '📂 Load'}
                </button>
              )}
              
              {onClear && hasSavedSession && (
                <button
                  onClick={onClear}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-smooth"
                >
                  🗑️ Clear
                </button>
              )}
              
              <button
                onClick={onReset}
                disabled={isGenerating}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-smooth"
              >
                🔄 Reset
              </button>
            </>
          )}
          
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-smooth"
          >
            ⚙️ Provider Settings
          </button>
          
          <div className="px-4 py-2 bg-courtroom-card border border-gray-700 rounded-lg">
            <span className="text-sm text-gray-400">Phase: </span>
            <span className="text-sm font-medium text-yellow-500">{phaseLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
            <div className="h-[500px]">
              {verdict && currentPhase === 'verdict' ? (
                <VerdictPanel verdict={verdict} />
              ) : (
                <TranscriptPanel transcript={currentPhaseTranscript} currentPhase={phaseLabel} />
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {currentPhase === 'case_setup' ? (
              <CaseSetupPanel caseData={caseData} />
            ) : (
              <EvidenceBoard evidence={evidence} />
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
      <ProviderRuntimeStatusPanel configs={modelConfig !== null ? modelConfig : DEFAULT_MODEL_CONFIG} />
    </div>
  );
}

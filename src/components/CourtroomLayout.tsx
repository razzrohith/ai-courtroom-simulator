/**
 * CourtroomLayout — Main courtroom interface layout
 */

import type { CourtState } from '../types/courtroom';
import { PHASE_LABELS } from '../types/courtroom';
import { AgentPanel } from './AgentPanel';
import { TranscriptPanel } from './TranscriptPanel';
import { EvidenceBoard } from './EvidenceBoard';
import { PhaseTimeline } from './PhaseTimeline';
import { VerdictPanel } from './VerdictPanel';
import { AgentConfigPanel } from './AgentConfigPanel';
import { CaseSetupPanel } from './CaseSetupPanel';

interface CourtroomLayoutProps {
  state: CourtState;
  onStart: () => void;
  onNextTurn: () => void;
  onReset: () => void;
}

export function CourtroomLayout({ state, onStart, onNextTurn, onReset }: CourtroomLayoutProps) {
  const { currentPhase, currentSpeaker, participants, transcript, evidence, verdict, case: caseData, isActive } = state;
  const phaseLabel = PHASE_LABELS[currentPhase];
  
  // Get current phase transcript
  const currentPhaseTranscript = transcript.filter(t => t.phase === currentPhase);
  
  // Determine if we can proceed to next turn
  const canAdvance = isActive && currentSpeaker !== null;

  return (
    <div className="min-h-screen bg-courtroom-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <header className="text-center py-4 border-b border-gray-700">
          <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 mb-2">
            ⚖️ JudgeBench
          </h1>
          <p className="text-sm text-gray-400">
            AI Courtroom Simulator — Education & Experimentation
          </p>
        </header>

        {/* Control bar */}
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
                disabled={!canAdvance}
                className={`px-6 py-2 font-medium rounded-lg transition-smooth ${
                  canAdvance 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next Turn ➡️
              </button>
              <button
                onClick={onReset}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-smooth"
              >
                🔄 Reset
              </button>
            </>
          )}
          
          {/* Phase indicator */}
          <div className="px-4 py-2 bg-courtroom-card border border-gray-700 rounded-lg">
            <span className="text-sm text-gray-400">Phase: </span>
            <span className="text-sm font-medium text-yellow-500">{phaseLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left sidebar - Agents */}
          <div className="lg:col-span-3 space-y-4">
            {/* Judge */}
            <AgentPanel
              participant={participants.find(p => p.role === 'judge')!}
              isCurrentSpeaker={currentSpeaker === 'judge'}
              isActive={isActive}
            />
            
            {/* Prosecutor */}
            <AgentPanel
              participant={participants.find(p => p.role === 'prosecutor')!}
              isCurrentSpeaker={currentSpeaker === 'prosecutor'}
              isActive={isActive}
            />
            
            {/* Defense */}
            <AgentPanel
              participant={participants.find(p => p.role === 'defense')!}
              isCurrentSpeaker={currentSpeaker === 'defense'}
              isActive={isActive}
            />
            
            {/* Model Config Preview */}
            <AgentConfigPanel 
              participants={participants}
              currentSpeaker={currentSpeaker}
            />
          </div>

          {/* Main content */}
          <div className="lg:col-span-6 space-y-4">
            {/* Phase Timeline */}
            <PhaseTimeline currentPhase={currentPhase} />
            
            {/* Main transcript area */}
            <div className="h-[500px]">
              {verdict && currentPhase === 'verdict' ? (
                <VerdictPanel verdict={verdict} />
              ) : (
                <TranscriptPanel 
                  transcript={currentPhaseTranscript}
                  currentPhase={phaseLabel}
                />
              )}
            </div>
          </div>

          {/* Right sidebar - Evidence & Case info */}
          <div className="lg:col-span-3 space-y-4">
            {currentPhase === 'case_setup' ? (
              <CaseSetupPanel caseData={caseData} />
            ) : (
              <EvidenceBoard evidence={evidence} />
            )}
          </div>
        </div>

        {/* Footer disclaimer */}
        <footer className="text-center py-4 border-t border-gray-700 mt-8">
          <p className="text-xs text-gray-500">
            ⚠️ DISCLAIMER: This is an AI courtroom simulation for education and experimentation only. 
            It is not legal advice and should not be used for any legal proceeding.
          </p>
        </footer>
      </div>
    </div>
  );
}

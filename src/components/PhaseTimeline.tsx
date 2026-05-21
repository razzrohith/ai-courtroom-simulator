/**
 * PhaseTimeline — Visual timeline showing all courtroom phases
 * Phase 15: Improved visual timeline with icons
 */

import { COURT_PHASES, PHASE_LABELS } from '../types/courtroom';
import type { CourtPhase } from '../types/courtroom';

interface PhaseTimelineProps {
  currentPhase: CourtPhase;
}

export function PhaseTimeline({ currentPhase }: PhaseTimelineProps) {
  const currentIndex = COURT_PHASES.indexOf(currentPhase);

  return (
    <div className="bg-courtroom-card rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-medium text-yellow-500 mb-3 uppercase tracking-wider">
        Proceeding Timeline
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {COURT_PHASES.map((phase, index) => {
          const isActive = phase === currentPhase;
          const isPast = index < currentIndex;

          let statusClass = 'bg-gray-800 text-gray-500 border-gray-700';
          let iconOpacity = 'opacity-40';
          
          if (isActive) {
            statusClass = 'bg-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-500/30';
            iconOpacity = 'opacity-100';
          } else if (isPast) {
            statusClass = 'bg-green-900/50 text-green-400 border-green-600';
            iconOpacity = 'opacity-75';
          }

          return (
            <span
              key={phase}
              title={PHASE_LABELS[phase]}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                border transition-all duration-200
                ${statusClass}
                ${isActive ? 'animate-pulse ring-2 ring-yellow-500/50' : ''}
                hover:brightness-110 cursor-default
              `}
            >
              <PhaseDotIcon phase={phase} className={`w-3 h-3 ${iconOpacity}`} />
              {PHASE_LABELS[phase]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Simple visual for phase state
 */
function PhaseDotIcon({ phase, className }: { phase: CourtPhase; className?: string }) {
  // Simple colored dot
  const colors: Record<string, string> = {
    case_setup: 'bg-blue-400',
    court_opening: 'bg-yellow-400',
    plaintiff_opening: 'bg-blue-400',
    defense_opening: 'bg-green-400',
    evidence_presentation: 'bg-purple-400',
    objection_ruling: 'bg-red-400',
    cross_examination: 'bg-cyan-400',
    witness_testimony: 'bg-orange-400',
    motion_hearing: 'bg-pink-400',
    jury_instructions: 'bg-indigo-400',
    rebuttal: 'bg-teal-400',
    closing_arguments: 'bg-violet-400',
    judge_deliberation: 'bg-amber-400',
    verdict: 'bg-emerald-400',
    case_summary: 'bg-slate-400',
  };
  
  return (
    <span className={`inline-block rounded-full w-2 h-2 ${colors[phase] || 'bg-gray-400'} ${className || ''}`} />
  );
}

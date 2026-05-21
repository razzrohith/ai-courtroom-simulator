/**
 * PhaseTimeline — Visual timeline showing all courtroom phases
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
      <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
        Court Proceeding Timeline
      </h3>
      <div className="flex flex-wrap gap-2">
        {COURT_PHASES.map((phase, index) => {
          const isActive = phase === currentPhase;
          const isPast = index < currentIndex;

          let statusClass = 'phase-badge-pending';
          if (isActive) statusClass = 'phase-badge-active';
          else if (isPast) statusClass = 'phase-badge-complete';

          return (
            <span
              key={phase}
              className={`phase-badge ${statusClass} ${
                isActive ? 'animate-pulse-glow' : ''
              }`}
            >
              {PHASE_LABELS[phase]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

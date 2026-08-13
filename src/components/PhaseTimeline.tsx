/**
 * PhaseTimeline — Animated proceeding progress rail.
 * Brass progress bar + phase chips with spring transitions.
 */

import { motion } from 'framer-motion';
import { COURT_PHASES, PHASE_LABELS } from '../types/courtroom';
import type { CourtPhase } from '../types/courtroom';

interface PhaseTimelineProps {
  currentPhase: CourtPhase;
}

const PHASE_ICONS: Record<string, string> = {
  case_setup: '📁',
  court_opening: '🏛️',
  plaintiff_opening: '⚔️',
  defense_opening: '🛡️',
  evidence_presentation: '📑',
  objection_ruling: '✋',
  cross_examination: '🔍',
  witness_testimony: '🗣️',
  motion_hearing: '📜',
  jury_instructions: '👥',
  rebuttal: '↩️',
  closing_arguments: '🎤',
  judge_deliberation: '🤔',
  verdict: '🔨',
  case_summary: '📋',
};

export function PhaseTimeline({ currentPhase }: PhaseTimelineProps) {
  const currentIndex = COURT_PHASES.indexOf(currentPhase);
  const progressPct = Math.round(((currentIndex + 1) / COURT_PHASES.length) * 100);

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest">
          Proceeding Timeline
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
            Trial Progress
          </span>
          <span className="text-xs font-black text-brass-200 tabular-nums">{progressPct}%</span>
        </div>
      </div>

      {/* Progress rail */}
      <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #8a6d1d, #c9a227, #f5d47a)',
            boxShadow: '0 0 12px rgba(201,162,39,0.6)',
          }}
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COURT_PHASES.map((phase, index) => {
          const isActive = phase === currentPhase;
          const isPast = index < currentIndex;

          return (
            <motion.span
              key={phase}
              title={PHASE_LABELS[phase]}
              layout
              animate={
                isActive
                  ? { scale: 1.06 }
                  : { scale: 1 }
              }
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold
                border transition-colors duration-300 cursor-default select-none
                ${
                  isActive
                    ? 'bg-brass-500/20 text-brass-100 border-brass-400/50 shadow-glow-brass animate-pulse-glow'
                    : isPast
                    ? 'bg-emerald-950/30 text-emerald-400/90 border-emerald-700/30'
                    : 'bg-white/[0.02] text-gray-500 border-white/5'
                }
              `}
            >
              <span className={isActive ? '' : isPast ? 'opacity-80' : 'opacity-35 grayscale'}>
                {isPast ? '✓' : PHASE_ICONS[phase] || '•'}
              </span>
              {PHASE_LABELS[phase]}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

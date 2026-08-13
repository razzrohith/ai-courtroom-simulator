/**
 * PlayerScorecard — Phase 25: grades the human's courtroom performance
 * after a play-a-role trial completes. Fully deterministic — derived from
 * the trial record, no LLM required.
 */

import { motion } from 'framer-motion';
import type { CourtState } from '../types/courtroom';

interface PlayerScorecardProps {
  state: CourtState;
  userRole: 'prosecutor' | 'defense' | 'both';
}

interface ScoreLine {
  label: string;
  detail: string;
  points: number;
  max: number;
}

function gradeSide(state: CourtState, side: 'prosecutor' | 'defense'): { lines: ScoreLine[]; total: number; max: number } {
  const humanTurns = state.transcript.filter(t => t.isComplete && t.speakerRole === side && t.providerUsed === 'human' && !t.id.startsWith('trans-objection-'));
  const lines: ScoreLine[] = [];

  // 1. Participation (up to 25)
  const participation = Math.min(humanTurns.length * 5, 25);
  lines.push({
    label: 'Participation',
    detail: `${humanTurns.length} argument${humanTurns.length === 1 ? '' : 's'} delivered`,
    points: participation,
    max: 25,
  });

  // 2. Evidence usage (up to 25) — citing exhibits strengthens arguments
  const evidenceCitations = humanTurns.filter(t => t.evidenceRef || /EXHIBIT|E\d\d/i.test(t.message)).length;
  const evidenceScore = Math.min(evidenceCitations * 10, 25);
  lines.push({
    label: 'Evidence Usage',
    detail: `${evidenceCitations} argument${evidenceCitations === 1 ? '' : 's'} cited exhibits`,
    points: evidenceScore,
    max: 25,
  });

  // 3. Argument substance (up to 20) — rewarded for developed arguments
  const substantial = humanTurns.filter(t => t.message.length >= 120).length;
  const substanceScore = humanTurns.length === 0 ? 0 : Math.min(Math.round((substantial / humanTurns.length) * 20), 20);
  lines.push({
    label: 'Argument Substance',
    detail: `${substantial}/${humanTurns.length || 0} arguments fully developed`,
    points: substanceScore,
    max: 20,
  });

  // 4. Objection game (up to 15) — player objections that were sustained
  const playerObjections = state.objectionHistory.filter(o => o.id.startsWith('obj-player-') && o.raisedBy === side);
  const sustained = playerObjections.filter(o => o.status === 'sustained').length;
  const objectionScore = Math.min(sustained * 8 + (playerObjections.length - sustained) * 2, 15);
  lines.push({
    label: 'Objection Game',
    detail: playerObjections.length === 0 ? 'No objections raised' : `${sustained}/${playerObjections.length} objections sustained`,
    points: objectionScore,
    max: 15,
  });

  // 5. Case outcome (15)
  const won = state.verdict
    ? (state.verdict.decision === 'plaintiff_wins' && side === 'prosecutor') ||
      (state.verdict.decision === 'defense_wins' && side === 'defense')
    : false;
  lines.push({
    label: 'Case Outcome',
    detail: state.verdict ? (won ? 'Your side prevailed 🏆' : 'Your side did not prevail') : 'No verdict',
    points: won ? 15 : 5,
    max: 15,
  });

  const total = lines.reduce((s, l) => s + l.points, 0);
  const max = lines.reduce((s, l) => s + l.max, 0);
  return { lines, total, max };
}

function gradeLabel(pct: number): { grade: string; note: string } {
  if (pct >= 85) return { grade: 'A', note: 'Outstanding advocacy — the bar association would be proud.' };
  if (pct >= 70) return { grade: 'B', note: 'Strong performance with room to sharpen your exhibits.' };
  if (pct >= 55) return { grade: 'C', note: 'Competent counsel — cite more evidence and press objections.' };
  if (pct >= 40) return { grade: 'D', note: 'The court urges more preparation before your next appearance.' };
  return { grade: 'E', note: 'A tough day in court. Study the transcript and try again.' };
}

export function PlayerScorecard({ state, userRole }: PlayerScorecardProps) {
  const sides: ('prosecutor' | 'defense')[] = userRole === 'both' ? ['prosecutor', 'defense'] : [userRole];

  return (
    <div className="glass-panel-brass p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-bold text-brass-300 tracking-widest uppercase">Counsel Performance Review</span>
          <h3 className="font-display text-lg font-bold text-white tracking-wide">Your Scorecard</h3>
        </div>
        <span className="text-2xl">🎓</span>
      </div>

      {sides.map(side => {
        const { lines, total, max } = gradeSide(state, side);
        const pct = Math.round((total / max) * 100);
        const { grade, note } = gradeLabel(pct);
        return (
          <div key={side} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${side === 'prosecutor' ? 'text-sky-300' : 'text-rose-300'}`}>
                {side === 'prosecutor' ? '⚔️ As Prosecutor' : '🛡️ As Defense'}
              </span>
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.3 }}
                className="font-display text-3xl font-black text-brass-gradient"
              >
                {grade}
              </motion.span>
            </div>

            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full"
                style={{ background: 'linear-gradient(90deg, #8a6d1d, #c9a227, #f5d47a)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.2 }}
              />
            </div>
            <p className="text-[11px] text-gray-400 italic">{note} <span className="text-gray-500">({total}/{max} pts)</span></p>

            <div className="space-y-1 pt-1">
              {lines.map(line => (
                <div key={line.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300 font-semibold">{line.label}</span>
                  <span className="text-gray-500">{line.detail}</span>
                  <span className="text-brass-200 font-bold tabular-nums w-14 text-right">{line.points}/{line.max}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

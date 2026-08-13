/**
 * JuryPanel — Simulated jury votes with reasoning and tally.
 * Phase 24: jury mode.
 */

import { motion } from 'framer-motion';
import type { JurorVote } from '../types/courtroom';

interface JuryPanelProps {
  jurors: JurorVote[];
  plaintiffName: string;
  defenseName: string;
}

export function JuryPanel({ jurors, plaintiffName, defenseName }: JuryPanelProps) {
  if (!jurors || jurors.length === 0) return null;

  const plaintiffVotes = jurors.filter(j => j.vote === 'plaintiff').length;
  const defenseVotes = jurors.length - plaintiffVotes;

  return (
    <div className="glass-panel !rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest flex items-center gap-1.5">
        👥 Jury Deliberation
      </h3>

      {/* Vote tally */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-sky-300">{plaintiffName}: {plaintiffVotes}</span>
          <span className="text-rose-300">{defenseName}: {defenseVotes}</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-600 to-sky-400"
            initial={{ width: 0 }}
            animate={{ width: `${(plaintiffVotes / jurors.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          />
          <motion.div
            className="h-full bg-gradient-to-r from-rose-400 to-rose-600"
            initial={{ width: 0 }}
            animate={{ width: `${(defenseVotes / jurors.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          />
        </div>
        <p className="text-[10px] text-gray-500 text-center font-semibold">
          {plaintiffVotes === defenseVotes
            ? 'The jury is deadlocked'
            : `The jury finds ${plaintiffVotes > defenseVotes ? plaintiffName : defenseName} more persuasive, ${Math.max(plaintiffVotes, defenseVotes)}–${Math.min(plaintiffVotes, defenseVotes)}`}
        </p>
      </div>

      {/* Juror cards */}
      <div className="space-y-2">
        {jurors.map((juror, i) => (
          <motion.div
            key={juror.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-lg p-2.5 border text-[11px] ${
              juror.vote === 'plaintiff'
                ? 'bg-sky-500/[0.06] border-sky-500/25'
                : 'bg-rose-500/[0.06] border-rose-500/25'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-200">{juror.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  juror.vote === 'plaintiff'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {juror.vote === 'plaintiff' ? plaintiffName : defenseName}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 italic mb-1">{juror.persona}</p>
            <p className="text-gray-300 leading-relaxed">"{juror.reasoning}"</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

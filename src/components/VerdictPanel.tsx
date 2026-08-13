/**
 * VerdictPanel — Display final verdict and reasoning.
 * Gilded Verdict redesign: staggered reveal, animated decision banner,
 * brass-framed winner analysis.
 */

import { motion } from 'framer-motion';
import type { Verdict, VerdictDecision, Evidence, ObjectionEvent } from '../types/courtroom';
import { VerdictStampAnimation } from './visuals/CourtroomVisuals';
import { staggerContainer, fadeUp } from './ui/motionPresets';

interface VerdictPanelProps {
  verdict: Verdict;
  evidence?: Evidence[];
  objections?: ObjectionEvent[];
}

const decisionLabels: Record<VerdictDecision, { label: string; class: string }> = {
  plaintiff_wins: { label: 'Plaintiff Wins', class: 'from-emerald-600 to-emerald-800 shadow-[0_0_32px_rgba(16,185,129,0.35)]' },
  defense_wins: { label: 'Defense Wins', class: 'from-sky-600 to-sky-800 shadow-[0_0_32px_rgba(14,165,233,0.35)]' },
  partial_verdict: { label: 'Partial Verdict', class: 'from-brass-500 to-brass-700 shadow-glow-brass-lg' },
  dismissed: { label: 'Case Dismissed', class: 'from-gray-600 to-gray-800' },
};

export function VerdictPanel({ verdict, evidence, objections }: VerdictPanelProps) {
  const decision = decisionLabels[verdict.decision];

  const acceptedCount = evidence?.filter(e => e.status === 'admitted').length || 0;
  const disputedCount = evidence?.filter(e => e.status === 'disputed').length || 0;
  const objectionImpact = objections?.filter(o => o.status !== 'pending').length || 0;

  return (
    <div>
      <div className="p-4 border-b border-white/5">
        <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest">
          ⚖️ Verdict
        </h3>
      </div>

      <motion.div
        className="p-4 space-y-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Decision banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateX: 40 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className={`text-center py-5 rounded-xl bg-gradient-to-br ${decision.class}`}
        >
          <span className="font-display text-2xl font-black text-white tracking-widest uppercase drop-shadow-lg">
            {decision.label}
          </span>
        </motion.div>

        {/* Verdict Stamp Animation */}
        <div className="flex justify-center my-4">
          <VerdictStampAnimation show={true} verdict={decision.label} />
        </div>

        {/* Verdict Clarity Details */}
        {verdict.winnerName && (
          <motion.div variants={fadeUp} className="glass-panel-brass p-4 space-y-3">
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Winner</span>
              <span className="text-base font-black text-brass-gradient font-display tracking-wide">{verdict.winnerName}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Why this side won</span>
              <span className="text-sm text-gray-200">{verdict.whyWinnerWon}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Why the other side did not win</span>
              <span className="text-sm text-gray-200">{verdict.whyLoserLost}</span>
            </div>
            {verdict.keyReasons && verdict.keyReasons.length > 0 && (
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Key reasons</span>
                <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
                  {verdict.keyReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {verdict.evidenceConsidered && verdict.evidenceConsidered.length > 0 && (
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Evidence/facts considered</span>
                <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
                  {verdict.evidenceConsidered.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Reasoning */}
        <motion.div variants={fadeUp}>
          <h4 className="text-sm font-bold text-gray-400 mb-2">Reasoning Summary</h4>
          <p className="text-sm text-gray-200 leading-relaxed">{verdict.reasoningSummary}</p>
        </motion.div>

        {/* Witness Testimony Impact - Phase 10 */}
        {'witnessImpact' in verdict && (
          <motion.div variants={fadeUp} className="bg-sky-900/15 border border-sky-700/40 rounded-xl p-3">
            <h4 className="text-sm font-bold text-sky-400 mb-2">👤 Witness Testimony Impact</h4>
            <p className="text-xs text-gray-300">{verdict.witnessImpact}</p>
          </motion.div>
        )}

        {/* Jury Instruction Summary - Phase 11 */}
        {'juryInstructionSummary' in verdict && (
          <motion.div variants={fadeUp} className="bg-purple-900/15 border border-purple-700/40 rounded-xl p-3">
            <h4 className="text-sm font-bold text-purple-400 mb-2">⚖️ Jury Instructions</h4>
            <p className="text-xs text-gray-300">{verdict.juryInstructionSummary}</p>
          </motion.div>
        )}

        {/* Motion Impact - Phase 11 */}
        {'motionImpact' in verdict && (
          <motion.div variants={fadeUp} className="bg-orange-900/15 border border-orange-700/40 rounded-xl p-3">
            <h4 className="text-sm font-bold text-orange-400 mb-2">📋 Motion Rulings Impact</h4>
            <p className="text-xs text-gray-300">{verdict.motionImpact}</p>
          </motion.div>
        )}

        {/* Deliberation Summary - Phase 12 */}
        {'deliberationSummary' in verdict && verdict.deliberationSummary && (
          <motion.div variants={fadeUp} className="bg-indigo-900/15 border border-indigo-700/40 rounded-xl p-3">
            <h4 className="text-sm font-bold text-indigo-400 mb-2">⚖️ Deliberation Notes</h4>
            <p className="text-xs text-gray-300">{verdict.deliberationSummary}</p>
          </motion.div>
        )}

        {/* Appeal Grounds - Phase 12 */}
        {'appealGrounds' in verdict && verdict.appealGrounds && verdict.appealGrounds.length > 0 && (
          <motion.div variants={fadeUp} className="bg-rose-900/15 border border-rose-700/40 rounded-xl p-3">
            <h4 className="text-sm font-bold text-rose-400 mb-2">⚠️ Potential Appeal Grounds</h4>
            <ul className="text-xs space-y-1 text-gray-300">
              {verdict.appealGrounds.map((ground, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{ground}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Ruling */}
        <motion.div variants={fadeUp} className="glass-panel-brass p-3">
          <h4 className="text-sm font-bold text-brass-300 mb-1">Court Ruling</h4>
          <p className="text-sm font-medium text-gray-100">{verdict.ruling}</p>
        </motion.div>

        {/* Points comparison */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-bold text-emerald-400 mb-2">
              ✅ Strengths (Plaintiff)
            </h4>
            <ul className="text-xs space-y-1 text-gray-300">
              {verdict.plaintiffPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-rose-400 mb-2">
              ✅ Strengths (Defense)
            </h4>
            <ul className="text-xs space-y-1 text-gray-300">
              {verdict.defensePoints.map((point, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Weaknesses */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
          <div>
            <h4 className="text-sm font-bold text-orange-400 mb-2">
              ⚠️ Weaknesses (Plaintiff)
            </h4>
            <ul className="text-xs space-y-1">
              {verdict.weaknesses.plaintiff.map((w, i) => (
                <li key={i} className="flex items-start gap-1 text-gray-400">
                  <span>•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-orange-400 mb-2">
              ⚠️ Weaknesses (Defense)
            </h4>
            <ul className="text-xs space-y-1">
              {verdict.weaknesses.defense.map((w, i) => (
                <li key={i} className="flex items-start gap-1 text-gray-400">
                  <span>•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Phase 8: Evidence and objection impact */}
        {(acceptedCount > 0 || disputedCount > 0 || objectionImpact > 0) && (
          <motion.div variants={fadeUp} className="pt-3 border-t border-white/5">
            <h4 className="text-sm font-bold text-gray-400 mb-2">📊 Evidence Impact</h4>
            <div className="flex gap-4 text-xs">
              {acceptedCount > 0 && (
                <span className="text-emerald-400">✓ Accepted: {acceptedCount}</span>
              )}
              {disputedCount > 0 && (
                <span className="text-red-400">✗ Disputed: {disputedCount}</span>
              )}
              {objectionImpact > 0 && (
                <span className="text-brass-300">⚖️ Rulings: {objectionImpact}</span>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

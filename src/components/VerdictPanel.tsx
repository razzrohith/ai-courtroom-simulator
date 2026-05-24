/**
 * VerdictPanel — Display final verdict and reasoning
 * Phase 8: Enhanced with evidence and objection impact
 */

import type { Verdict, VerdictDecision, Evidence, ObjectionEvent } from '../types/courtroom';
import { VerdictStampAnimation } from './visuals/CourtroomVisuals';

interface VerdictPanelProps {
  verdict: Verdict;
  evidence?: Evidence[];
  objections?: ObjectionEvent[];
}

const decisionLabels: Record<VerdictDecision, { label: string; class: string }> = {
  plaintiff_wins: { label: 'Plaintiff Wins', class: 'bg-green-700 text-white' },
  defense_wins: { label: 'Defense Wins', class: 'bg-blue-700 text-white' },
  partial_verdict: { label: 'Partial Verdict', class: 'bg-yellow-700 text-white' },
  dismissed: { label: 'Case Dismissed', class: 'bg-gray-700 text-white' },
};

export function VerdictPanel({ verdict, evidence, objections }: VerdictPanelProps) {
  const decision = decisionLabels[verdict.decision];
  
  // Count evidence by status
  const acceptedCount = evidence?.filter(e => e.status === 'admitted').length || 0;
  const disputedCount = evidence?.filter(e => e.status === 'disputed').length || 0;
  const objectionImpact = objections?.filter(o => o.status !== 'pending').length || 0;

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          ⚖️ Verdict
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Decision banner */}
        <div className={`text-center py-4 rounded-lg ${decision.class}`}>
          <span className="text-xl font-bold">{decision.label}</span>
        </div>

        {/* Verdict Stamp Animation */}
        <div className="flex justify-center my-4">
          <VerdictStampAnimation show={true} verdict={decision.label} />
        </div>

        {/* Verdict Clarity Details */}
        {verdict.winnerName && (
          <div className="bg-yellow-950/20 border border-yellow-750/30 rounded-lg p-4 space-y-3">
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Winner</span>
              <span className="text-base font-bold text-yellow-500">{verdict.winnerName}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Why this side won</span>
              <span className="text-sm text-gray-200">{verdict.whyWinnerWon}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Why the other side did not win</span>
              <span className="text-sm text-gray-200">{verdict.whyLoserLost}</span>
            </div>
            {verdict.keyReasons && verdict.keyReasons.length > 0 && (
              <div>
                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Key reasons</span>
                <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
                  {verdict.keyReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {verdict.evidenceConsidered && verdict.evidenceConsidered.length > 0 && (
              <div>
                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Evidence/facts considered</span>
                <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
                  {verdict.evidenceConsidered.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Reasoning */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Reasoning Summary</h4>
          <p className="text-sm">{verdict.reasoningSummary}</p>
        </div>

        {/* Witness Testimony Impact - Phase 10 */}
        {'witnessImpact' in verdict && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-400 mb-2">👤 Witness Testimony Impact</h4>
            <p className="text-xs">{verdict.witnessImpact}</p>
          </div>
        )}

        {/* Jury Instruction Summary - Phase 11 */}
        {'juryInstructionSummary' in verdict && (
          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-purple-400 mb-2">⚖️ Jury Instructions</h4>
            <p className="text-xs">{verdict.juryInstructionSummary}</p>
          </div>
        )}

        {/* Motion Impact - Phase 11 */}
        {'motionImpact' in verdict && (
          <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-orange-400 mb-2">📋 Motion Rulings Impact</h4>
            <p className="text-xs">{verdict.motionImpact}</p>
          </div>
        )}

        {/* Deliberation Summary - Phase 12 */}
        {'deliberationSummary' in verdict && verdict.deliberationSummary && (
          <div className="bg-indigo-900/20 border border-indigo-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-indigo-400 mb-2">⚖️ Deliberation Notes</h4>
            <p className="text-xs">{verdict.deliberationSummary}</p>
          </div>
        )}

        {/* Appeal Grounds - Phase 12 */}
        {'appealGrounds' in verdict && verdict.appealGrounds && verdict.appealGrounds.length > 0 && (
          <div className="bg-rose-900/20 border border-rose-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-rose-400 mb-2">⚠️ Potential Appeal Grounds</h4>
            <ul className="text-xs space-y-1">
              {verdict.appealGrounds.map((ground, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{ground}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ruling */}
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
          <h4 className="text-sm font-medium text-yellow-500 mb-1">Court Ruling</h4>
          <p className="text-sm font-medium">{verdict.ruling}</p>
        </div>

        {/* Points comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Plaintiff points */}
          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-2">
              ✅ Strengths (Plaintiff)
            </h4>
            <ul className="text-xs space-y-1">
              {verdict.plaintiffPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Defense points */}
          <div>
            <h4 className="text-sm font-medium text-rose-400 mb-2">
              ✅ Strengths (Defense)
            </h4>
            <ul className="text-xs space-y-1">
              {verdict.defensePoints.map((point, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Weaknesses */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
          <div>
            <h4 className="text-sm font-medium text-orange-400 mb-2">
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
            <h4 className="text-sm font-medium text-orange-400 mb-2">
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
        </div>

        {/* Phase 8: Evidence and objection impact */}
        {(acceptedCount > 0 || disputedCount > 0 || objectionImpact > 0) && (
          <div className="pt-3 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-2">📊 Evidence Impact</h4>
            <div className="flex gap-4 text-xs">
              {acceptedCount > 0 && (
                <span className="text-green-400">✓ Accepted: {acceptedCount}</span>
              )}
              {disputedCount > 0 && (
                <span className="text-red-400">✗ Disputed: {disputedCount}</span>
              )}
              {objectionImpact > 0 && (
                <span className="text-yellow-400">⚖️ Rulings: {objectionImpact}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

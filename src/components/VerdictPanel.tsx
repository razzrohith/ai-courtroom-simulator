/**
 * VerdictPanel — Display final verdict and reasoning
 * Phase 8: Enhanced with evidence and objection impact
 */

import type { Verdict, VerdictDecision, Evidence, ObjectionEvent } from '../types/courtroom';

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
  const acceptedCount = evidence?.filter(e => e.status === 'accepted').length || 0;
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

        {/* Reasoning */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Reasoning</h4>
          <p className="text-sm">{verdict.reasoningSummary}</p>
        </div>

        {/* Witness Testimony Impact - Phase 10 */}
        {'witnessImpact' in verdict && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-400 mb-2">👤 Witness Testimony Impact</h4>
            <p className="text-xs">{verdict.witnessImpact}</p>
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

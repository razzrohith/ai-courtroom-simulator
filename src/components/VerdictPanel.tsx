/**
 * VerdictPanel — Display final verdict and reasoning
 */

import type { Verdict, VerdictDecision } from '../types/courtroom';

interface VerdictPanelProps {
  verdict: Verdict;
}

const decisionLabels: Record<VerdictDecision, { label: string; class: string }> = {
  plaintiff_wins: { label: 'Plaintiff Wins', class: 'bg-green-700 text-white' },
  defense_wins: { label: 'Defense Wins', class: 'bg-blue-700 text-white' },
  partial_verdict: { label: 'Partial Verdict', class: 'bg-yellow-700 text-white' },
  dismissed: { label: 'Case Dismissed', class: 'bg-gray-700 text-white' },
};

export function VerdictPanel({ verdict }: VerdictPanelProps) {
  const decision = decisionLabels[verdict.decision];

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
      </div>
    </div>
  );
}

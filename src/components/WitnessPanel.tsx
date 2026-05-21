/**
 * WitnessPanel — Display witness testimony and credibility
 * Phase 10: Enhanced with Q&A, credibility scoring, evidence links
 */

import type { Witness, WitnessCredibility, CredibilityScore } from '../types/courtroom';

interface WitnessPanelProps {
  witnesses: Witness[];
}

const credibilityStyles: Record<WitnessCredibility, { label: string; class: string }> = {
  credible: { label: 'Credible', class: 'bg-green-700 text-green-200' },
  challenged: { label: 'Challenged', class: 'bg-red-700 text-red-200' },
  inconsistent: { label: 'Inconsistent', class: 'bg-yellow-700 text-yellow-200' },
  corroborated: { label: 'Corroborated', class: 'bg-blue-700 text-blue-200' },
};

const scoreStyles: Record<CredibilityScore, { label: string; class: string }> = {
  strong: { label: 'STRONG', class: 'text-green-400' },
  moderate: { label: 'MODERATE', class: 'text-yellow-400' },
  weak: { label: 'WEAK', class: 'text-orange-400' },
  challenged: { label: 'CHALLENGED', class: 'text-red-400' },
};

export function WitnessPanel({ witnesses }: WitnessPanelProps) {
  if (witnesses.length === 0) {
    return (
      <div className="bg-courtroom-card rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
          👤 Witness Testimony
        </h3>
        <p className="text-xs text-gray-500">No witnesses called yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          👤 Witness Testimony
        </h3>
        <p className="text-xs text-gray-500 mt-1">{witnesses.length} witness(es)</p>
      </div>

      <div className="p-4 grid gap-4 max-h-[500px] overflow-y-auto">
        {witnesses.map((witness) => {
          const cred = credibilityStyles[witness.credibility];
          const score = witness.credibilityScore ? scoreStyles[witness.credibilityScore] : null;
          
          return (
            <div key={witness.id} className="bg-gray-800 rounded-lg p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-200">{witness.name}</span>
                <div className="flex gap-2">
                  {score && (
                    <span className={`text-xs font-bold ${score.class}`}>
                      [{score.label}]
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${cred.class}`}>
                    {cred.label}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mb-2">{witness.title}</p>
              
              {/* Main testimony */}
              {witness.testimony && (
                <div className="mb-2 pb-2 border-b border-gray-700">
                  <p className="text-xs text-gray-300 italic">"{witness.testimony}"</p>
                </div>
              )}
              
              {/* Evidence Links - Phase 10 */}
              {witness.evidenceLinks && witness.evidenceLinks.length > 0 && (
                <div className="mb-2 pb-2 border-b border-gray-700">
                  <span className="text-xs text-gray-500">Evidence:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {witness.evidenceLinks.map((link, i) => (
                      <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                        link.supports ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}>
                        {link.evidenceId} {link.supports ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Q&A History - Phase 10 */}
              {witness.qAndAHistory && witness.qAndAHistory.length > 0 && (
                <div className="mb-2 pb-2 border-b border-gray-700 max-h-32 overflow-y-auto">
                  <span className="text-xs text-gray-500">Q&A:</span>
                  <div className="mt-1 space-y-1">
                    {witness.qAndAHistory.slice(-3).map((qa) => (
                      <div key={qa.id} className="text-xs bg-gray-900 rounded p-1.5">
                        <span className="text-blue-400">{qa.examinerRole}:</span>{' '}
                        <span className="text-gray-300">"{qa.question}"</span>
                        <br/>
                        <span className="text-green-400">A:</span>{' '}
                        <span className="text-gray-300">"{qa.answer}"</span>
                        {qa.evidenceIds && qa.evidenceIds.length > 0 && (
                          <span className="text-gray-500 ml-1">[{qa.evidenceIds.join(',')}]</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Credibility notes */}
              {witness.credibilityNotes && (
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">
                  Note: {witness.credibilityNotes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

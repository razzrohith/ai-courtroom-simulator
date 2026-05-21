/**
 * WitnessPanel — Display witness testimony and credibility
 * Phase 9: Witness testimony system
 */

import type { Witness, WitnessCredibility } from '../types/courtroom';

interface WitnessPanelProps {
  witnesses: Witness[];
}

const credibilityStyles: Record<WitnessCredibility, { label: string; class: string }> = {
  credible: { label: 'Credible', class: 'bg-green-700 text-green-200' },
  challenged: { label: 'Challenged', class: 'bg-red-700 text-red-200' },
  inconsistent: { label: 'Inconsistent', class: 'bg-yellow-700 text-yellow-200' },
  corroborated: { label: 'Corroborated', class: 'bg-blue-700 text-blue-200' },
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

      <div className="p-4 grid gap-4 max-h-[400px] overflow-y-auto">
        {witnesses.map((witness) => {
          const cred = credibilityStyles[witness.credibility];
          return (
            <div key={witness.id} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-200">{witness.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${cred.class}`}>
                  {cred.label}
                </span>
              </div>
              
              <p className="text-xs text-gray-400 mb-2">{witness.title}</p>
              
              {witness.testimony && (
                <div className="mb-2 pb-2 border-b border-gray-700">
                  <p className="text-xs text-gray-300 italic">"{witness.testimony}"</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {witness.directExamination && (
                  <div>
                    <span className="text-gray-500">Direct:</span>
                    <p className="text-gray-400 truncate">{witness.directExamination}</p>
                  </div>
                )}
                {witness.crossExamination && (
                  <div>
                    <span className="text-gray-500">Cross:</span>
                    <p className="text-gray-400 truncate">{witness.crossExamination}</p>
                  </div>
                )}
              </div>
              
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

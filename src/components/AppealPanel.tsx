/**
 * AppealPanel — Display post-verdict appeal grounds
 * Phase 12: Appeal grounds and new-trial motion analysis
 */

interface AppealPanelProps {
  grounds?: string[];
  decision?: string;
}

export function AppealPanel({ grounds, decision }: AppealPanelProps) {
  const defaultGrounds: string[] = [
    'No appeal grounds identified in mock simulation.',
    'This is an educational demonstration.',
  ];

  const postVerdictOptions = [
    'Accept verdict and conclude proceedings.',
    'File appeal brief (outside simulation scope).',
    'Request new trial (outside simulation scope).',
  ];

  return (
    <div className="bg-courtroom-card rounded-lg border border-rose-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          ⚖️ Post-Verdict Review: Appeal Analysis
        </h3>
        <p className="text-xs text-gray-500 mt-1">Phase 12: Appeal grounds</p>
      </div>

      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {/* Current decision context */}
        {decision && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-400 mb-2">🎯 Verdict: {decision.replace('_', ' ')}</h4>
            <p className="text-xs text-gray-400">
              Based on this verdict, potential appellate considerations include:
            </p>
          </div>
        )}

        {/* Appeal grounds */}
        <div className="bg-rose-900/20 border border-rose-700 rounded-lg p-3">
          <h4 className="text-sm font-medium text-rose-400 mb-2">📝 Potential Appeal Grounds</h4>
          <ul className="text-xs space-y-2">
            {(grounds?.length ? grounds : defaultGrounds).map((ground, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-500">•</span>
                <span className="text-gray-300">{ground}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mock procedural warnings */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-400 mb-2">⚠️ Simulation Notice</h4>
          <p className="text-xs text-gray-300">
            This is a fictional educational demonstration. Actual appeals involve 
            complex procedural requirements, filing deadlines, and legal standards 
            that vary by jurisdiction.
          </p>
        </div>

        {/* Post-verdict options */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Next Steps in Simulation</h4>
          <ul className="text-xs space-y-1">
            {postVerdictOptions.map((opt, i) => (
              <li key={i} className="text-gray-500">→ {opt}</li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="pt-3 border-t border-gray-700">
          <p className="text-xs text-red-400 font-medium">
            ⚠️ DISCLAIMER: Not legal advice. Consult qualified attorney for 
            real legal matters.
          </p>
        </div>
      </div>
    </div>
  );
}

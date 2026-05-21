/**
 * DeliberationPanel — Display judge deliberation before verdict
 * Phase 12: Deliberation chamber with evidence/objection review
 */

interface DeliberationPanelProps {
  summary?: string;
  evidenceImpact?: string;
  witnessImpact?: string;
  motionImpact?: string;
  objectionImpact?: string;
}

export function DeliberationPanel({ 
  summary,
  evidenceImpact,
  witnessImpact,
  motionImpact,
  objectionImpact 
}: DeliberationPanelProps) {
  const defaultSummary = `The Court has reviewed all evidence, testimony, and motions. A preliminary ruling will be issued.`;

  return (
    <div className="bg-courtroom-card rounded-lg border border-indigo-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          ⚖️ Judge Deliberation Chamber
        </h3>
        <p className="text-xs text-gray-500 mt-1">Phase 12: Pre-verdict review</p>
      </div>

      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {/* Main summary */}
        <div className="bg-indigo-900/20 border border-indigo-600 rounded-lg p-3">
          <h4 className="text-sm font-medium text-indigo-400 mb-2">📋 Deliberation Summary</h4>
          <p className="text-xs">{summary || defaultSummary}</p>
        </div>

        {/* Evidence weighting */}
        {evidenceImpact && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-400 mb-2">📄 Evidence Considered</h4>
            <p className="text-xs">{evidenceImpact}</p>
          </div>
        )}

        {/* Witness credibility */}
        {witnessImpact && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-green-400 mb-2">👤 Witness Credibility</h4>
            <p className="text-xs">{witnessImpact}</p>
          </div>
        )}

        {/* Motion rulings effect */}
        {motionImpact && (
          <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-orange-400 mb-2">📋 Motion Rulings</h4>
            <p className="text-xs">{motionImpact}</p>
          </div>
        )}

        {/* Objection rulings effect */}
        {objectionImpact && (
          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-purple-400 mb-2">⚠️ Objection Rulings</h4>
            <p className="text-xs">{objectionImpact}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-red-400 font-medium">
            ⚠️ This is a simulated deliberation for educational purposes only. 
            Not legal advice. Not binding in any real matter.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * CaseSetupPanel — Display case information before trial starts
 */

import type { CaseData } from '../types/courtroom';

interface CaseSetupPanelProps {
  caseData: CaseData;
}

export function CaseSetupPanel({ caseData }: CaseSetupPanelProps) {
  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          📁 Case Information
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Case header */}
        <div>
          <h4 className="text-lg font-bold text-yellow-500 mb-1">
            {caseData.title}
          </h4>
          <p className="text-sm text-gray-400">{caseData.caseType}</p>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700">
            <h5 className="text-xs text-emerald-400 uppercase mb-1">Plaintiff</h5>
            <p className="text-sm font-medium">{caseData.plaintiffSide}</p>
          </div>
          <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700">
            <h5 className="text-xs text-rose-400 uppercase mb-1">Defendant</h5>
            <p className="text-sm font-medium">{caseData.defenseSide}</p>
          </div>
        </div>

        {/* Claim summary */}
        <div>
          <h5 className="text-xs text-gray-500 uppercase mb-2">Claim Summary</h5>
          <p className="text-sm">{caseData.claimSummary}</p>
        </div>

        {/* Key facts */}
        <div>
          <h5 className="text-xs text-gray-500 uppercase mb-2">Key Facts</h5>
          <ul className="text-sm space-y-1">
            {caseData.keyFacts.slice(0, 4).map((fact, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="text-gray-500">{i + 1}.</span>
                <span>{fact}</span>
              </li>
            ))}
            {caseData.keyFacts.length > 4 && (
              <li className="text-gray-500 text-xs">
                ...and {caseData.keyFacts.length - 4} more facts
              </li>
            )}
          </ul>
        </div>

        {/* Legal questions */}
        <div>
          <h5 className="text-xs text-gray-500 uppercase mb-2">Legal Questions</h5>
          <ul className="text-sm space-y-1">
            {caseData.legalQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-400">
                <span className="text-yellow-500">?</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
          <p className="text-xs text-yellow-500">
            ⚠️ This is a fictional case created for educational and experimental purposes only.
            It is not legal advice and should not be used for any legal proceeding.
          </p>
        </div>
      </div>
    </div>
  );
}

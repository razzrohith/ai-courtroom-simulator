/**
 * JuryInstructionPanel — Display jury instructions
 * Phase 11: Jury instruction phase UI
 */

interface JuryInstructionPanelProps {
  instructions?: string;
}

export function JuryInstructionPanel({ instructions }: JuryInstructionPanelProps) {
  const defaultInstructions = `This is a simulated courtroom for educational purposes only.

BURDEN OF PROOF: The plaintiff must prove their claims by a preponderance of the evidence — meaning it's more likely than not that the claims are true.

EVIDENCE CONSIDERATION: Consider all testimony and documents presented. Evaluate each piece of evidence on its own merits.

WITNESS CREDIBILITY: Consider witness consistency, possible bias, and whether testimony is supported by other evidence.

OBJECTIONS: Any objections raised were ruled upon by the Court. You should not penalize a party for sustaining or overruling.

THIS IS NOT LEGAL ADVICE: This simulation is for educational purposes only.`;

  const content = instructions || defaultInstructions;
  const lines = content.split('\n');

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          ⚖️ Jury Instructions
        </h3>
        <p className="text-xs text-gray-500 mt-1">Phase 11: Educational simulation</p>
      </div>

      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          
          // Bold headings
          if (trimmed.match(/^(BURDEN|EVIDENCE|WHITNESS|OBJECTIONS|THIS|FINALLY)/)) {
            return (
              <p key={i} className="text-sm font-bold text-yellow-400">
                {trimmed}
              </p>
            );
          }
          
          return (
            <p key={i} className="text-xs text-gray-300 leading-relaxed">
              {trimmed}
            </p>
          );
        })}
        
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-red-400 font-medium">
            ⚠️ DISCLAIMER: This is an educational simulation only. 
            Not legal advice. Not binding in any real matter.
          </p>
        </div>
      </div>
    </div>
  );
}

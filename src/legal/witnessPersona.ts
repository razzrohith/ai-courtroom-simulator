/**
 * witnessPersona — Phase 26: witnesses become people with a crack in them.
 * Each expert gets a background, a bias, and a secret weakness. Cross-examining
 * counsel (human or AI) who targets the weakness damages the witness's
 * credibility — which feeds the credibility record and the verdict narrative.
 */

import type { CaseData, Witness } from '../types/courtroom';

export function buildWitnessPersona(
  side: 'prosecution' | 'defense',
  caseData: CaseData
): NonNullable<Witness['persona']> {
  const pSide = caseData.plaintiffSide || 'the Plaintiff';
  const dSide = caseData.defenseSide || 'the Defendant';

  if (side === 'prosecution') {
    return {
      background: `Twenty years in the field; has published extensively on the subject matter of ${pSide}.`,
      bias: `Retained and compensated by ${pSide}'s side; has testified for similar claimants before.`,
      secretWeakness: `Reviewed only the materials ${pSide} provided — never independently examined ${dSide}'s countervailing data.`,
      weaknessKeywords: ['paid', 'compensat', 'retained', 'fee', 'independent', 'only reviewed', 'provided by', 'cherry', 'one-sided', 'never examined', 'did you review'],
    };
  }
  return {
    background: `Respected researcher frequently cited on questions involving ${dSide}.`,
    bias: `Longstanding professional relationship with ${dSide}'s industry; prior public statements favor their position.`,
    secretWeakness: `Key study relied upon predates this dispute and used a small sample that was never replicated.`,
    weaknessKeywords: ['outdated', 'predates', 'old data', 'sample size', 'small sample', 'replicat', 'peer review', 'how recent', 'when was', 'stale'],
  };
}

/** Does this cross-examination question hit the witness's secret weakness? */
export function questionHitsWeakness(question: string, persona?: Witness['persona']): boolean {
  if (!persona || !question) return false;
  const q = question.toLowerCase();
  return persona.weaknessKeywords.some(k => q.includes(k.toLowerCase()));
}

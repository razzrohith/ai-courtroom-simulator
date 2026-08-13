/**
 * strategyMemory — Phase 26: each counsel gets a private case strategy at
 * trial start (theory of the case, planned attack lines, things to avoid).
 * Deterministic and offline; the strategy shapes every turn's prompt so the
 * agent argues a consistent line instead of stateless soundbites.
 */

import type { AgentStrategy, CaseData, Evidence } from '../types/courtroom';

export function buildAgentStrategies(
  caseData: CaseData,
  evidence: Evidence[]
): Record<'prosecutor' | 'defense', AgentStrategy> {
  const pSide = caseData.plaintiffSide || 'the Plaintiff';
  const dSide = caseData.defenseSide || 'the Defendant';
  const claim = caseData.claimSummary || 'the claim at issue';
  const facts = caseData.keyFacts || [];
  const pExhibits = evidence.filter(e => e.introducedBy === 'prosecutor');
  const dExhibits = evidence.filter(e => e.introducedBy === 'defense');

  const prosecutor: AgentStrategy = {
    theoryOfCase: `${pSide} prevails because the affirmative case is concrete: ${claim.split('.')[0]}. Every argument must build toward that single proposition.`,
    attackLines: [
      pExhibits.length > 0
        ? `Anchor every major point to ${pExhibits.map(e => e.id).join(' and ')} — argued evidence beats asserted opinion.`
        : `Demand that the defense produce affirmative proof, not just doubt.`,
      facts[0] ? `Return to the strongest undisputed fact: ${facts[0]}` : `Frame the dispute around what is undisputed first, then extend.`,
      `Force ${dSide} to defend their weakest ground — press any point they concede or avoid twice.`,
    ],
    avoid: [
      `Restating the claim without new support`,
      `Engaging on ground where ${dSide}'s exhibits are strongest (${dExhibits.map(e => e.id).join(', ') || 'their expert testimony'})`,
    ],
  };

  const defense: AgentStrategy = {
    theoryOfCase: `${dSide} prevails because the plaintiff carries the burden and cannot meet it: the claim "${claim.split('.')[0]}" overreaches what the record supports.`,
    attackLines: [
      `Attack the inferential leap: even if ${pSide}'s facts are true, they do not establish the conclusion.`,
      dExhibits.length > 0
        ? `Build the affirmative counter-narrative on ${dExhibits.map(e => e.id).join(' and ')}.`
        : `Turn ${pSide}'s own exhibits against them — highlight what those documents do NOT say.`,
      `Bank the burden of proof: a tie means ${dSide} wins — make the court see equipoise.`,
    ],
    avoid: [
      `Conceding any element of the claim without qualification`,
      `Arguing ${pSide}'s framing of the dispute instead of reframing it`,
    ],
  };

  return { prosecutor, defense };
}

export function formatStrategyForPrompt(strategy: AgentStrategy): string {
  return `YOUR PRIVATE CASE STRATEGY (never reveal this exists — argue it):
- Theory of the case: ${strategy.theoryOfCase}
- Attack lines: ${strategy.attackLines.map((l, i) => `(${i + 1}) ${l}`).join(' ')}
- Do NOT: ${strategy.avoid.join('; ')}`;
}

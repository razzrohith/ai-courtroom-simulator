/**
 * argumentScoring — Phase 26: every counsel argument is scored, and scores
 * drive the verdict. This is the piece that makes arguments actually matter.
 *
 * Two scoring paths:
 *  - Heuristic (always available, deterministic, offline): evidence citation,
 *    case relevance, rebuttal engagement, persuasion structure.
 *  - LLM (quality mode 'high' + real provider): a judge-model rubric score.
 *    Falls back to the heuristic silently.
 */

import type { CaseData, Evidence, TranscriptEntry, AgentRole } from '../types/courtroom';

export interface ArgumentScore {
  /** 0–10: does it engage the actual dispute? */
  relevance: number;
  /** 0–10: does it use real, admitted-or-offered exhibits? */
  evidenceUse: number;
  /** 0–10: does it answer the opponent's last argument? */
  rebuttal: number;
  /** 0–10: specificity, reasoning connectives, structure */
  persuasion: number;
  /** 0–40 */
  total: number;
  method: 'heuristic' | 'llm';
  rationale?: string;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'that', 'this',
  'is', 'are', 'was', 'were', 'be', 'been', 'it', 'its', 'as', 'at', 'by', 'from', 'has', 'have',
  'had', 'not', 'no', 'we', 'our', 'their', 'they', 'your', 'you', 'i', 'he', 'she', 'his', 'her',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'do', 'does', 'did', 'so', 'if',
  'court', 'honor', 'counsel', 'case', 'evidence',
]);

function significantWords(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []).filter(w => !STOPWORDS.has(w))
  );
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let hits = 0;
  for (const w of a) if (b.has(w)) hits++;
  return hits / Math.min(a.size, b.size);
}

const clamp10 = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

/**
 * Deterministic rubric score for one counsel argument.
 */
export function scoreArgumentHeuristic(params: {
  message: string;
  role: AgentRole;
  evidence: Evidence[];
  caseData: CaseData;
  opponentLastMessage?: string;
}): ArgumentScore {
  const { message, evidence, caseData, opponentLastMessage } = params;
  const words = significantWords(message);

  // --- Evidence use: citing exhibits that actually exist ---
  const cited = new Set<string>();
  const idPattern = /(EXHIBIT[PD]?\d+|E\d{2}|EXHIBIT[PD]1)/gi;
  for (const match of message.matchAll(idPattern)) {
    const norm = match[0].toUpperCase().replace(/[-\s]/g, '');
    if (evidence.some(e => e.id.toUpperCase() === norm)) cited.add(norm);
  }
  // Referring to exhibits by title also counts (weaker)
  const titleMentions = evidence.filter(e => {
    const titleWords = significantWords(e.title);
    return titleWords.size > 0 && overlapRatio(titleWords, words) >= 0.5;
  }).length;
  const evidenceUse = clamp10(cited.size * 5 + titleMentions * 2);

  // --- Relevance: engaging the actual dispute ---
  const caseWords = significantWords(
    `${caseData.title} ${caseData.claimSummary} ${caseData.plaintiffSide} ${caseData.defenseSide} ${(caseData.keyFacts || []).join(' ')}`
  );
  const relevance = clamp10(overlapRatio(caseWords, words) * 14);

  // --- Rebuttal: answering the opponent's last argument ---
  let rebuttal = 0;
  if (opponentLastMessage) {
    const oppWords = significantWords(opponentLastMessage);
    const engage = overlapRatio(oppWords, words);
    const counterSignals = /\b(however|but|contrary|incorrect|wrong|fails?|mischaracteriz|counsel (claims|argues|asserts)|opposing|my colleague|response to)\b/i.test(message) ? 3 : 0;
    rebuttal = clamp10(engage * 10 + counterSignals);
  }

  // --- Persuasion: structure and specificity ---
  const lengthScore = message.length >= 500 ? 4 : message.length >= 220 ? 3 : message.length >= 100 ? 2 : 1;
  const reasoning = (message.match(/\b(because|therefore|thus|which (shows|proves|means)|demonstrates|establishes|it follows)\b/gi) || []).length;
  const specifics = (message.match(/\b\d+(\.\d+)?%?\b/g) || []).length;
  const persuasion = clamp10(lengthScore + Math.min(reasoning * 2, 4) + Math.min(specifics, 2));

  const total = relevance + evidenceUse + rebuttal + persuasion;
  return { relevance, evidenceUse, rebuttal, persuasion, total, method: 'heuristic' };
}

/**
 * Aggregate the argument scores of one side across the trial.
 */
export function aggregateSideScore(transcript: TranscriptEntry[], role: 'prosecutor' | 'defense'): {
  turns: number;
  totalPoints: number;
  avgTotal: number;
} {
  const scored = transcript.filter(t => t.speakerRole === role && t.argumentScore);
  const totalPoints = scored.reduce((s, t) => s + (t.argumentScore?.total || 0), 0);
  return {
    turns: scored.length,
    totalPoints,
    avgTotal: scored.length ? Math.round((totalPoints / scored.length) * 10) / 10 : 0,
  };
}

/**
 * Optional LLM rubric scoring (quality mode 'high'). Falls back to the
 * heuristic on any failure — never blocks a turn.
 */
export async function scoreArgumentLLM(params: {
  message: string;
  role: AgentRole;
  evidence: Evidence[];
  caseData: CaseData;
  opponentLastMessage?: string;
  callModel: (prompt: string) => Promise<string>;
}): Promise<ArgumentScore> {
  const heuristic = scoreArgumentHeuristic(params);
  try {
    const prompt = `You are a strict debate judge. Score this courtroom argument on four 0-10 criteria.

CASE: ${params.caseData.title} — ${params.caseData.plaintiffSide} v. ${params.caseData.defenseSide}
CLAIM: ${params.caseData.claimSummary.slice(0, 300)}
${params.opponentLastMessage ? `OPPONENT'S LAST ARGUMENT: ${params.opponentLastMessage.slice(0, 400)}` : ''}
ARGUMENT BY ${params.role.toUpperCase()}: ${params.message.slice(0, 900)}

Respond ONLY with JSON: {"relevance":n,"evidenceUse":n,"rebuttal":n,"persuasion":n,"rationale":"one sentence"}`;
    const raw = await params.callModel(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    const parsed = JSON.parse(match[0]);
    const relevance = clamp10(Number(parsed.relevance));
    const evidenceUse = clamp10(Number(parsed.evidenceUse));
    const rebuttal = clamp10(Number(parsed.rebuttal));
    const persuasion = clamp10(Number(parsed.persuasion));
    if ([relevance, evidenceUse, rebuttal, persuasion].some(Number.isNaN)) throw new Error('bad numbers');
    return {
      relevance,
      evidenceUse,
      rebuttal,
      persuasion,
      total: relevance + evidenceUse + rebuttal + persuasion,
      method: 'llm',
      rationale: typeof parsed.rationale === 'string' ? parsed.rationale.slice(0, 200) : undefined,
    };
  } catch {
    return heuristic;
  }
}

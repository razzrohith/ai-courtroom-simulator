/**
 * juryEnrichment — Phase 25: AI-generated juror reasoning.
 * One LLM call turns the deterministic template juror opinions into
 * personalized, case-specific reasoning. Fails silently (templates remain).
 */

import type { CaseData, JurorVote, Verdict } from '../types/courtroom';
import { loadApiKey, loadCourtroomConfig } from '../types/providers';

const ENRICH_MODELS = ['google/gemma-4-31b-it:free', 'openai/gpt-oss-20b:free'];

export async function enrichJurorReasoning(
  caseData: CaseData,
  verdict: Verdict
): Promise<JurorVote[] | null> {
  const jurors = verdict.jurors;
  if (!jurors || jurors.length === 0) return null;

  const proxyUrl = import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
  const apiKey = loadApiKey('openrouter');
  const config = loadCourtroomConfig();
  const openRouterMode = config.judge?.openRouterMode || (proxyUrl ? 'demo' : 'personal');

  let url = '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (openRouterMode === 'demo' && proxyUrl) {
    url = proxyUrl;
  } else if (apiKey) {
    url = 'https://openrouter.ai/api/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'JudgeBench';
  } else {
    return null;
  }

  const jurorList = jurors
    .map((j, i) => `${i + 1}. ${j.name} (${j.persona}) voted for ${j.vote === 'plaintiff' ? caseData.plaintiffSide : caseData.defenseSide}`)
    .join('\n');

  const prompt = `You are writing juror deliberation notes for a fictional courtroom simulation.

Case: ${caseData.title}
Plaintiff: ${caseData.plaintiffSide} — Defendant: ${caseData.defenseSide}
Claim: ${caseData.claimSummary}
Outcome: ${verdict.winnerName || verdict.decision} prevailed. Court reasoning: ${verdict.reasoningSummary?.slice(0, 300)}

Jurors and their votes:
${jurorList}

For EACH juror, write ONE first-person sentence (max 25 words) explaining their vote in a voice matching their persona. Ground each in the actual case subject matter.
Respond with ONLY a JSON array of ${jurors.length} strings, in juror order. No markdown, no extra text.`;

  for (const model of ENRICH_MODELS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const message = data.choices?.[0]?.message || {};
      const text = ((message.content || '').trim() || (message.reasoning || '').trim());
      if (!text) throw new Error('empty completion');

      // Extract the JSON array (models sometimes wrap in fences)
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('no JSON array in response');
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed) || parsed.length < jurors.length) throw new Error('bad array shape');

      return jurors.map((j, i) => ({
        ...j,
        reasoning: typeof parsed[i] === 'string' && parsed[i].trim() ? parsed[i].trim() : j.reasoning,
      }));
    } catch (err) {
      console.warn(`Juror enrichment with ${model} failed:`, err);
    }
  }
  return null;
}

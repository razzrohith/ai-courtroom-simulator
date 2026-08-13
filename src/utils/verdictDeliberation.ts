/**
 * verdictDeliberation — Phase 26: real judicial deliberation.
 * After the deterministic Verdict 2.0 lands, one background LLM call rewrites
 * the judgment prose (reasoning, why-won/why-lost, key reasons) from the
 * ACTUAL transcript. The decision itself never changes — the model explains
 * the outcome the scored record produced. Fails silently.
 */

import type { CourtState, Verdict } from '../types/courtroom';
import { loadApiKey, loadCourtroomConfig } from '../types/providers';
import { sanitizeUserText } from './promptSafety';

const DELIBERATION_MODELS = ['google/gemma-4-31b-it:free', 'openai/gpt-oss-20b:free'];

export async function enrichVerdictDeliberation(
  state: CourtState,
  verdict: Verdict
): Promise<Partial<Verdict> | null> {
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

  // The real trial record, compressed for the deliberation
  const argumentLog = state.transcript
    .filter(t => t.isComplete && t.message && t.speakerRole !== 'judge')
    .slice(-14)
    .map(t => `[${t.speakerRole.toUpperCase()}${t.argumentScore ? ` ${t.argumentScore.total}/40` : ''}] ${sanitizeUserText(t.message, 220)}`)
    .join('\n');

  const prompt = `You are the presiding judge writing the final judgment in a fictional courtroom simulation. The outcome is ALREADY DECIDED by the scored record — your task is to explain it from the arguments below. Do not change the winner.

CASE: ${sanitizeUserText(state.case.title, 120)} — ${sanitizeUserText(state.case.plaintiffSide, 60)} (plaintiff) v. ${sanitizeUserText(state.case.defenseSide, 60)} (defendant)
CLAIM: ${sanitizeUserText(state.case.claimSummary, 300)}
DECIDED OUTCOME: ${verdict.winnerName} prevails (${verdict.decision}).
EVIDENCE RECORD: ${state.evidence.map(e => `${e.id}(${e.status})`).join(', ') || 'none'}

ARGUMENT LOG (with quality scores):
${argumentLog || '(no counsel arguments recorded)'}

Write judicial prose grounded ONLY in the log above — quote or reference actual arguments. Respond with ONLY this JSON (no markdown):
{"reasoningSummary":"3-4 sentence judgment referencing specific arguments","whyWinnerWon":"2 sentences citing their actual strongest points","whyLoserLost":"2 sentences citing their actual weaknesses","keyReasons":["reason grounded in a specific argument","second reason","third reason"]}`;

  for (const model of DELIBERATION_MODELS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 700,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const message = data.choices?.[0]?.message || {};
      const text = ((message.content || '').trim() || (message.reasoning || '').trim());
      if (!text) throw new Error('empty');
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON');
      const parsed = JSON.parse(match[0]);
      const out: Partial<Verdict> = {};
      if (typeof parsed.reasoningSummary === 'string' && parsed.reasoningSummary.length > 40) {
        out.reasoningSummary = parsed.reasoningSummary.slice(0, 1200);
      }
      if (typeof parsed.whyWinnerWon === 'string' && parsed.whyWinnerWon.length > 20) {
        out.whyWinnerWon = parsed.whyWinnerWon.slice(0, 600);
      }
      if (typeof parsed.whyLoserLost === 'string' && parsed.whyLoserLost.length > 20) {
        out.whyLoserLost = parsed.whyLoserLost.slice(0, 600);
      }
      if (Array.isArray(parsed.keyReasons) && parsed.keyReasons.length >= 2) {
        out.keyReasons = parsed.keyReasons.filter((r: unknown) => typeof r === 'string').slice(0, 5);
      }
      return Object.keys(out).length > 0 ? out : null;
    } catch (err) {
      console.warn(`Verdict deliberation with ${model} failed:`, err);
    }
  }
  return null;
}

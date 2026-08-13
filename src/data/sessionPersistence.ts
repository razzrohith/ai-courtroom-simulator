/**
 * Session Persistence — localStorage for courtroom session
 * Phase 6: Save/load session state
 */

import type { CourtState, ObjectionEvent } from '../types/courtroom';

const SESSION_KEY = 'judgebench.session.v1';

/**
 * Save current court state to localStorage
 */
export function saveSession(state: CourtState): void {
  try {
    const serializable = {
      currentPhase: state.currentPhase,
      currentSpeaker: state.currentSpeaker,
      transcript: state.transcript,
      evidence: state.evidence,
      verdict: state.verdict,
      isActive: state.isActive,
      case: state.case,
      objectionHistory: state.objectionHistory,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(serializable));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

/**
 * Load saved session from localStorage
 */
export function loadSession(): Partial<CourtState> | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    
    // Check if it's a stale Hen/Egg session (without schemaVersion or caseSource)
    if (parsed && parsed.case) {
      const isStaleHenEgg = 
        !parsed.case.schemaVersion && 
        (parsed.case.title?.toLowerCase().includes('hen') && parsed.case.title?.toLowerCase().includes('egg'));
      
      if (isStaleHenEgg) {
        console.warn('Discarding stale Hen/Egg session');
        clearSession();
        return null;
      }
    }
    
    return parsed;
  } catch (err) {
    console.error('Failed to load session:', err);
    return null;
  }
}

/**
 * Check if a session exists
 */
export function hasSavedSession(): boolean {
  return localStorage.getItem(SESSION_KEY) !== null;
}

/**
 * Get saved session metadata without full load
 */
export function getSavedSessionMeta(): { savedAt: string } | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return { savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

/**
 * Clear saved session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Create initial state with objection history
 */
export function getInitialWithObjections(): ObjectionEvent[] {
  return [];
}

// ---------------------------------------------------------------------------
// Phase 24: Case Library — named save slots
// ---------------------------------------------------------------------------

const LIBRARY_KEY = 'judgebench.caseLibrary.v1';

export interface CaseLibraryEntry {
  name: string;
  savedAt: string;
  caseTitle: string;
  phase: string;
  data: Partial<CourtState> & { savedAt?: string };
}

function serializeState(state: CourtState) {
  return {
    currentPhase: state.currentPhase,
    currentSpeaker: state.currentSpeaker,
    transcript: state.transcript,
    evidence: state.evidence,
    verdict: state.verdict,
    isActive: state.isActive,
    case: state.case,
    objectionHistory: state.objectionHistory,
    witnesses: state.witnesses,
    motionHistory: state.motionHistory,
    savedAt: new Date().toISOString(),
  };
}

function readLibrary(): Record<string, CaseLibraryEntry> {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLibrary(lib: Record<string, CaseLibraryEntry>): void {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
  } catch (err) {
    console.error('Failed to write case library:', err);
  }
}

export function saveToLibrary(state: CourtState, name: string): void {
  const lib = readLibrary();
  lib[name] = {
    name,
    savedAt: new Date().toISOString(),
    caseTitle: state.case.title || 'Untitled Case',
    phase: state.currentPhase,
    data: serializeState(state),
  };
  writeLibrary(lib);
}

export function listLibrary(): CaseLibraryEntry[] {
  return Object.values(readLibrary()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function loadFromLibrary(name: string): Partial<CourtState> | null {
  const entry = readLibrary()[name];
  return entry ? entry.data : null;
}

export function deleteFromLibrary(name: string): void {
  const lib = readLibrary();
  delete lib[name];
  writeLibrary(lib);
}

// ---------------------------------------------------------------------------
// Phase 24: Trial replay export / import (JSON files)
// ---------------------------------------------------------------------------

const REPLAY_VERSION = 1;

export function exportTrialReplay(state: CourtState): void {
  const replay = {
    format: 'judgebench-replay',
    version: REPLAY_VERSION,
    exportedAt: new Date().toISOString(),
    state: serializeState(state),
  };
  const blob = new Blob([JSON.stringify(replay, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (state.case.title || 'trial').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').slice(0, 50);
  a.download = `judgebench-${safeTitle}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseTrialReplay(fileContent: string): Partial<CourtState> {
  const parsed = JSON.parse(fileContent);
  if (parsed?.format !== 'judgebench-replay' || !parsed.state?.case) {
    throw new Error('Not a valid JudgeBench replay file.');
  }
  return parsed.state;
}

// ---------------------------------------------------------------------------
// Phase 24: Markdown case report export
// ---------------------------------------------------------------------------

/**
 * Phase 25: print-styled report — opens a formatted window and invokes the
 * browser print dialog (Save as PDF).
 */
export function exportCaseReportPdf(state: CourtState): void {
  const { case: c, verdict, evidence, objectionHistory, motionHistory, transcript } = state;
  const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(c.title)} — JudgeBench Report</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; margin: 40px auto; max-width: 720px; line-height: 1.55; }
  h1 { font-size: 26px; border-bottom: 3px double #8a6d1d; padding-bottom: 10px; }
  h2 { font-size: 16px; color: #8a6d1d; text-transform: uppercase; letter-spacing: 2px; margin-top: 28px; }
  .meta { color: #555; font-size: 13px; }
  .verdict { border: 2px solid #8a6d1d; padding: 14px 18px; margin: 14px 0; background: #faf6e9; }
  .entry { margin: 10px 0; font-size: 13px; }
  .speaker { font-weight: bold; font-variant: small-caps; }
  li { font-size: 13px; }
  .disclaimer { margin-top: 34px; font-size: 11px; color: #777; border-top: 1px solid #ccc; padding-top: 10px; font-style: italic; }
  @media print { body { margin: 12mm; } }
</style></head><body>
<h1>⚖️ ${esc(c.title)}</h1>
<p class="meta"><b>Case Type:</b> ${esc(c.caseType)} &nbsp;·&nbsp; <b>Plaintiff:</b> ${esc(c.plaintiffSide)} &nbsp;·&nbsp; <b>Defendant:</b> ${esc(c.defenseSide)}</p>
<h2>Claim Summary</h2><p>${esc(c.claimSummary)}</p>
${c.keyFacts?.length ? `<h2>Key Facts</h2><ul>${c.keyFacts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
${evidence.length ? `<h2>Evidence</h2><ul>${evidence.map(e => `<li><b>${esc(e.exhibitNumber || e.id)}</b> — ${esc(e.title)} <i>(${e.status})</i></li>`).join('')}</ul>` : ''}
${objectionHistory.length ? `<h2>Objections</h2><ul>${objectionHistory.map(o => `<li>${esc(o.type.replace(/_/g, ' '))} by ${o.raisedBy} — <b>${o.status.toUpperCase()}</b></li>`).join('')}</ul>` : ''}
${motionHistory.length ? `<h2>Motions</h2><ul>${motionHistory.map(m => `<li>${esc(m.motionType.replace(/_/g, ' '))} by ${m.raisedBy} — <b>${m.status.toUpperCase()}</b></li>`).join('')}</ul>` : ''}
${verdict ? `<h2>Verdict</h2><div class="verdict"><p><b>${esc(verdict.decision.replace(/_/g, ' ').toUpperCase())}</b>${verdict.winnerName ? ` — Prevailing party: <b>${esc(verdict.winnerName)}</b>` : ''}</p><p>${esc(verdict.reasoningSummary)}</p>${verdict.ruling ? `<p><i>${esc(verdict.ruling)}</i></p>` : ''}</div>` : ''}
${verdict?.jurors?.length ? `<h2>Jury Votes</h2><ul>${verdict.jurors.map(j => `<li><b>${esc(j.name)}</b> (${esc(j.persona)}) → ${j.vote}: <i>${esc(j.reasoning)}</i></li>`).join('')}</ul>` : ''}
<h2>Transcript</h2>
${transcript.filter(t => t.isComplete && t.message).map(t => `<div class="entry"><span class="speaker">[${t.speakerRole.toUpperCase()}] ${esc(t.speakerName)}</span> <i>(${esc(t.phase)})</i><br>${esc(t.message)}</div>`).join('')}
<p class="disclaimer">Generated by JudgeBench — AI courtroom simulation for educational purposes only. Not legal advice.</p>
<script>window.onload = function(){ window.print(); };</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export function exportCaseReportMarkdown(state: CourtState): void {
  const { case: c, verdict, evidence, objectionHistory, motionHistory, transcript } = state;
  const lines: string[] = [];
  lines.push(`# ${c.title || 'Untitled Case'}`);
  lines.push('');
  lines.push(`**Case Type:** ${c.caseType || '—'}  `);
  lines.push(`**Plaintiff:** ${c.plaintiffSide || '—'}  `);
  lines.push(`**Defendant:** ${c.defenseSide || '—'}  `);
  lines.push(`**Exported:** ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Claim Summary');
  lines.push(c.claimSummary || '—');
  lines.push('');

  if (c.keyFacts?.length) {
    lines.push('## Key Facts');
    c.keyFacts.forEach(f => lines.push(`- ${f}`));
    lines.push('');
  }

  if (evidence.length) {
    lines.push('## Evidence');
    evidence.forEach(e => lines.push(`- **${e.exhibitNumber || e.id}** — ${e.title} _(${e.status})_: ${e.summary}`));
    lines.push('');
  }

  if (objectionHistory.length) {
    lines.push('## Objections');
    objectionHistory.forEach(o => lines.push(`- ${o.type.replace(/_/g, ' ')} by ${o.raisedBy} — **${o.status.toUpperCase()}**`));
    lines.push('');
  }

  if (motionHistory.length) {
    lines.push('## Motions');
    motionHistory.forEach(m => lines.push(`- ${m.motionType.replace(/_/g, ' ')} by ${m.raisedBy} — **${m.status.toUpperCase()}**${m.rulingNote ? `: ${m.rulingNote}` : ''}`));
    lines.push('');
  }

  if (verdict) {
    lines.push('## Verdict');
    lines.push(`**Decision:** ${verdict.decision.replace(/_/g, ' ').toUpperCase()}`);
    if (verdict.winnerName) lines.push(`**Prevailing Party:** ${verdict.winnerName}`);
    lines.push('');
    lines.push(verdict.reasoningSummary || '');
    if (verdict.ruling) {
      lines.push('');
      lines.push(`> ${verdict.ruling}`);
    }
    if (verdict.keyReasons?.length) {
      lines.push('');
      lines.push('### Key Reasons');
      verdict.keyReasons.forEach(r => lines.push(`- ${r}`));
    }
    if (verdict.jurors?.length) {
      lines.push('');
      lines.push('### Jury Votes');
      verdict.jurors.forEach(j => lines.push(`- ${j.name} (${j.persona}) → **${j.vote}**: ${j.reasoning}`));
    }
    lines.push('');
  }

  lines.push('## Transcript');
  transcript.filter(t => t.isComplete && t.message).forEach(t => {
    lines.push(`**[${t.speakerRole.toUpperCase()}] ${t.speakerName}** _(${t.phase})_`);
    lines.push('');
    lines.push(t.message);
    lines.push('');
  });

  lines.push('---');
  lines.push('_Generated by JudgeBench — AI courtroom simulation for educational purposes only. Not legal advice._');

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (c.title || 'case-report').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').slice(0, 50);
  a.download = `judgebench-report-${safeTitle}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

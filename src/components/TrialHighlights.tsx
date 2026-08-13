/**
 * TrialHighlights — Phase 25: auto-compiled reel of the trial's key moments.
 * Deterministic extraction from the transcript and record — no LLM.
 */

import { motion } from 'framer-motion';
import type { CourtState } from '../types/courtroom';

interface Highlight {
  icon: string;
  label: string;
  quote: string;
  speaker: string;
  tint: string;
}

function firstSentence(text: string, maxLen = 160): string {
  const s = text.split(/(?<=[.!?])\s/)[0] || text;
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}

function extractHighlights(state: CourtState): Highlight[] {
  const highlights: Highlight[] = [];
  const t = state.transcript.filter(e => e.isComplete && e.message);

  const pOpening = t.find(e => e.phase === 'plaintiff_opening' && e.speakerRole === 'prosecutor');
  if (pOpening) {
    highlights.push({
      icon: '⚔️',
      label: 'Plaintiff Opening',
      quote: firstSentence(pOpening.message),
      speaker: pOpening.speakerName,
      tint: 'border-sky-500/30 bg-sky-500/[0.05]',
    });
  }

  const dOpening = t.find(e => e.phase === 'defense_opening' && e.speakerRole === 'defense');
  if (dOpening) {
    highlights.push({
      icon: '🛡️',
      label: 'Defense Opening',
      quote: firstSentence(dOpening.message),
      speaker: dOpening.speakerName,
      tint: 'border-rose-500/30 bg-rose-500/[0.05]',
    });
  }

  const firstEvidence = t.find(e => e.evidenceRef);
  if (firstEvidence) {
    highlights.push({
      icon: '📑',
      label: `First Exhibit Cited (${firstEvidence.evidenceRef})`,
      quote: firstSentence(firstEvidence.message),
      speaker: firstEvidence.speakerName,
      tint: 'border-emerald-500/30 bg-emerald-500/[0.05]',
    });
  }

  state.objectionHistory.filter(o => o.status !== 'pending').slice(0, 3).forEach(o => {
    highlights.push({
      icon: '✋',
      label: `Objection: ${o.type.replace(/_/g, ' ')} — ${o.status.toUpperCase()}`,
      quote: o.reason || `Raised by the ${o.raisedBy}; the court has ruled.`,
      speaker: o.id.startsWith('obj-player-') ? 'You (counsel)' : `The ${o.raisedBy}`,
      tint: o.status === 'sustained' ? 'border-brass-500/40 bg-brass-500/[0.06]' : 'border-white/10 bg-white/[0.03]',
    });
  });

  state.motionHistory.filter(m => m.status !== 'pending').forEach(m => {
    highlights.push({
      icon: '⚡',
      label: `${m.motionType.replace(/_/g, ' ')} — ${m.status.toUpperCase()}`,
      quote: m.rulingNote || m.reason,
      speaker: `Filed by the ${m.raisedBy}`,
      tint: m.status === 'granted' ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-white/10 bg-white/[0.03]',
    });
  });

  if (state.verdict) {
    highlights.push({
      icon: '🔨',
      label: 'The Verdict',
      quote: firstSentence(state.verdict.ruling || state.verdict.reasoningSummary, 200),
      speaker: 'The Court',
      tint: 'border-brass-500/50 bg-brass-500/[0.08]',
    });
  }

  return highlights;
}

export function TrialHighlights({ state }: { state: CourtState }) {
  const highlights = extractHighlights(state);
  if (highlights.length === 0) return null;

  return (
    <div className="glass-panel p-5 space-y-3">
      <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest flex items-center gap-1.5">
        🎬 Trial Highlights
      </h3>
      <div className="space-y-2">
        {highlights.map((h, i) => (
          <motion.div
            key={`${h.label}-${i}`}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`border rounded-xl p-3 ${h.tint}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{h.icon}</span>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">{h.label}</span>
            </div>
            <p className="text-[11px] text-gray-300 italic leading-relaxed">"{h.quote}"</p>
            <p className="text-[9px] text-gray-500 mt-1 font-semibold">— {h.speaker}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

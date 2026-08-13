/**
 * DegradationBanner — Phase 26: honest degradation.
 * When recent turns silently fell back to scripted text (provider failures),
 * say so prominently instead of letting the show pretend to be AI.
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { TranscriptEntry } from '../../types/courtroom';

interface DegradationBannerProps {
  transcript: TranscriptEntry[];
  onOpenSettings?: () => void;
}

export function DegradationBanner({ transcript, onOpenSettings }: DegradationBannerProps) {
  // Look at the last 5 completed spoken turns; 2+ explicit fallbacks = degraded
  const recent = transcript.filter(t => t.isComplete && t.message).slice(-5);
  const fallbacks = recent.filter(t => t.responseSource === 'fallback').length;
  const degraded = fallbacks >= 2;

  return (
    <AnimatePresence>
      {degraded && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="bg-amber-950/60 border border-amber-500/40 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs"
          role="status"
        >
          <span className="text-lg shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-amber-300">
              AI is temporarily unavailable — recent turns used scripted fallback text.
            </p>
            <p className="text-amber-200/70 text-[11px] mt-0.5">
              The free tier is likely rate-limited. Wait a minute and continue, or add a personal
              API key for uninterrupted AI.
            </p>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[11px] transition-colors"
            >
              Gateway Settings
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

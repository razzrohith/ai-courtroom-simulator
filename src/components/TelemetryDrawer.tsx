/**
 * TelemetryDrawer — Phase 25: in-app provider event log drawer.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getTelemetryEvents, clearTelemetryEvents } from '../providers/telemetry';

const levelStyles: Record<string, string> = {
  info: 'text-sky-300 border-sky-500/30 bg-sky-500/[0.06]',
  warn: 'text-amber-300 border-amber-500/30 bg-amber-500/[0.06]',
  error: 'text-red-300 border-red-500/30 bg-red-500/[0.06]',
};

export function TelemetryDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('judgebench-telemetry', handler);
    return () => window.removeEventListener('judgebench-telemetry', handler);
  }, []);

  void tick;
  const events = getTelemetryEvents();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 bottom-0 w-80 z-[60] bg-ink-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col"
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest">🔍 Provider Telemetry</h3>
            <div className="flex gap-2">
              <button
                onClick={clearTelemetryEvents}
                className="text-[10px] font-bold text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold"
                aria-label="Close telemetry drawer"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {events.length === 0 ? (
              <p className="text-[11px] text-gray-500 text-center pt-8">
                No provider events yet. Failures, retries, and fallbacks will appear here.
              </p>
            ) : (
              events.map((e, i) => (
                <div key={`${e.timestamp}-${i}`} className={`border rounded-lg p-2 text-[10px] ${levelStyles[e.level]}`}>
                  <div className="flex justify-between mb-0.5">
                    <span className="font-black uppercase">{e.source}</span>
                    <span className="text-gray-500 font-mono">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-300 leading-snug break-words">{e.message}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

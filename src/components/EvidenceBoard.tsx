/**
 * EvidenceBoard — Display and manage case evidence.
 * Gilded Verdict redesign: staggered animated exhibit cards + click-to-inspect
 * evidence detail modal.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Evidence, EvidenceStatus } from '../types/courtroom';
import { EmptyStatePlaceholder, SealedEnvelopeIllustration } from './visuals/CourtroomVisuals';

interface EvidenceBoardProps {
  evidence: Evidence[];
}

const statusStyles: Record<EvidenceStatus, { label: string; class: string; ring: string }> = {
  pending: { label: 'Pending', class: 'bg-white/5 text-gray-400 border border-white/10', ring: 'border-white/10' },
  offered: { label: 'Offered', class: 'bg-sky-500/15 text-sky-300 border border-sky-500/30', ring: 'border-sky-500/30' },
  admitted: { label: 'Admitted', class: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30', ring: 'border-emerald-500/40' },
  disputed: { label: 'Disputed', class: 'bg-red-500/15 text-red-300 border border-red-500/30', ring: 'border-red-500/40' },
  excluded: { label: 'Excluded', class: 'bg-red-900/40 text-red-400 border border-red-800/50', ring: 'border-red-800/50' },
  sealed: { label: 'Sealed', class: 'bg-purple-500/15 text-purple-300 border border-purple-500/30', ring: 'border-purple-500/40' },
};

const typeIcons: Record<Evidence['type'], string> = {
  document: '📄',
  email: '📧',
  report: '📊',
  physical: '📦',
  testimony: '👤',
  digital: '💻',
};

export function EvidenceBoard({ evidence }: EvidenceBoardProps) {
  const [selected, setSelected] = useState<Evidence | null>(null);

  return (
    <div>
      <div className="pb-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest">
          📋 Evidence Board
        </h3>
        <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full tabular-nums">
          {evidence.length} exhibit{evidence.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="pt-3 grid gap-2.5 max-h-[400px] overflow-y-auto pr-1">
        {evidence.length === 0 ? (
          <EmptyStatePlaceholder
            icon="📋"
            title="No Evidence Yet"
            message="Evidence will be introduced during proceedings."
          />
        ) : evidence.map((item, index) => {
          const status = statusStyles[item.status];
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.4), type: 'spring', stiffness: 300, damping: 26 }}
              whileHover={{ scale: 1.015, x: 2 }}
              onClick={() => setSelected(item)}
              className={`text-left glass-panel !rounded-xl p-3.5 border ${status.ring} cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-1.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {item.confidentiality === 'sealed' && <SealedEnvelopeIllustration className="w-4 h-4 shrink-0" />}
                  <span className="text-base shrink-0 group-hover:scale-125 transition-transform duration-200">
                    {typeIcons[item.type]}
                  </span>
                  {item.exhibitNumber && (
                    <span className="text-[9px] font-black text-brass-300 bg-brass-500/10 border border-brass-500/25 rounded px-1.5 py-0.5 shrink-0">
                      {item.exhibitNumber}
                    </span>
                  )}
                  <span className="text-[13px] font-semibold text-gray-200 truncate">{item.title}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${status.class}`}>
                  {status.label}
                </span>
              </div>

              <p className="text-[11px] text-gray-400 mb-1.5 line-clamp-2 leading-relaxed">{item.summary}</p>

              <div className="text-[10px] text-gray-500 flex items-center gap-2">
                <span className="capitalize">{item.type}</span>
                <span className="text-gray-700">•</span>
                <span className="capitalize">By: {item.introducedBy}</span>
                <span className="ml-auto text-brass-400/0 group-hover:text-brass-400/90 transition-colors duration-200 font-semibold">
                  Inspect 🔍
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Evidence Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="glass-panel-brass max-w-lg w-full p-6 relative"
              initial={{ scale: 0.9, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all duration-150 text-sm font-bold"
                aria-label="Close evidence detail"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{typeIcons[selected.type]}</span>
                <div className="min-w-0">
                  {selected.exhibitNumber && (
                    <span className="text-[10px] font-black text-brass-300 bg-brass-500/10 border border-brass-500/25 rounded px-1.5 py-0.5">
                      EXHIBIT {selected.exhibitNumber}
                    </span>
                  )}
                  <h4 className="font-display text-lg font-bold text-white mt-1 leading-tight">{selected.title}</h4>
                </div>
              </div>

              <div className="brass-divider mb-4" />

              <p className="text-sm text-gray-300 leading-relaxed mb-5">{selected.summary}</p>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="glass-panel !rounded-lg p-2.5">
                  <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Status</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusStyles[selected.status].class}`}>
                    {statusStyles[selected.status].label}
                  </span>
                </div>
                <div className="glass-panel !rounded-lg p-2.5">
                  <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Type</span>
                  <span className="text-[11px] font-bold text-gray-300 capitalize">{selected.type}</span>
                </div>
                <div className="glass-panel !rounded-lg p-2.5">
                  <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Introduced By</span>
                  <span className="text-[11px] font-bold text-gray-300 capitalize">{selected.introducedBy}</span>
                </div>
              </div>

              {selected.confidentiality !== 'public' && (
                <div className="mt-4 text-[11px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/25 rounded-lg px-3 py-2 flex items-center gap-2">
                  🔐 Confidentiality: <span className="uppercase">{selected.confidentiality}</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

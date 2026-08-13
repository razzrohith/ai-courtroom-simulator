/**
 * ObjectionFlash — Cinematic "OBJECTION!" overlay that slams in
 * whenever a new pending objection appears, then fades out.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ObjectionEvent } from '../../types/courtroom';

interface ObjectionFlashProps {
  objections: ObjectionEvent[];
  onAppear?: () => void;
}

export function ObjectionFlash({ objections, onAppear }: ObjectionFlashProps) {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState<string>('');
  const seenIds = useRef<Set<string>>(new Set());
  const onAppearRef = useRef(onAppear);
  useEffect(() => {
    onAppearRef.current = onAppear;
  }, [onAppear]);

  useEffect(() => {
    // Fire for ANY newly raised objection — pending (interactive) or auto-resolved
    const fresh = objections.find(o => !seenIds.current.has(o.id));
    if (!fresh) return;
    seenIds.current.add(fresh.id);
    setLabel(fresh.type ? fresh.type.replace(/_/g, ' ') : 'Objection');
    setVisible(true);
    onAppearRef.current?.();
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [objections]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          {/* Red vignette burst */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(190,18,60,0.28) 0%, rgba(120,10,40,0.16) 45%, transparent 75%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.75] }}
            transition={{ duration: 0.5 }}
          />
          {/* Slamming word */}
          <motion.div
            initial={{ scale: 3.2, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: -4, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className="relative select-none text-center"
          >
            <span
              className="font-display font-black tracking-wider text-6xl md:text-8xl uppercase"
              style={{
                color: '#ff2d55',
                textShadow:
                  '0 0 30px rgba(255,45,85,0.7), 0 4px 0 #7f1d1d, 0 8px 24px rgba(0,0,0,0.8)',
                WebkitTextStroke: '2px #fecdd3',
              }}
            >
              Objection!
            </span>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-3"
            >
              <span className="px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm md:text-base font-bold uppercase tracking-widest shadow-lg">
                {label}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

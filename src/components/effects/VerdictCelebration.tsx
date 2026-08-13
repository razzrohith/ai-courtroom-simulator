/**
 * VerdictCelebration — Full-screen gavel slam + brass confetti burst
 * played once when the verdict is delivered.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { Verdict } from '../../types/courtroom';

interface VerdictCelebrationProps {
  verdict: Verdict | null;
  winnerName?: string;
  onAppear?: () => void;
}

const BRASS_COLORS = ['#f5d47a', '#c9a227', '#e9c05a', '#ffffff', '#d9ae3e'];

function fireConfetti() {
  const defaults = { colors: BRASS_COLORS, disableForReducedMotion: true, zIndex: 200 };
  confetti({ ...defaults, particleCount: 90, spread: 75, origin: { x: 0.5, y: 0.55 }, startVelocity: 42 });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    confetti({ ...defaults, particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
  }, 250);
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 60, spread: 100, origin: { x: 0.5, y: 0.4 }, scalar: 0.8 });
  }, 550);
}

export function VerdictCelebration({ verdict, winnerName, onAppear }: VerdictCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const firedRef = useRef(false);
  const onAppearRef = useRef(onAppear);
  useEffect(() => {
    onAppearRef.current = onAppear;
  }, [onAppear]);

  useEffect(() => {
    if (!verdict || firedRef.current) return;
    firedRef.current = true;
    setVisible(true);
    onAppearRef.current?.();
    const confettiTimer = setTimeout(fireConfetti, 500);
    const hideTimer = setTimeout(() => setVisible(false), 3600);
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(hideTimer);
    };
  }, [verdict]);

  // Allow re-firing if a brand-new verdict object arrives after a reset
  useEffect(() => {
    if (!verdict) firedRef.current = false;
  }, [verdict]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[95] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(201,162,39,0.22) 0%, rgba(10,8,2,0.55) 70%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          <div className="relative text-center select-none px-6">
            {/* Gavel slam */}
            <motion.div
              className="text-8xl md:text-9xl inline-block"
              initial={{ rotate: -55, y: -60, opacity: 0 }}
              animate={{ rotate: [-55, 15, -8, 0], y: [-60, 6, -2, 0], opacity: 1 }}
              transition={{ duration: 0.8, times: [0, 0.55, 0.75, 1], ease: 'easeOut' }}
            >
              🔨
            </motion.div>

            <motion.h2
              className="font-display font-black uppercase tracking-widest text-4xl md:text-6xl text-brass-gradient mt-2"
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 220, damping: 18 }}
            >
              Verdict Reached
            </motion.h2>

            {winnerName && (
              <motion.p
                className="mt-4 text-lg md:text-2xl font-bold text-white"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <span className="text-brass-200">🏆 In favor of </span>
                <span className="underline decoration-brass-500 decoration-2 underline-offset-4">
                  {winnerName}
                </span>
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

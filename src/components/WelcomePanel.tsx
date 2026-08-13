/**
 * WelcomePanel — Cinematic landing hero for the Gilded Verdict redesign.
 * Animated scales, staggered feature cards, brass call-to-action.
 */

import { motion } from 'framer-motion';
import type { CaseData } from '../types/courtroom';
import { fadeUp, staggerContainer, scaleIn } from './ui/motionPresets';

interface WelcomePanelProps {
  caseData: CaseData;
  onStart: () => void;
  onOpenSettings: () => void;
  isOpenRouterConfigured: boolean;
}

const checkCaseSetupComplete = (c: CaseData): boolean => {
  return !!(
    c.title?.trim() &&
    c.caseType?.trim() &&
    c.plaintiffSide?.trim() &&
    c.defenseSide?.trim() &&
    c.claimSummary?.trim()
  );
};

const FEATURES = [
  {
    icon: '🎭',
    title: 'Three AI Litigators',
    body: 'AI agents play the Plaintiff, the Defense, and a presiding Judge. They argue, submit exhibits, raise objections, and hand down reasoned verdicts on any case you construct.',
  },
  {
    icon: '🪄',
    title: 'AI-Assisted Case Drafting',
    body: 'Type a one-line dispute idea — "ChatGPT and Claude debate who writes better code" — and Generate Case Draft builds the full case file, facts, and exhibits for you.',
  },
  {
    icon: '🎬',
    title: 'A Living Courtroom',
    body: 'Watch the trial unfold on an animated 2D stage: speaking counsel light up, objections slam across the screen, and the gavel falls when the verdict lands.',
  },
  {
    icon: '🌐',
    title: 'Zero-Config Free Demo',
    body: 'Runs out of the box on the OpenRouter free tier through a secure proxy — no API keys, no payments. Plug in personal keys anytime from Gateway Settings.',
  },
];

export function WelcomePanel({
  caseData,
  onStart,
  onOpenSettings,
  isOpenRouterConfigured,
}: WelcomePanelProps) {
  const isSetupComplete = checkCaseSetupComplete(caseData);

  return (
    <motion.div
      className="glass-panel h-full p-6 md:p-8 flex flex-col justify-between overflow-hidden relative"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Ambient glow orbs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brass-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

      <div className="space-y-8 relative">
        {/* Hero header */}
        <motion.div variants={fadeUp} className="text-center pt-2">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-panel-brass text-5xl mb-5 animate-float-slow"
            variants={scaleIn}
          >
            ⚖️
          </motion.div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-brass-gradient tracking-wide">
            JudgeBench
          </h2>
          <p className="text-sm text-gray-400 mt-2 tracking-widest uppercase font-semibold">
            The Interactive AI Courtroom Simulator
          </p>
          <div className="brass-divider w-48 mx-auto mt-5" />
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(feature => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-panel !rounded-xl p-5 space-y-2 hover:border-brass-500/30 transition-colors duration-300 group"
            >
              <h3 className="text-sm font-bold text-brass-200 flex items-center gap-2">
                <span className="text-xl group-hover:scale-125 transition-transform duration-300 inline-block">
                  {feature.icon}
                </span>
                {feature.title}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">{feature.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Gateway status strip */}
        <motion.div
          variants={fadeUp}
          className="glass-panel !rounded-xl p-3.5 flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2.5 text-gray-400">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                  isOpenRouterConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isOpenRouterConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span>AI Gateway Status:</span>
            <span
              className={`font-bold ${
                isOpenRouterConfigured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isOpenRouterConfigured ? 'Free Demo Ready' : 'Mock Fallback Mode'}
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-brass-300 hover:text-brass-200 font-bold hover:underline underline-offset-2"
          >
            Open Settings ⚙️
          </button>
        </motion.div>
      </div>

      {/* Action footer */}
      <motion.div variants={fadeUp} className="pt-8 flex flex-col items-center gap-4 relative">
        {isSetupComplete ? (
          <div className="w-full text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-full text-xs text-emerald-300 font-bold"
            >
              ✅ Case Setup Complete
            </motion.div>
            <p className="text-xs text-gray-400 tracking-wide">
              The case file is ready. Let the legal battle begin.
            </p>
            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn-brass w-full max-w-md py-4 text-base font-display tracking-wider"
            >
              ⚖️ Start Courtroom Trial Simulation
            </motion.button>
          </div>
        ) : (
          <div className="w-full text-center p-5 glass-panel-brass !rounded-xl max-w-lg">
            <h4 className="text-sm font-bold text-brass-200 mb-1.5">Awaiting Case Setup ⏳</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Use the panel on the right to enter your case title, parties, and summary. Load the{' '}
              <b className="text-gray-300">Hen v. Egg</b> preset, generate a case draft using AI, or
              edit manually.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

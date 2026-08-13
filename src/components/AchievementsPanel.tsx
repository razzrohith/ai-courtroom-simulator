/**
 * AchievementsPanel — Phase 25: lifetime badges and stats.
 */

import { motion } from 'framer-motion';
import { ACHIEVEMENTS, loadStats } from '../utils/achievements';

export function AchievementsPanel({ refreshKey }: { refreshKey?: number }) {
  void refreshKey; // re-render trigger only
  const stats = loadStats();

  return (
    <div className="glass-panel p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest flex items-center gap-1.5">
          🏅 Achievements
        </h3>
        <span className="text-[10px] text-gray-500 font-bold tabular-nums">
          {ACHIEVEMENTS.filter(a => a.unlocked(stats)).length}/{ACHIEVEMENTS.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ACHIEVEMENTS.map((a, i) => {
          const unlocked = a.unlocked(stats);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              title={`${a.title} — ${a.description}`}
              className={`rounded-xl p-2.5 text-center border transition-colors ${
                unlocked
                  ? 'glass-panel-brass !rounded-xl'
                  : 'bg-white/[0.02] border-white/5 opacity-45 grayscale'
              }`}
            >
              <span className="block text-2xl mb-1">{a.icon}</span>
              <span className={`block text-[9px] font-black uppercase tracking-wide leading-tight ${unlocked ? 'text-brass-200' : 'text-gray-500'}`}>
                {a.title}
              </span>
              <span className="block text-[8px] text-gray-500 mt-0.5 leading-tight">{a.description}</span>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-500 pt-1 border-t border-white/5">
        {stats.trialsCompleted} trial{stats.trialsCompleted === 1 ? '' : 's'} completed · {stats.argumentsDelivered} arguments delivered · {stats.playerObjectionsSustained} objections sustained
      </p>
    </div>
  );
}

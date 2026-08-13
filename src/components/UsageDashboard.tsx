/**
 * UsageDashboard — Session token usage, latency, and cost overview.
 * Phase 24: surfaces the runtime metadata that was previously computed
 * but never displayed.
 */

import { motion } from 'framer-motion';
import type { TranscriptEntry, AgentRole } from '../types/courtroom';

interface UsageDashboardProps {
  transcript: TranscriptEntry[];
}

const ROLE_META: Record<AgentRole, { label: string; color: string }> = {
  judge: { label: 'Judge', color: 'text-brass-300' },
  prosecutor: { label: 'Prosecutor', color: 'text-sky-400' },
  defense: { label: 'Defense', color: 'text-rose-400' },
};

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function UsageDashboard({ transcript }: UsageDashboardProps) {
  const turns = transcript.filter(t => t.isComplete);
  const realTurns = turns.filter(t => t.responseSource === 'real');
  const mockTurns = turns.filter(t => t.responseSource !== 'real');
  const totalTokens = turns.reduce((sum, t) => sum + (t.totalTokens || 0), 0);
  const totalCost = turns.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
  const latencies = turns.map(t => t.latencyMs || 0).filter(l => l > 0);
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;

  const perRole = (['judge', 'prosecutor', 'defense'] as AgentRole[]).map(role => {
    const roleTurns = turns.filter(t => t.speakerRole === role);
    return {
      role,
      turns: roleTurns.length,
      tokens: roleTurns.reduce((sum, t) => sum + (t.totalTokens || 0), 0),
    };
  });

  return (
    <div className="glass-panel !rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest flex items-center gap-1.5">
        📊 Session Usage
      </h3>

      {turns.length === 0 ? (
        <p className="text-[11px] text-gray-500">Usage statistics will appear as the trial proceeds.</p>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Turns', value: String(turns.length) },
              { label: 'Tokens (est.)', value: formatTokens(totalTokens) },
              { label: 'Avg Latency', value: avgLatency ? `${(avgLatency / 1000).toFixed(1)}s` : '—' },
              { label: 'Est. Cost', value: totalCost > 0 ? `$${totalCost.toFixed(4)}` : 'Free' },
            ].map(stat => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/5 rounded-lg p-2 text-center"
              >
                <span className="block text-sm font-black text-white tabular-nums">{stat.value}</span>
                <span className="block text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Real vs mock split */}
          <div className="flex items-center gap-2 text-[10px] font-semibold">
            <span className="text-emerald-400">● {realTurns.length} live AI</span>
            <span className="text-gray-500">● {mockTurns.length} scripted/fallback</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden ml-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                style={{ width: `${turns.length ? (realTurns.length / turns.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Per-role breakdown */}
          <div className="space-y-1 pt-1 border-t border-white/5">
            {perRole.map(row => (
              <div key={row.role} className="flex items-center justify-between text-[10px]">
                <span className={`font-bold ${ROLE_META[row.role].color}`}>{ROLE_META[row.role].label}</span>
                <span className="text-gray-400 tabular-nums">
                  {row.turns} turns · {formatTokens(row.tokens)} tokens
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

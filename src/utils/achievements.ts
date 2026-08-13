/**
 * achievements — Phase 25: local badge system.
 * Stats accumulate in localStorage; badges unlock from lifetime stats.
 */

import type { CourtState } from '../types/courtroom';

const STATS_KEY = 'judgebench.stats.v1';

export interface PlayerStats {
  trialsCompleted: number;
  winsAsProsecutor: number;
  winsAsDefense: number;
  playerObjections: number;
  playerObjectionsSustained: number;
  argumentsDelivered: number;
  casesFromGallery: number;
}

const EMPTY_STATS: PlayerStats = {
  trialsCompleted: 0,
  winsAsProsecutor: 0,
  winsAsDefense: 0,
  playerObjections: 0,
  playerObjectionsSustained: 0,
  argumentsDelivered: 0,
  casesFromGallery: 0,
};

export function loadStats(): PlayerStats {
  try {
    return { ...EMPTY_STATS, ...JSON.parse(localStorage.getItem(STATS_KEY) || '{}') };
  } catch {
    return { ...EMPTY_STATS };
  }
}

function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

/** Record a completed trial into lifetime stats. Call once per completion. */
export function recordTrialCompletion(
  state: CourtState,
  userRole: 'none' | 'prosecutor' | 'defense' | 'both'
): PlayerStats {
  const stats = loadStats();
  stats.trialsCompleted += 1;

  if (state.case.id?.startsWith('case-pack-')) {
    stats.casesFromGallery += 1;
  }

  const humanTurns = state.transcript.filter(t => t.providerUsed === 'human' && !t.id.startsWith('trans-objection-'));
  stats.argumentsDelivered += humanTurns.length;

  const playerObjections = state.objectionHistory.filter(o => o.id.startsWith('obj-player-'));
  stats.playerObjections += playerObjections.length;
  stats.playerObjectionsSustained += playerObjections.filter(o => o.status === 'sustained').length;

  if (state.verdict && userRole !== 'none') {
    const plaintiffWon = state.verdict.decision === 'plaintiff_wins';
    if ((userRole === 'prosecutor' || userRole === 'both') && plaintiffWon) stats.winsAsProsecutor += 1;
    if ((userRole === 'defense' || userRole === 'both') && state.verdict.decision === 'defense_wins') stats.winsAsDefense += 1;
  }

  saveStats(stats);
  return stats;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: (s: PlayerStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-gavel', icon: '🔨', title: 'First Gavel', description: 'Complete your first trial', unlocked: s => s.trialsCompleted >= 1 },
  { id: 'court-regular', icon: '🏛️', title: 'Court Regular', description: 'Complete 5 trials', unlocked: s => s.trialsCompleted >= 5 },
  { id: 'marathon-litigator', icon: '⚖️', title: 'Marathon Litigator', description: 'Complete 15 trials', unlocked: s => s.trialsCompleted >= 15 },
  { id: 'peoples-counsel', icon: '⚔️', title: "People's Counsel", description: 'Win a trial as Prosecutor', unlocked: s => s.winsAsProsecutor >= 1 },
  { id: 'shield-of-justice', icon: '🛡️', title: 'Shield of Justice', description: 'Win a trial as Defense', unlocked: s => s.winsAsDefense >= 1 },
  { id: 'objection-sustained', icon: '✋', title: 'Objection Sustained!', description: 'Have a player objection sustained', unlocked: s => s.playerObjectionsSustained >= 1 },
  { id: 'silver-tongue', icon: '🎤', title: 'Silver Tongue', description: 'Deliver 10 arguments in play-a-role mode', unlocked: s => s.argumentsDelivered >= 10 },
  { id: 'case-collector', icon: '🗃️', title: 'Case Collector', description: 'Try 3 cases from the gallery', unlocked: s => s.casesFromGallery >= 3 },
];

export function getUnlockedAchievements(stats: PlayerStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.unlocked(stats));
}

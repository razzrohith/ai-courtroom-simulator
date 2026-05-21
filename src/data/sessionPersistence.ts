/**
 * Session Persistence — localStorage for courtroom session
 * Phase 6: Save/load session state
 */

import type { CourtState, ObjectionEvent } from '../types/courtroom';

const SESSION_KEY = 'judgebench.session.v1';

/**
 * Save current court state to localStorage
 */
export function saveSession(state: CourtState): void {
  try {
    const serializable = {
      currentPhase: state.currentPhase,
      currentSpeaker: state.currentSpeaker,
      transcript: state.transcript,
      evidence: state.evidence,
      verdict: state.verdict,
      isActive: state.isActive,
      case: state.case,
      objectionHistory: state.objectionHistory,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(serializable));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

/**
 * Load saved session from localStorage
 */
export function loadSession(): Partial<CourtState> | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch (err) {
    console.error('Failed to load session:', err);
    return null;
  }
}

/**
 * Check if a session exists
 */
export function hasSavedSession(): boolean {
  return localStorage.getItem(SESSION_KEY) !== null;
}

/**
 * Get saved session metadata without full load
 */
export function getSavedSessionMeta(): { savedAt: string } | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return { savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

/**
 * Clear saved session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Create initial state with objection history
 */
export function getInitialWithObjections(): ObjectionEvent[] {
  return [];
}

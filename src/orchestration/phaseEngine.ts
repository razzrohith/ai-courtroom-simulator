/**
 * Phase Engine — Manages progression through courtroom phases
 */

import type { CourtPhase, AgentRole } from '../types/courtroom';
import { COURT_PHASES, PHASE_LABELS } from '../types/courtroom';

/**
 * Phase progression logic
 */
export interface PhaseControllerConfig {
  currentPhase: CourtPhase;
  phaseIndex: number;
  isComplete: boolean;
}

/**
 * Advance to next phase
 */
export function advancePhase(currentPhase: CourtPhase): CourtPhase {
  const currentIndex = COURT_PHASES.indexOf(currentPhase);
  const nextIndex = currentIndex + 1;
  
  if (nextIndex >= COURT_PHASES.length) {
    return COURT_PHASES[COURT_PHASES.length - 1]; // Stay at last phase
  }
  
  return COURT_PHASES[nextIndex];
}

/**
 * Go back to previous phase
 */
export function retreatPhase(currentPhase: CourtPhase): CourtPhase {
  const currentIndex = COURT_PHASES.indexOf(currentPhase);
  const prevIndex = currentIndex - 1;
  
  if (prevIndex < 0) {
    return COURT_PHASES[0]; // Stay at first phase
  }
  
  return COURT_PHASES[prevIndex];
}

/**
 * Get speaker order for a given phase
 * Returns ordered list of speakers for that phase
 */
export function getSpeakersForPhase(phase: CourtPhase): AgentRole[] {
  const speakerMap: Record<CourtPhase, AgentRole[]> = {
    case_setup: [],
    court_opening: ['judge'],
    plaintiff_opening: ['prosecutor', 'judge'],
    defense_opening: ['defense'],
    evidence_presentation: ['prosecutor', 'judge', 'defense', 'judge'],
    objection_ruling: ['judge'],
    cross_examination: ['prosecutor', 'defense', 'judge'],
    rebuttal: ['prosecutor', 'defense'],
    closing_arguments: ['prosecutor', 'defense'],
    judge_deliberation: ['judge'],
    verdict: ['judge'],
    case_summary: ['judge'],
  };
  
  return speakerMap[phase];
}

/**
 * Determine next speaker based on current speaker and phase
 */
export function getNextSpeaker(
  phase: CourtPhase,
  currentSpeaker: AgentRole | null
): AgentRole | null {
  const speakers = getSpeakersForPhase(phase);
  
  if (speakers.length === 0) {
    return null; // Phase doesn't have speakers (e.g., case_setup)
  }
  
  if (currentSpeaker === null) {
    return speakers[0]; // First speaker
  }
  
  const currentIndex = speakers.indexOf(currentSpeaker);
  const nextIndex = currentIndex + 1;
  
  if (nextIndex >= speakers.length) {
    return null; // No more speakers in this phase
  }
  
  return speakers[nextIndex];
}

/**
 * Check if phase is complete
 */
export function isPhaseComplete(
  phase: CourtPhase,
  speakerTurns: number
): boolean {
  const speakers = getSpeakersForPhase(phase);
  return speakerTurns >= speakers.length;
}

/**
 * Get phase label
 */
export function getPhaseLabel(phase: CourtPhase): string {
  return PHASE_LABELS[phase] || phase;
}

/**
 * Get progress percentage for the trial
 */
export function getTrialProgress(currentPhase: CourtPhase): number {
  const currentIndex = COURT_PHASES.indexOf(currentPhase);
  return Math.round((currentIndex / (COURT_PHASES.length - 1)) * 100);
}

/**
 * Check if we're in final phases
 */
export function isTrialConcluding(currentPhase: CourtPhase): boolean {
  const concludingPhases: CourtPhase[] = ['judge_deliberation', 'verdict', 'case_summary'];
  return concludingPhases.includes(currentPhase);
}

/**
 * Check if courtroom is ready for verdict
 */
export function isReadyForVerdict(currentPhase: CourtPhase): boolean {
  return currentPhase === 'verdict' || currentPhase === 'case_summary';
}

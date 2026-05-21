/**
 * Court Controller — Main state machine for courtroom simulation
 * 
 * Coordinates transcript, evidence, phases, and verdict generation.
 */

import type { 
  CourtState, 
  AgentRole, 
  TranscriptEntry, 
  Evidence,
  AgentParticipant 
} from '../types/courtroom';
import { COURT_PHASES } from '../types/courtroom';
import { SAMPLE_CASE } from '../data/sampleCase';
import { MOCK_MESSAGES, MOCK_VERDICT } from '../data/mockCourtFlow';
import { createMockConfig } from '../providers/modelProviderTypes';
import { getSpeakersForPhase, getNextSpeaker } from './phaseEngine';

/**
 * Initial court state
 */
export function createInitialState(): CourtState {
  const participants: AgentParticipant[] = [
    {
      id: 'judge-001',
      role: 'judge',
      name: 'Honorable Sarah Mitchell',
      title: 'Presiding Judge',
      modelConfig: createMockConfig('judge'),
    },
    {
      id: 'prosecutor-001',
      role: 'prosecutor',
      name: 'Attorney Rebecca Chen',
      title: 'Counsel for Plaintiff',
      modelConfig: createMockConfig('prosecutor'),
    },
    {
      id: 'defense-001',
      role: 'defense',
      name: 'Attorney Marcus Williams',
      title: 'Counsel for Defendant',
      modelConfig: createMockConfig('defense'),
    },
  ];

  return {
    objectionHistory: [],
    currentPhase: 'case_setup',
    currentSpeaker: null,
    participants,
    transcript: [],
    evidence: [...SAMPLE_CASE.evidenceItems],
    verdict: null,
    case: SAMPLE_CASE,
    isActive: false,
  };
}

/**
 * Start the simulation
 */
export function startSimulation(state: CourtState): CourtState {
  return {
    ...state,
    isActive: true,
    currentPhase: 'court_opening',
    currentSpeaker: 'judge',
  };
}

/**
 * Reset to initial state
 */
export function resetSimulation(): CourtState {
  return createInitialState();
}

/**
 * Get participant name by role
 */
export function getParticipantName(state: CourtState, role: AgentRole): string {
  const participant = state.participants.find(p => p.role === role);
  return participant?.name || role.toUpperCase();
}

/**
 * Process next turn - generates mock transcript entry
 */
export function processNextTurn(state: CourtState): CourtState {
  if (!state.isActive) return state;
  
  const phase = state.currentPhase;
  const currentSpeaker = state.currentSpeaker;
  
  // Get mock messages for current phase and speaker
  if (!currentSpeaker) {
    // Move to first speaker
    const speakers = getSpeakersForPhase(phase);
    if (speakers.length === 0) {
      // Auto-advance phase with no speakers
      return advanceToNextPhase(state);
    }
    const nextSpeaker = speakers[0];
    return addTranscriptEntry(state, nextSpeaker);
  }
  
  const messages = MOCK_MESSAGES[phase]?.[currentSpeaker];
  if (!messages) {
    return advanceToNextPhase(state);
  }
  
  // Count how many entries exist for this speaker in current phase
  const phaseEntries = state.transcript.filter(t => t.phase === phase && t.speakerRole === currentSpeaker);
  
  if (phaseEntries.length >= messages.length) {
    // This speaker has spoken all their messages - move to next speaker
    const nextSpeaker = getNextSpeaker(phase, currentSpeaker);
    if (nextSpeaker) {
      return addTranscriptEntry(state, nextSpeaker);
    } else {
      // No more speakers - advance phase
      return advanceToNextPhase(state);
    }
  }
  
  // Continue with same speaker
  return addTranscriptEntry(state, currentSpeaker);
}

/**
 * Add a transcript entry for the given speaker
 */
function addTranscriptEntry(state: CourtState, speakerRole: AgentRole): CourtState {
  const messages = MOCK_MESSAGES[state.currentPhase]?.[speakerRole];
  if (!messages) return state;
  
  const speakerName = getParticipantName(state, speakerRole);
  const phaseEntries = state.transcript.filter(
    t => t.phase === state.currentPhase && t.speakerRole === speakerRole
  );
  const messageIndex = phaseEntries.length;
  
  if (messageIndex >= messages.length) {
    // No more messages - try next speaker
    const nextSpeaker = getNextSpeaker(state.currentPhase, speakerRole);
    if (nextSpeaker) {
      return addTranscriptEntry(state, nextSpeaker);
    }
    return advanceToNextPhase(state);
  }
  
  const newEntry: TranscriptEntry = {
    id: `trans-${Date.now()}-${speakerRole}`,
    speakerRole,
    speakerName,
    message: messages[messageIndex],
    phase: state.currentPhase,
    sequenceNumber: state.transcript.length + 1,
    timestamp: new Date().toISOString(),
  };
  
  return {
    ...state,
    currentSpeaker: speakerRole,
    transcript: [...state.transcript, newEntry],
  };
}

/**
 * Advance to the next phase
 */
function advanceToNextPhase(state: CourtState): CourtState {
  const currentIndex = COURT_PHASES.indexOf(state.currentPhase);
  const nextPhase = COURT_PHASES[currentIndex + 1];
  
  if (!nextPhase) {
    // Trial is complete
    return {
      ...state,
      currentPhase: 'case_summary',
      currentSpeaker: 'judge',
    };
  }
  
  // Set first speaker for next phase
  const nextSpeakers = getSpeakersForPhase(nextPhase);
  const firstSpeaker = nextSpeakers.length > 0 ? nextSpeakers[0] : null;
  
  // Handle verdict phase specially
  if (nextPhase === 'verdict') {
    return {
      ...state,
      currentPhase: nextPhase,
      currentSpeaker: firstSpeaker,
      verdict: MOCK_VERDICT,
    };
  }
  
  return {
    ...state,
    currentPhase: nextPhase,
    currentSpeaker: firstSpeaker,
  };
}

/**
 * Manually advance phase (via UI control)
 */
export function skipToNextPhase(state: CourtState): CourtState {
  return advanceToNextPhase(state);
}

/**
 * Update evidence status
 */
export function updateEvidenceStatus(
  state: CourtState,
  evidenceId: string,
  status: Evidence['status']
): CourtState {
  return {
    ...state,
    evidence: state.evidence.map(e =>
      e.id === evidenceId ? { ...e, status } : e
    ),
  };
}

/**
 * Introduce evidence into the case
 */
export function introduceEvidence(state: CourtState, evidenceId: string): CourtState {
  return updateEvidenceStatus(state, evidenceId, 'introduced');
}

/**
 * Get current phase readiness
 */
export function canProceed(state: CourtState): boolean {
  const { currentPhase, currentSpeaker } = state;
  
  // Check if current phase has required speakers
  const speakers = getSpeakersForPhase(currentPhase);
  if (speakers.length === 0) return true;
  
  // If there's a current speaker, check if they've said everything
  if (currentSpeaker) {
    const messages = MOCK_MESSAGES[currentPhase]?.[currentSpeaker];
    if (messages) {
      const phaseEntries = state.transcript.filter(
        t => t.phase === currentPhase && t.speakerRole === currentSpeaker
      );
      if (phaseEntries.length < messages.length) return false;
    }
  }
  
  return true;
}

/**
 * Get transcript for current phase only
 */
export function getCurrentPhaseTranscript(state: CourtState): TranscriptEntry[] {
  return state.transcript.filter(t => t.phase === state.currentPhase);
}

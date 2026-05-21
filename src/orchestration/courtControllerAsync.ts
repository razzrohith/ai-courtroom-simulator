/**
 * Court Controller Async — Async state machine with provider runtime
 * Phase 4: Runtime integration
 */

import type { CourtState, AgentRole, TranscriptEntry, Evidence, AgentParticipant } from '../types/courtroom';
import { COURT_PHASES } from '../types/courtroom';
import { SAMPLE_CASE } from '../data/sampleCase';
import { createMockConfig } from '../providers/modelProviderTypes';
import { getSpeakersForPhase, getNextSpeaker } from './phaseEngine';
import { generateAgentResponse } from '../providers/agentService';

export function createInitialState(): CourtState {
  const participants: AgentParticipant[] = [
    { id: 'judge-001', role: 'judge', name: 'Honorable Sarah Mitchell', title: 'Presiding Judge', modelConfig: createMockConfig('judge') },
    { id: 'prosecutor-001', role: 'prosecutor', name: 'Attorney Rebecca Chen', title: 'Counsel for Plaintiff', modelConfig: createMockConfig('prosecutor') },
    { id: 'defense-001', role: 'defense', name: 'Attorney Marcus Williams', title: 'Counsel for Defendant', modelConfig: createMockConfig('defense') },
  ];
  return { currentPhase: 'case_setup', currentSpeaker: null, participants, transcript: [], evidence: [...SAMPLE_CASE.evidenceItems], verdict: null, case: SAMPLE_CASE, isActive: false };
}

export function startSimulation(state: CourtState): CourtState {
  return { ...state, isActive: true, currentPhase: 'court_opening', currentSpeaker: 'judge' };
}

export function resetSimulation(): CourtState {
  return createInitialState();
}

export function getParticipantName(state: CourtState, role: AgentRole): string {
  const participant = state.participants.find(p => p.role === role);
  return participant?.name || role.toUpperCase();
}

function getParticipantConfig(state: CourtState, role: AgentRole) {
  const participant = state.participants.find(p => p.role === role);
  return participant?.modelConfig || createMockConfig(role);
}

export async function processNextTurnAsync(state: CourtState): Promise<CourtState> {
  if (!state.isActive) return state;
  const phase = state.currentPhase;
  const currentSpeaker = state.currentSpeaker;
  if (!currentSpeaker) {
    const speakers = getSpeakersForPhase(phase);
    if (speakers.length === 0) return advanceToNextPhase(state);
    const nextSpeaker = speakers[0];
    return addTranscriptEntryAsync(state, nextSpeaker);
  }
  const speakerHasMore = checkSpeakerHasMore(state, currentSpeaker);
  if (!speakerHasMore) {
    const nextSpeaker = getNextSpeaker(phase, currentSpeaker);
    if (nextSpeaker) return addTranscriptEntryAsync(state, nextSpeaker);
    return advanceToNextPhase(state);
  }
  return addTranscriptEntryAsync(state, currentSpeaker);
}

function checkSpeakerHasMore(state: CourtState, speakerRole: AgentRole): boolean {
  const phaseEntries = state.transcript.filter(t => t.phase === state.currentPhase && t.speakerRole === speakerRole);
  return phaseEntries.length < 2;
}

async function addTranscriptEntryAsync(state: CourtState, speakerRole: AgentRole): Promise<CourtState> {
  const speakerName = getParticipantName(state, speakerRole);
  const config = getParticipantConfig(state, speakerRole);
  const result = await generateAgentResponse({ role: speakerRole, config, phase: state.currentPhase, transcript: state.transcript, evidence: state.evidence, caseTitle: state.case.title, caseSummary: state.case.claimSummary });
  const newEntry: TranscriptEntry = { id: `trans-$Date.now()}-$speakerRole}`, speakerRole, speakerName, message: result.message, phase: state.currentPhase, sequenceNumber: state.transcript.length + 1, timestamp: new Date().toISOString(), providerUsed: result.providerUsed, modelUsed: result.modelUsed, responseSource: result.responseSource };
  return { ...state, currentSpeaker: speakerRole, transcript: [...state.transcript, newEntry] };
}

function advanceToNextPhase(state: CourtState): CourtState {
  const currentIndex = COURT_PHASES.indexOf(state.currentPhase);
  const nextPhase = COURT_PHASES[currentIndex + 1];
  if (!nextPhase) return { ...state, currentPhase: 'case_summary', currentSpeaker: 'judge' };
  const nextSpeakers = getSpeakersForPhase(nextPhase);
  const firstSpeaker = nextSpeakers.length > 0 ? nextSpeakers[0] : null;
  if (nextPhase === 'verdict') return { ...state, currentPhase: nextPhase, currentSpeaker: firstSpeaker, verdict: { decision: 'defense_wins', reasoningSummary: 'Court finds for defendant.', plaintiffPoints: ['Contract signed'], defensePoints: ['Delays were reasonable'], weaknesses: { plaintiff: [], defense: [] }, ruling: 'Case dismissed' } };
  return { ...state, currentPhase: nextPhase, currentSpeaker: firstSpeaker };
}

export function skipToNextPhase(state: CourtState): CourtState {
  return advanceToNextPhase(state);
}

export function updateEvidenceStatus(state: CourtState, evidenceId: string, status: Evidence['status']): CourtState {
  return { ...state, evidence: state.evidence.map(e => e.id === evidenceId ? { ...e, status } : e) };
}

export function introduceEvidence(state: CourtState, evidenceId: string): CourtState {
  return updateEvidenceStatus(state, evidenceId, 'introduced');
}

export function canProceed(_state: CourtState): boolean {
  return true;
}

export function getCurrentPhaseTranscript(state: CourtState): TranscriptEntry[] {
  return state.transcript.filter(t => t.phase === state.currentPhase);
}

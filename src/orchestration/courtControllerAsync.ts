/**
 * Court Controller Async — Async state machine with provider runtime
 * Phase 9: Witness testimony and motion flow
 */

import type { CourtState, AgentRole, TranscriptEntry, Evidence, AgentParticipant, ObjectionEvent, Witness, WitnessQAndA, CourtPhase } from '../types/courtroom';
import { COURT_PHASES } from '../types/courtroom';
import { SAMPLE_CASE } from '../data/sampleCase';
import { createMockConfig } from '../providers/modelProviderTypes';
import { getSpeakersForPhase } from './phaseEngine';
import { generateAgentResponse, parseEvidenceReferences } from '../providers/agentService';
import { generateWitnessQAndA, calculateCredibilityScore } from '../providers/mockModelProvider';
import { JUDGE_TRANSITIONS, shouldTriggerObjection, MOCK_VERDICT } from '../data/mockCourtFlow';
import { loadCourtroomConfig, setAgentConnectionStatus } from '../types/providers';

// Sample witnesses for the case
const DEFAULT_WITNESSES: Witness[] = [
  {
    id: 'wit-001',
    name: 'Dr. Isha Sen',
    role: 'prosecution',
    title: 'Evolutionary Biologist',
    summary: 'Specializes in avian egg shell protein synthesis and ovarian biology.',
    credibility: 'credible',
  },
  {
    id: 'wit-002',
    name: 'Dr. Amit Patel',
    role: 'defense',
    title: 'Paleontologist',
    summary: 'Expert in pre-avian theropod dinosaur eggs and fossil transition records.',
    credibility: 'credible',
  },
];

export function createInitialState(): CourtState {
  const participants: AgentParticipant[] = [
    { id: 'judge-001', role: 'judge', name: 'Honorable Justice Arvind Menon', title: 'Presiding Judge', modelConfig: createMockConfig('judge') },
    { id: 'prosecutor-001', role: 'prosecutor', name: 'Advocate Rahul Verma', title: 'Counsel for Plaintiff', modelConfig: createMockConfig('prosecutor') },
    { id: 'defense-001', role: 'defense', name: 'Advocate Sneha Kapoor', title: 'Counsel for Defendant', modelConfig: createMockConfig('defense') },
  ];
  return {
    currentPhase: 'case_setup',
    objectionHistory: [],
    witnesses: [...DEFAULT_WITNESSES],
    motionHistory: [],
    currentSpeaker: null,
    participants,
    transcript: [],
    evidence: [...SAMPLE_CASE.evidenceItems],
    verdict: null,
    case: SAMPLE_CASE,
    isActive: false
  };
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

function getParticipantConfig(role: AgentRole) {
  const config = loadCourtroomConfig();
  return config[role];
}

export function getNextSpeakerRole(state: CourtState): AgentRole | null {
  if (!state.isActive) return null;
  const phase = state.currentPhase;
  const speakers = getSpeakersForPhase(phase);
  if (speakers.length === 0) return null;

  const substantiveEntries = state.transcript.filter(
    t => t.phase === phase &&
         !t.id.startsWith('trans-j-transition-') &&
         !t.id.startsWith('trans-summary-') &&
         !t.id.startsWith('trans-ruling-')
  );

  const currentTurnIndex = substantiveEntries.length;
  const speakerIndex = currentTurnIndex;

  if (speakerIndex >= speakers.length) {
    return null;
  }

  return speakers[speakerIndex];
}

export async function processNextTurnAsync(state: CourtState): Promise<CourtState> {
  if (!state.isActive) return state;
  const phase = state.currentPhase;
  const nextSpeaker = getNextSpeakerRole(state);

  if (!nextSpeaker) {
    return advanceToNextPhase(state);
  }

  if (phase === 'witness_testimony') {
    return processWitnessTestimony(await addTranscriptEntryAsync(state, nextSpeaker), nextSpeaker);
  }
  return addTranscriptEntryAsync(state, nextSpeaker);
}

/**
 * Process witness testimony phase - generate Q&A and update credibility
 * Phase 10: Dynamic witness questions
 */
function processWitnessTestimony(state: CourtState, speakerRole: AgentRole): CourtState {
  // Get current witness based on speaker role
  const witnessRole = speakerRole === 'prosecutor' ? 'prosecution' : speakerRole === 'defense' ? 'defense' : 'court';
  const witnessIdx = state.witnesses.findIndex(w => w.role === witnessRole);
  if (witnessIdx < 0) return state;
  
  const witness = state.witnesses[witnessIdx];
  const questionType = speakerRole === 'judge' ? 'clarification' : speakerRole === 'prosecutor' ? 'direct' : 'cross';
  
  const qa = generateWitnessQAndA({
    witnessId: witness.id,
    examinerRole: speakerRole,
    questionType,
  });
  
  // Build Q&A entry
  const qaId = `qa-${Date.now()}`;
  const qaEntry: WitnessQAndA = {
    id: qaId,
    witnessId: witness.id,
    examinerRole: speakerRole,
    question: qa.question,
    answer: qa.answer,
    phase: state.currentPhase,
    evidenceIds: qa.evidenceIds,
  };
  
  // Update witness with Q&A and calculate credibility
  const updatedWitnesses = [...state.witnesses];
  const qaHistory = [...(witness.qAndAHistory || []), qaEntry];
  
  // Calculate credibility after cross-examination
  let newScore: Witness['credibilityScore'] = witness.credibilityScore;
  let newCredibilityNotes = witness.credibilityNotes;
  
  if (questionType === 'cross') {
    const credResult = calculateCredibilityScore({
      consistencyWithEvidence: 70,
      contradictions: Math.floor(Math.random() * 2),
      corroborations: 1,
    });
    newScore = credResult.score;
    newCredibilityNotes = (newCredibilityNotes || '') + '\n' + credResult.notes;
    
    // Add evidence links if referenced - cross-examination may contradict
    if (qa.evidenceIds && qa.evidenceIds.length > 0) {
      const supports = questionType !== 'cross'; // cross will contradict
      const evidenceLinks = (witness.evidenceLinks || []).concat(
        qa.evidenceIds.map(eid => ({
          evidenceId: eid,
          supports,
          notes: '',
        }))
      );
      updatedWitnesses[witnessIdx] = {
        ...witness,
        qAndAHistory: qaHistory,
        credibilityScore: newScore,
        credibilityNotes: newCredibilityNotes,
        evidenceLinks,
      };
    } else {
      updatedWitnesses[witnessIdx] = {
        ...witness,
        qAndAHistory: qaHistory,
        credibilityScore: newScore,
        credibilityNotes: newCredibilityNotes,
      };
    }
  } else {
    updatedWitnesses[witnessIdx] = {
      ...witness,
      qAndAHistory: qaHistory,
    };
  }
  
  return { ...state, witnesses: updatedWitnesses };
}

async function addTranscriptEntryAsync(state: CourtState, speakerRole: AgentRole): Promise<CourtState> {
  const speakerName = getParticipantName(state, speakerRole);
  const config = getParticipantConfig(speakerRole);

  const result = await generateAgentResponse({ 
    role: speakerRole, 
    config, 
    phase: state.currentPhase, 
    transcript: state.transcript, 
    evidence: state.evidence, 
    caseTitle: state.case.title, 
    caseSummary: state.case.claimSummary,
    objectionHistory: state.objectionHistory,
    caseKeyFacts: state.case.keyFacts
  });

  // Update provider connection status based on whether it succeeded or fell back
  setAgentConnectionStatus(
    speakerRole,
    config.providerId,
    config.model,
    result.responseSource === 'real' ? 'connected' : 'fallback'
  );

  // Parse evidence references
  const evidenceRefs = parseEvidenceReferences(result.message);
  
  // Update evidence - status and timeline tracking
  let updatedEvidence = [...state.evidence];
  evidenceRefs.forEach(ref => {
    const idx = updatedEvidence.findIndex(e => e.id.toUpperCase() === ref.toUpperCase());
    if (idx >= 0) {
      const ev = updatedEvidence[idx];
      const newCount = (ev.referenceCount || 0) + 1;
      updatedEvidence[idx] = {
        ...ev,
        status: ev.status === 'pending' ? 'offered' : ev.status,
        referenceCount: newCount,
        firstReferencedPhase: ev.firstReferencedPhase || state.currentPhase,
        lastReferencedBy: speakerRole,
      };
    } else {
      // Create dynamic evidence placeholder
      let title = ref;
      let summary = `Evidence introduced by counsel regarding ${ref}.`;
      let type: Evidence['type'] = 'document';
      let confidentiality: Evidence['confidentiality'] = 'public';

      if (ref === 'EVOLUTIONARY_RECORD') {
        title = 'Evolutionary Record Analysis';
        summary = 'Scientific compilation of genomic divergence rates and ancestral bird fossils.';
        type = 'report';
      } else if (ref === 'EGG_FOSSIL_RECORD') {
        title = 'Pre-Avian Egg Fossils';
        summary = 'Fossilized egg shells pre-dating the evolutionary emergence of the modern hen.';
        type = 'physical';
      } else if (ref === 'LIVING_BIRD_REQUIREMENT') {
        title = 'Avian Protein Synthesizer Study';
        summary = 'Research paper demonstrating that shell formation requires the OC-17 protein found only in living hen ovaries.';
        type = 'report';
      } else if (ref === 'GENETIC_MUTATION_EVIDENCE') {
        title = 'Zygotic Mutation Data';
        summary = 'Genetic sequencing proof showing the transition mutation occurred during the zygote phase of the ancestor.';
        type = 'report';
      } else if (ref === 'EXHIBITP1') {
        title = 'Exhibit P-1: Embryology Lab Report';
        summary = "Plaintiff's report detailing egg shell protein formation process.";
        type = 'report';
      } else if (ref === 'EXHIBITD1') {
        title = 'Exhibit D-1: Evolutionary Timeline Chart';
        summary = "Defendant's visual representation of non-hen egg-laying ancestors.";
        type = 'document';
      } else if (ref.startsWith('EXHIBIT')) {
        const suffix = ref.substring(7);
        if (suffix.startsWith('P')) {
          title = `Exhibit P-${suffix.substring(1)}`;
        } else if (suffix.startsWith('D')) {
          title = `Exhibit D-${suffix.substring(1)}`;
        } else {
          title = `Exhibit ${suffix}`;
        }
        summary = `Dynamic exhibit ${title} introduced during the trial.`;
      } else {
        if (/^E\d+$/.test(ref)) {
          title = `Exhibit ${ref}`;
        } else {
          title = ref.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }

      const newEvidence: Evidence = {
        id: ref,
        title,
        type,
        confidentiality,
        summary,
        introducedBy: speakerRole,
        status: 'offered',
        content: `Details regarding ${title}. Introduced by ${speakerName} during the ${state.currentPhase} phase.`,
        referenceCount: 1,
        firstReferencedPhase: state.currentPhase,
        lastReferencedBy: speakerRole,
      };
      updatedEvidence.push(newEvidence);
    }
  });

  // Check for objection trigger (context-aware)
  const speakerTurn = state.transcript.filter(t => t.phase === state.currentPhase && t.speakerRole === speakerRole).length;
  const objectionType = shouldTriggerObjection(state.currentPhase, speakerTurn, state.objectionHistory, evidenceRefs);
  let updatedObjections = state.objectionHistory;
  
  if (objectionType) {
    // Add objection record
    const raisedBy = speakerRole === 'prosecutor' ? 'defense' : 'prosecutor';
    const objection: ObjectionEvent = {
      id: `obj-${Date.now()}`,
      raisedBy,
      type: objectionType,
      targetEvidence: evidenceRefs[0],
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    updatedObjections = [...state.objectionHistory, objection];
  }

  const newEntry: TranscriptEntry = { 
    id: `trans-${Date.now()}-${speakerRole}`, 
    speakerRole, 
    speakerName, 
    message: result.message, 
    phase: state.currentPhase, 
    sequenceNumber: state.transcript.length + 1, 
    timestamp: new Date().toISOString(),
    evidenceRef: evidenceRefs.length > 0 ? evidenceRefs.join(',') : undefined,
    providerUsed: result.providerUsed, 
    modelUsed: result.modelUsed, 
    responseSource: result.responseSource,
    isComplete: true 
  };

  // Dynamically accumulate key facts from agent messages during relevant phases
  const factPhases: CourtPhase[] = [
    'plaintiff_opening',
    'defense_opening',
    'evidence_presentation',
    'cross_examination',
    'witness_testimony',
    'rebuttal',
    'closing_arguments',
    'judge_deliberation'
  ];

  let updatedCase = state.case;
  if (factPhases.includes(state.currentPhase)) {
    const cleanMessage = result.message
      .replace(/^#+\s+/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\s+/g, ' ');

    const sentences = cleanMessage
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 150 && !s.toLowerCase().includes('your honor') && !s.toLowerCase().includes('objection') && !s.toLowerCase().includes('prosecution') && !s.toLowerCase().includes('defense'));
    
    if (sentences.length > 0) {
      const existingFacts = state.case.keyFacts || [];
      const newFacts = [...existingFacts];
      
      sentences.forEach(sentence => {
        const cleaned = sentence + '.';
        if (!newFacts.some(f => f.toLowerCase() === cleaned.toLowerCase())) {
          newFacts.push(cleaned);
        }
      });
      
      updatedCase = {
        ...state.case,
        keyFacts: newFacts
      };
    }
  }

  return { 
    ...state, 
    currentSpeaker: speakerRole, 
    transcript: [...state.transcript, newEntry],
    evidence: updatedEvidence,
    objectionHistory: updatedObjections,
    case: updatedCase
  };
}

function advanceToNextPhase(state: CourtState): CourtState {
  const currentIndex = COURT_PHASES.indexOf(state.currentPhase);
  const nextPhase = COURT_PHASES[currentIndex + 1];
  
  // Get judge transition message for entering new phase
  const transitionMsg = JUDGE_TRANSITIONS[nextPhase] || '';
  
  // Build new transcript with judge transition announcement
  const transitionEntry: TranscriptEntry = {
    id: `trans-j-transition-${Date.now()}`,
    speakerRole: 'judge',
    speakerName: getParticipantName(state, 'judge'),
    message: transitionMsg || `We will now proceed to the ${nextPhase.replace('_', ' ')} phase.`,
    phase: nextPhase,
    sequenceNumber: state.transcript.length + 1,
    timestamp: new Date().toISOString(),
    providerUsed: 'mock',
    modelUsed: 'judge-reasoner-v1',
    responseSource: 'mock',
    isComplete: true,
  };
  
  if (!nextPhase) {
    // End of trial - case summary phase
    const summaryEntry: TranscriptEntry = {
      ...transitionEntry,
      id: `trans-summary-${Date.now()}`,
      phase: 'case_summary',
      message: `This concludes the proceedings in Case 2024-CV-3847. The Court thanks all counsel for their professional conduct. Case dismissed.`,
    };
    return { ...state, currentPhase: 'case_summary', currentSpeaker: 'judge', transcript: [...state.transcript, transitionEntry, summaryEntry] };
  }
  
  const nextSpeakers = getSpeakersForPhase(nextPhase);
  const firstSpeaker = nextSpeakers.length > 0 ? nextSpeakers[0] : null;
  
  if (nextPhase === 'verdict') {
    // Use the improved MOCK_VERDICT
    const verdictEntry: TranscriptEntry = {
      ...transitionEntry,
      message: MOCK_VERDICT.ruling || `The Court finds in favour of ${MOCK_VERDICT.decision === 'plaintiff_wins' ? 'the plaintiff' : 'the defendant'}.`,
    };
    return { 
      ...state, 
      currentPhase: nextPhase, 
      currentSpeaker: firstSpeaker,
      transcript: [...state.transcript, transitionEntry, verdictEntry],
      verdict: MOCK_VERDICT
    };
  }
  
  // Normal phase transition with judge announcement
  return { 
    ...state, 
    currentPhase: nextPhase, 
    currentSpeaker: firstSpeaker,
    transcript: [...state.transcript, transitionEntry]
  };
}

export function skipToNextPhase(state: CourtState): CourtState {
  return advanceToNextPhase(state);
}

export function updateEvidenceStatus(state: CourtState, evidenceId: string, status: Evidence['status']): CourtState {
  return { ...state, evidence: state.evidence.map(e => e.id === evidenceId ? { ...e, status } : e) };
}

export function introduceEvidence(state: CourtState, evidenceId: string): CourtState {
  return updateEvidenceStatus(state, evidenceId, 'offered');
}
// Objection management
export function recordObjection(
  state: CourtState,
  raisedBy: AgentRole,
  objectionType: string,
  targetEvidence?: string
): CourtState {
  const objection: ObjectionEvent = {
    id: `obj-${Date.now()}`,
    raisedBy,
    type: objectionType,
    targetEvidence,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };
  return {
    ...state,
    objectionHistory: [...state.objectionHistory, objection],
  };
}

export function ruleOnObjection(
  state: CourtState,
  objectionId: string,
  sustained: boolean,
  targetEvidence?: string
): CourtState {
  const objStatus = sustained ? 'sustained' : 'overruled';
  const rulingMessage = sustained 
    ? `The objection is SUSTAINED. The evidence in question is hereby excluded/motion granted.` 
    : `The objection is OVERRULED. The evidence stands/motion denied.`;
  
  // Create judge ruling transcript entry
  const rulingEntry: TranscriptEntry = {
    id: `trans-ruling-${Date.now()}`,
    speakerRole: 'judge',
    speakerName: getParticipantName(state, 'judge'),
    message: rulingMessage,
    phase: state.currentPhase,
    sequenceNumber: state.transcript.length + 1,
    timestamp: new Date().toISOString(),
    providerUsed: 'mock',
    modelUsed: 'judge-reasoner-v1',
    responseSource: 'mock',
    isComplete: true,
  };
  
  // Update evidence status if target evidence exists
  let updatedEvidence = [...state.evidence];
  if (targetEvidence) {
    const evidenceRef = targetEvidence.toUpperCase().replace(/[-\s]/g, '');
    const idx = state.evidence.findIndex(e => e.id.toUpperCase() === evidenceRef);
    if (idx >= 0) {
      const newStatus: Evidence['status'] = sustained ? 'disputed' : 'admitted';
      updatedEvidence[idx] = { ...updatedEvidence[idx], status: newStatus };
    }
  }
  
  return {
    ...state,
    currentSpeaker: 'judge',
    transcript: [...state.transcript, rulingEntry],
    objectionHistory: state.objectionHistory.map(obj =>
      obj.id === objectionId ? { ...obj, status: objStatus } : obj
    ),
    evidence: updatedEvidence,
  };
}

// Session persistence helpers
export function getSerializableState(state: CourtState) {
  return {
    currentPhase: state.currentPhase,
    currentSpeaker: state.currentSpeaker,
    transcript: state.transcript,
    evidence: state.evidence,
    verdict: state.verdict,
    isActive: state.isActive,
    case: state.case,
    objectionHistory: state.objectionHistory,
  };
}

export function canProceed(_state: CourtState): boolean {
  return true;
}

export function getCurrentPhaseTranscript(state: CourtState): TranscriptEntry[] {
  return state.transcript.filter(t => t.phase === state.currentPhase);
}

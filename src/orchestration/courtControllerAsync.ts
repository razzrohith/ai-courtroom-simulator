/**
 * Court Controller Async — Async state machine with provider runtime
 * Phase 9: Witness testimony and motion flow
 */

import type { CourtState, AgentRole, TranscriptEntry, Evidence, AgentParticipant, ObjectionEvent, ObjectionType, Witness, WitnessQAndA, CourtPhase, Verdict } from '../types/courtroom';
import { COURT_PHASES } from '../types/courtroom';
import { SAMPLE_CASE } from '../data/sampleCase';
import { createMockConfig } from '../providers/modelProviderTypes';
import { getSpeakersForPhase } from './phaseEngine';
import { generateAgentResponse, parseEvidenceReferences } from '../providers/agentService';
import { generateWitnessQAndA, calculateCredibilityScore } from '../providers/mockModelProvider';
import { JUDGE_TRANSITIONS, shouldTriggerObjection } from '../data/mockCourtFlow';
import { loadCourtroomConfig, setAgentConnectionStatus } from '../types/providers';
import { scoreArgumentHeuristic, aggregateSideScore } from '../legal/argumentScoring';
import { buildAgentStrategies } from '../legal/strategyMemory';
import { buildWitnessPersona } from '../legal/witnessPersona';
import type { CaseData } from '../types/courtroom';
export const preventDuplicateFinalSummary = true;

export const EMPTY_CASE: CaseData = {
  id: '',
  title: '',
  caseType: '',
  plaintiffSide: '',
  defenseSide: '',
  claimSummary: '',
  keyFacts: [],
  evidenceItems: [],
  legalQuestions: [],
  caseSource: 'custom',
  schemaVersion: 2,
};

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
    witnesses: [],
    motionHistory: [],
    currentSpeaker: null,
    participants,
    transcript: [],
    evidence: [],
    verdict: null,
    case: EMPTY_CASE,
    isActive: false
  };
}

export function startSimulation(state: CourtState): CourtState {
  const updatedCase = { ...state.case };
  let updatedEvidence = [...state.evidence];
  let updatedWitnesses = [...state.witnesses];

  const isPreset = state.case.caseSource === 'preset';

  if (isPreset) {
    if (updatedWitnesses.length === 0) {
      updatedWitnesses = [...DEFAULT_WITNESSES];
    }
    if (updatedEvidence.length === 0) {
      updatedEvidence = [...SAMPLE_CASE.evidenceItems];
      updatedCase.evidenceItems = [...SAMPLE_CASE.evidenceItems];
    }
    if (!updatedCase.keyFacts || updatedCase.keyFacts.length === 0) {
      updatedCase.keyFacts = [
        "Amniotic egg-laying organisms existed hundreds of millions of years before the modern hen.",
        "Egg shell synthesis requires the OC-17 protein found only in living hen ovaries.",
        "The genetic mutation defining the new species occurs at the fertilization/zygote stage."
      ];
    }
    if (!updatedCase.legalQuestions || updatedCase.legalQuestions.length === 0) {
      updatedCase.legalQuestions = [...SAMPLE_CASE.legalQuestions];
    }
  } else {
    // Custom case dynamic generation
    // 1. Generate key facts if empty
    if (!updatedCase.keyFacts || updatedCase.keyFacts.length === 0) {
      updatedCase.keyFacts = [
        `The dispute centers on ${state.case.title}.`,
        `Plaintiff ${state.case.plaintiffSide} claims priority and superiority on the basis of: ${state.case.claimSummary}.`,
        `Defense ${state.case.defenseSide} argues that its capabilities make it the superior selection.`
      ];
    }

    // 2. Generate evidence items if empty
    if (updatedEvidence.length === 0) {
      const p1: Evidence = {
        id: 'EXHIBITP1',
        title: `Exhibit P-1: ${state.case.plaintiffSide} Performance Metrics`,
        type: 'report',
        confidentiality: 'public',
        summary: `Analytical document demonstrating the efficiency, reasoning speed, and user preference of ${state.case.plaintiffSide}.`,
        content: `Detailed performance metrics of ${state.case.plaintiffSide}.`,
        introducedBy: 'prosecutor',
        status: 'pending',
      };
      const d1: Evidence = {
        id: 'EXHIBITD1',
        title: `Exhibit D-1: ${state.case.defenseSide} Capability Study`,
        type: 'report',
        confidentiality: 'public',
        summary: `Research findings showing the long-form writing, context size, and output quality of ${state.case.defenseSide}.`,
        content: `Detailed capability analysis of ${state.case.defenseSide}.`,
        introducedBy: 'defense',
        status: 'pending',
      };
      updatedEvidence = [p1, d1];
      updatedCase.evidenceItems = [p1, d1];
    }

    // 3. Generate witnesses dynamically if empty
    if (updatedWitnesses.length === 0) {
      const pClean = (state.case.plaintiffSide || 'Plaintiff').replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0] || 'Plaintiff';
      const dClean = (state.case.defenseSide || 'Defendant').replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0] || 'Defendant';
      updatedWitnesses = [
        {
          id: 'wit-001',
          name: `Dr. Sarah ${pClean}`,
          role: 'prosecution',
          title: `Lead Expert for ${state.case.plaintiffSide}`,
          summary: `Technical expert specializing in benchmarking, evaluation, and system dynamics of ${state.case.plaintiffSide}.`,
          credibility: 'credible',
        },
        {
          id: 'wit-002',
          name: `Dr. David ${dClean}`,
          role: 'defense',
          title: `Lead Expert for ${state.case.defenseSide}`,
          summary: `Expert researcher analyzing architecture, context, and capabilities of ${state.case.defenseSide}.`,
          credibility: 'credible',
        },
      ];
    }

    // 4. Generate legal questions if empty
    if (!updatedCase.legalQuestions || updatedCase.legalQuestions.length === 0) {
      updatedCase.legalQuestions = [
        `Whether ${state.case.plaintiffSide} provides superior performance for the claims asserted in: ${state.case.claimSummary}.`,
        `Whether ${state.case.defenseSide} offers advantages that override the plaintiff's assertions.`
      ];
    }
  }

  // Phase 26: every witness enters with a persona sheet (bias + weakness)
  updatedWitnesses = updatedWitnesses.map(w =>
    w.persona ? w : { ...w, persona: buildWitnessPersona(w.role === 'defense' ? 'defense' : 'prosecution', updatedCase) }
  );

  return {
    ...state,
    isActive: true,
    currentPhase: 'court_opening',
    currentSpeaker: 'judge',
    case: updatedCase,
    evidence: updatedEvidence,
    witnesses: updatedWitnesses,
    // Phase 26: each counsel enters trial with a private strategy
    agentStrategies: buildAgentStrategies(updatedCase, updatedEvidence),
  };
}

export function resetSimulation(): CourtState {
  return createInitialState();
}

export function restartSimulationWithCase(state: CourtState): CourtState {
  const resetState: CourtState = {
    ...createInitialState(),
    case: state.case,
    participants: state.participants
  };
  return startSimulation(resetState);
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

export async function processNextTurnAsync(state: CourtState, userMessage?: string): Promise<CourtState> {
  if (!state.isActive) return state;
  const phase = state.currentPhase;
  const nextSpeaker = getNextSpeakerRole(state);

  if (!nextSpeaker) {
    return advanceToNextPhase(state);
  }

  if (phase === 'witness_testimony') {
    return processWitnessTestimony(await addTranscriptEntryAsync(state, nextSpeaker, userMessage), nextSpeaker, userMessage);
  }
  return addTranscriptEntryAsync(state, nextSpeaker, userMessage);
}

/**
 * Process witness testimony phase - generate Q&A and update credibility
 * Phase 10: Dynamic witness questions
 */
function processWitnessTestimony(state: CourtState, speakerRole: AgentRole, userQuestion?: string): CourtState {
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
    caseData: state.case,
    customQuestion: userQuestion,
    persona: witness.persona,
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
    // Phase 26: a cross-exam question that hits the persona's secret weakness
    // deterministically cracks credibility; otherwise use the standard model.
    const credResult = qa.weaknessHit
      ? calculateCredibilityScore({
          consistencyWithEvidence: 35,
          contradictions: 2,
          corroborations: 0,
        })
      : calculateCredibilityScore({
          consistencyWithEvidence: 70,
          contradictions: Math.floor(Math.random() * 2),
          corroborations: 1,
        });
    newScore = credResult.score;
    newCredibilityNotes = (newCredibilityNotes || '')
      + '\n' + credResult.notes
      + (qa.weaknessHit ? `\nCRACKED UNDER CROSS: conceded — ${witness.persona?.secretWeakness || 'a material limitation in the testimony'}` : '');
    
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

function getObjectionText(type: ObjectionType): string {
  const texts: Record<ObjectionType, string> = {
    relevance: "Objection, Your Honor! Relevance. This line of questioning has no bearing on the claims of this case.",
    lack_of_foundation: "Objection, Your Honor! Lack of foundation. There is no established basis for this evidence.",
    hearsay: "Objection, Your Honor! Hearsay. The witness is repeating statements made by out-of-court declarants.",
    argumentative: "Objection, Your Honor! Argumentative. Opposing counsel is badgering the witness or arguing prematurely.",
    speculation: "Objection, Your Honor! Speculation. This asks the witness to guess or assume facts not in evidence.",
    leading_question: "Objection, Your Honor! Leading question. Counsel is putting words in the witness's mouth.",
    misleading_evidence: "Objection, Your Honor! Misleading evidence. This mischaracterizes the actual record.",
    improper_conclusion: "Objection, Your Honor! Improper conclusion. Counsel is asking for a legal determination rather than factual testimony.",
    assumes_facts_not_shown: "Objection, Your Honor! Assumes facts not shown. The question presumes facts that have not been established in evidence.",
    compound_question: "Objection, Your Honor! Compound question. Counsel is combining multiple queries into a single question.",
  };
  return texts[type] || "Objection, Your Honor!";
}

export function determineObjectionRuling(type: ObjectionType, phase: CourtPhase): boolean {
  if (['relevance', 'lack_of_foundation', 'misleading_evidence'].includes(type)) {
    if (phase.includes('opening')) return true;
    return Math.random() < 0.6; // 60% sustained
  }
  if (['argumentative', 'speculation', 'improper_conclusion'].includes(type)) {
    if (phase === 'closing_arguments' || phase.includes('opening')) return false;
    return Math.random() < 0.4; // 40% sustained
  }
  return Math.random() < 0.5;
}

async function addTranscriptEntryAsync(state: CourtState, speakerRole: AgentRole, userMessage?: string): Promise<CourtState> {
  const speakerName = getParticipantName(state, speakerRole);
  const config = getParticipantConfig(speakerRole);

  // Play-a-role mode: a human is speaking for this side — use their words
  // verbatim instead of generating an AI response.
  const result = userMessage !== undefined
    ? {
        message: userMessage.trim(),
        providerUsed: 'human',
        modelUsed: 'you',
        responseSource: 'real' as const,
        promptTokens: undefined,
        completionTokens: undefined,
        totalTokens: undefined,
        latencyMs: undefined,
        estimatedCost: undefined,
      }
    : await generateAgentResponse({
        role: speakerRole,
        config,
        phase: state.currentPhase,
        transcript: state.transcript,
        evidence: state.evidence,
        caseTitle: state.case.title,
        caseSummary: state.case.claimSummary,
        objectionHistory: state.objectionHistory,
        caseKeyFacts: state.case.keyFacts,
        caseData: state.case,
        strategy: speakerRole !== 'judge' ? state.agentStrategies?.[speakerRole] : undefined,
      });

  // Update provider connection status based on whether it succeeded or fell back
  if (userMessage === undefined) {
    setAgentConnectionStatus(
      speakerRole,
      config.providerId,
      config.model,
      result.responseSource === 'real' ? 'connected' : 'fallback'
    );
  }

  // Parse evidence references
  const evidenceRefs = parseEvidenceReferences(result.message);

  // Phase 26: score counsel arguments — the rubric feeds the verdict
  let argumentScore: TranscriptEntry['argumentScore'];
  if (speakerRole !== 'judge' && result.message.trim().length > 0) {
    const opponentRole = speakerRole === 'prosecutor' ? 'defense' : 'prosecutor';
    const opponentLast = [...state.transcript].reverse().find(
      t => t.speakerRole === opponentRole && t.isComplete && t.message
    );
    argumentScore = scoreArgumentHeuristic({
      message: result.message,
      role: speakerRole,
      evidence: state.evidence,
      caseData: state.case,
      opponentLastMessage: opponentLast?.message,
    });
  }
  
  // Update evidence - status and timeline tracking
  const updatedEvidence = [...state.evidence];
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
      // Unknown evidence reference – ignore
    }
  });

  // Check for objection trigger (context-aware)
  const speakerTurn = state.transcript.filter(t => t.phase === state.currentPhase && t.speakerRole === speakerRole).length;
  const objectionType = shouldTriggerObjection(state.currentPhase, speakerTurn, state.objectionHistory, evidenceRefs);
  
  const updatedObjections = [...state.objectionHistory];
  const finalTranscript = [...state.transcript];

  const newEntry: TranscriptEntry = { 
    id: `trans-${Date.now()}-${speakerRole}`, 
    speakerRole, 
    speakerName, 
    message: result.message, 
    phase: state.currentPhase, 
    sequenceNumber: finalTranscript.length + 1, 
    timestamp: new Date().toISOString(),
    evidenceRef: evidenceRefs.length > 0 ? evidenceRefs.join(',') : undefined,
    providerUsed: result.providerUsed,
    modelUsed: result.modelUsed,
    responseSource: result.responseSource,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
    latencyMs: result.latencyMs,
    estimatedCost: result.estimatedCost,
    argumentScore,
    isComplete: true
  };
  finalTranscript.push(newEntry);

  if (objectionType) {
    const raisedBy = speakerRole === 'prosecutor' ? 'defense' : 'prosecutor';

    // Alternate between interactive and auto-resolved objections:
    // even-numbered objections stay PENDING so the court (the user, or the
    // AI judge on autoplay) must rule before the trial continues.
    const isPending = state.objectionHistory.length % 2 === 0;

    // Create opposing counsel objection statement
    const objectionEntry: TranscriptEntry = {
      id: `trans-objection-${Date.now()}`,
      speakerRole: raisedBy,
      speakerName: getParticipantName(state, raisedBy),
      message: getObjectionText(objectionType),
      phase: state.currentPhase,
      sequenceNumber: finalTranscript.length + 1,
      timestamp: new Date().toISOString(),
      providerUsed: 'mock',
      modelUsed: 'objection-engine-v1',
      responseSource: 'mock',
      isComplete: true,
    };
    finalTranscript.push(objectionEntry);

    if (isPending) {
      // Interactive objection: trial pauses until ruleOnObjection is called
      updatedObjections.push({
        id: `obj-${Date.now()}`,
        raisedBy,
        type: objectionType,
        targetEvidence: evidenceRefs[0],
        status: 'pending',
        timestamp: new Date().toISOString(),
      });
    } else {
      const sustained = determineObjectionRuling(objectionType, state.currentPhase);
      const objectionReason = sustained
        ? 'Objection deemed relevant and impacts evidence admissibility.'
        : 'Objection not pertinent; evidence remains admissible.';
      const objectionImpact = sustained ? 'Evidence excluded or limited.' : 'Evidence admitted.';

      updatedObjections.push({
        id: `obj-${Date.now()}`,
        raisedBy,
        type: objectionType,
        targetEvidence: evidenceRefs[0],
        status: sustained ? 'sustained' : 'overruled',
        reason: objectionReason,
        impact: objectionImpact,
        timestamp: new Date().toISOString(),
      });

      // Create judge ruling transcript entry
      const rulingMessage = sustained
        ? `The objection is SUSTAINED. ${objectionReason} ${objectionImpact}`
        : `The objection is OVERRULED. ${objectionReason} ${objectionImpact}`;

      const rulingEntry: TranscriptEntry = {
        id: `trans-ruling-${Date.now()}`,
        speakerRole: 'judge',
        speakerName: getParticipantName(state, 'judge'),
        message: rulingMessage,
        phase: state.currentPhase,
        sequenceNumber: finalTranscript.length + 1,
        timestamp: new Date().toISOString(),
        providerUsed: 'mock',
        modelUsed: 'judge-reasoner-v1',
        responseSource: 'mock',
        isComplete: true,
      };
      finalTranscript.push(rulingEntry);

      // Update target evidence status based on ruling
      if (evidenceRefs.length > 0) {
        const targetEvidence = evidenceRefs[0];
        const evidenceRef = targetEvidence.toUpperCase().replace(/[-\s]/g, '');
        const idx = updatedEvidence.findIndex(e => e.id.toUpperCase() === evidenceRef);
        if (idx >= 0) {
          updatedEvidence[idx] = {
            ...updatedEvidence[idx],
            status: sustained ? 'disputed' : 'admitted'
          };
        }
      }
    }
  }

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
    transcript: finalTranscript,
    evidence: updatedEvidence,
    objectionHistory: updatedObjections,
    case: updatedCase
  };
}

/**
 * Simulated jury panel: five jurors whose votes are derived deterministically
 * from the trial record (evidence counts + objection outcomes), with one or
 * two dissenters for realism.
 */
function generateJuryVotes(state: CourtState, decision: Verdict['decision']): Verdict['jurors'] {
  const pSide = state.case.plaintiffSide || 'the Plaintiff';
  const dSide = state.case.defenseSide || 'the Defendant';
  const majority: 'plaintiff' | 'defense' = decision === 'defense_wins' ? 'defense' : 'plaintiff';
  const minority: 'plaintiff' | 'defense' = majority === 'plaintiff' ? 'defense' : 'plaintiff';

  const personas = [
    { name: 'Juror #1 — A. Sharma', persona: 'Retired schoolteacher' },
    { name: 'Juror #2 — R. Iyer', persona: 'Software engineer' },
    { name: 'Juror #3 — M. Fernandes', persona: 'Small business owner' },
    { name: 'Juror #4 — K. Patel', persona: 'Nurse' },
    { name: 'Juror #5 — S. Reddy', persona: 'Accountant' },
  ];

  // Deterministic dissent count (1 or 2) from case title
  const seed = (state.case.title || 'case').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const dissenters = 1 + (seed % 2);

  const majorityReasons = [
    `The exhibits admitted for ${majority === 'plaintiff' ? pSide : dSide} were more concrete and directly supported their claim.`,
    `Their counsel answered the opposing arguments point by point without dodging.`,
    `The burden of proof was met — the story held together across every phase of the trial.`,
  ];
  const minorityReasons = [
    `The opposing side raised doubts that were never fully resolved for me.`,
    `I felt the excluded and disputed material weakened the majority's reading of the record.`,
  ];

  return personas.map((p, i) => {
    const isDissent = i >= personas.length - dissenters;
    const vote = isDissent ? minority : majority;
    return {
      id: `juror-${i + 1}`,
      name: p.name,
      persona: p.persona,
      vote,
      reasoning: isDissent
        ? minorityReasons[i % minorityReasons.length]
        : majorityReasons[i % majorityReasons.length],
    };
  });
}

/**
 * Verdict 2.0 (Phase 26): judgment is derived from the trial that actually
 * happened. Argument quality is the dominant factor; evidence admission and
 * objection outcomes weigh in; ties go to the defense because the plaintiff
 * bears the burden of proof. Applies to preset and custom cases alike.
 */
export function generateDynamicVerdict(state: CourtState): Verdict {
  const pSide = state.case.plaintiffSide || 'the Plaintiff';
  const dSide = state.case.defenseSide || 'the Defendant';

  // --- Evidence record ---
  const evidencePoints = (side: 'prosecutor' | 'defense') =>
    state.evidence
      .filter(e => e.introducedBy === side)
      .reduce((pts, e) => {
        if (e.status === 'admitted') return pts + 15;
        if (e.status === 'offered') return pts + 6;
        if (e.status === 'disputed') return pts - 4;
        if (e.status === 'excluded') return pts - 8;
        return pts;
      }, 0);

  // --- Objection game ---
  const objectionPoints = (side: 'prosecutor' | 'defense') =>
    state.objectionHistory.filter(o => o.raisedBy === side && o.status === 'sustained').length * 8;

  // --- Argument quality (the dominant factor) ---
  const pArgs = aggregateSideScore(state.transcript, 'prosecutor');
  const dArgs = aggregateSideScore(state.transcript, 'defense');

  const plaintiffTotal = pArgs.totalPoints + evidencePoints('prosecutor') + objectionPoints('prosecutor');
  const defenseTotal = dArgs.totalPoints + evidencePoints('defense') + objectionPoints('defense');

  // Burden of proof: the plaintiff must EXCEED the defense — ties acquit.
  const isPlaintiffWinner = plaintiffTotal > defenseTotal;

  const winner = isPlaintiffWinner ? pSide : dSide;
  const loser = isPlaintiffWinner ? dSide : pSide;
  const decision = isPlaintiffWinner ? 'plaintiff_wins' as const : 'defense_wins' as const;
  const winnerArgs = isPlaintiffWinner ? pArgs : dArgs;
  const loserArgs = isPlaintiffWinner ? dArgs : pArgs;

  const admittedItems = state.evidence.filter(e => e.status === 'admitted' || e.status === 'offered');

  // Best argument per side — quoted in the judgment
  const bestArgument = (side: 'prosecutor' | 'defense') =>
    state.transcript
      .filter(t => t.speakerRole === side && t.argumentScore)
      .sort((a, b) => (b.argumentScore!.total) - (a.argumentScore!.total))[0];
  const winnerBest = bestArgument(isPlaintiffWinner ? 'prosecutor' : 'defense');
  const loserBest = bestArgument(isPlaintiffWinner ? 'defense' : 'prosecutor');

  const keyReasons = [
    `Argument quality favored ${winner}: ${winnerArgs.turns} scored arguments averaging ${winnerArgs.avgTotal}/40 against ${loserArgs.avgTotal}/40 for ${loser}.`,
    winnerBest
      ? `The court found this argument decisive: "${winnerBest.message.slice(0, 160)}${winnerBest.message.length > 160 ? '…' : ''}"`
      : `${winner} maintained the more consistent line of argument across the proceedings.`,
    `The evidentiary record weighed ${evidencePoints(isPlaintiffWinner ? 'prosecutor' : 'defense')} points for ${winner} against ${evidencePoints(isPlaintiffWinner ? 'defense' : 'prosecutor')} for ${loser}, across ${admittedItems.length} live exhibits.`,
    ...(plaintiffTotal === defenseTotal ? [`With the record in equipoise, the burden of proof resolves the matter for the defense.`] : []),
  ];

  const sustainedByWinner = state.objectionHistory.filter(o => o.raisedBy === (isPlaintiffWinner ? 'prosecutor' : 'defense') && o.status === 'sustained').length;

  return {
    decision,
    reasoningSummary: plaintiffTotal === defenseTotal
      ? `The Court enters judgment for ${winner}. The record closed in exact balance (${defenseTotal} points each side); where the scales do not tip, the party bearing the burden of proof cannot prevail, and the claim is not established.`
      : `The Court enters judgment for ${winner}. Judgment rests on the record as argued: ${winner}'s counsel out-argued the opposition (${winnerArgs.avgTotal}/40 vs ${loserArgs.avgTotal}/40 average argument score), supported by the stronger evidentiary posture${sustainedByWinner > 0 ? ` and ${sustainedByWinner} sustained objection${sustainedByWinner === 1 ? '' : 's'}` : ''}. ${loser}'s presentation, while heard in full, did not carry ${isPlaintiffWinner ? 'sufficient weight to defeat the claim' : "the plaintiff's burden of proof"}.`,
    plaintiffPoints: [
      `${pArgs.turns} scored arguments for ${pSide}, averaging ${pArgs.avgTotal}/40.`,
      bestArgument('prosecutor')
        ? `Strongest moment: "${bestArgument('prosecutor')!.message.slice(0, 120)}…"`
        : `Relied primarily on the exhibit record.`,
    ],
    defensePoints: [
      `${dArgs.turns} scored arguments for ${dSide}, averaging ${dArgs.avgTotal}/40.`,
      bestArgument('defense')
        ? `Strongest moment: "${bestArgument('defense')!.message.slice(0, 120)}…"`
        : `Relied primarily on challenging admissibility.`,
    ],
    weaknesses: {
      plaintiff: isPlaintiffWinner ? [] : [
        loserBest && !isPlaintiffWinner ? `Peak argument scored only ${pArgs.avgTotal}/40 on average — below the defense's sustained quality.` : `Could not carry the burden of proof on the argued record.`,
      ],
      defense: isPlaintiffWinner ? [
        `Average argument quality of ${dArgs.avgTotal}/40 fell short of the plaintiff's ${pArgs.avgTotal}/40.`,
      ] : [],
    },
    ruling: `Judgment is hereby entered for the ${isPlaintiffWinner ? 'Plaintiff' : 'Defendant'}. On the strength of the arguments and exhibits actually presented, ${winner} is declared the prevailing party.`,
    witnessImpact: state.witnesses.length > 0
      ? `Expert testimony from ${state.witnesses.map(w => w.name).join(' and ')} was weighed; credibility findings stand as recorded during examination.`
      : 'No witness testimony was taken in these proceedings.',
    juryInstructionSummary: 'Burden of proof: preponderance of evidence. The jury was instructed to weigh arguments as made in court, not assertions outside the record.',
    motionImpact: state.motionHistory.length > 0
      ? state.motionHistory.map(m => `${m.motionType.replace(/_/g, ' ')} (${m.raisedBy}): ${m.status.toUpperCase()}`).join('; ') + '.'
      : 'No formal motions were filed during these proceedings.',
    deliberationSummary: `The court deliberated on ${state.case.title}, scoring ${pArgs.turns + dArgs.turns} counsel arguments and weighing ${state.evidence.length} exhibits. Final tally: ${pSide} ${plaintiffTotal} — ${dSide} ${defenseTotal}.`,
    appealGrounds: [
      `Whether the rubric weighting of argument quality against the documentary record was applied correctly.`,
      ...(state.objectionHistory.length > 0 ? [`Whether the court's objection rulings prejudiced the ${loser} presentation.`] : []),
      ...(plaintiffTotal === defenseTotal ? [`Whether resolving an evenly balanced record on burden of proof was proper.`] : []),
    ],
    winnerName: winner,
    whyWinnerWon: plaintiffTotal === defenseTotal
      ? `${winner} prevails on the burden of proof: with the record in exact balance (${defenseTotal} points each), the plaintiff failed to tip the scales, and an unproven claim fails.`
      : `${winner} won on the record as argued: ${winnerArgs.avgTotal > loserArgs.avgTotal ? `higher average argument quality (${winnerArgs.avgTotal}/40 vs ${loserArgs.avgTotal}/40)` : `the stronger overall record`}, supported by the exhibit posture, for a total tally of ${isPlaintiffWinner ? plaintiffTotal : defenseTotal} to ${isPlaintiffWinner ? defenseTotal : plaintiffTotal}.`,
    whyLoserLost: `${loser} lost on the same record: ${loserArgs.turns > 0 ? `${loserArgs.turns} arguments averaging ${loserArgs.avgTotal}/40 did not overcome the opposition` : 'no scored arguments were entered'}${isPlaintiffWinner ? '' : ', and the plaintiff bears the burden when the scales do not tip'}.`,
    keyReasons,
    evidenceConsidered: admittedItems.map(e => `${e.id}: ${e.title}`),
    jurors: generateJuryVotes(state, decision),
  };
}

export function getJudgeTransition(phase: CourtPhase | undefined, state: CourtState): string {
  if (!phase) return '';
  const isPreset = state.case.caseSource === 'preset';
  if (isPreset) {
    return JUDGE_TRANSITIONS[phase] || '';
  }

  const pSide = state.case.plaintiffSide || 'the Plaintiff';
  const dSide = state.case.defenseSide || 'the Defendant';
  const title = state.case.title || 'this case';

  const transitions: Record<CourtPhase, string> = {
    case_setup: '',
    court_opening: `The Court will now come to order. This is Case: ${title} (${state.case.caseType || 'Dispute'}). Counsel, please state your appearances for the record.`,
    plaintiff_opening: `Thank you, counsel. Now, Advocate Verma, you may deliver your opening statement on behalf of the plaintiff, ${pSide}. Jury, pay close attention.`,
    defense_opening: `Thank you, Advocate Verma. Advocate Kapoor, you may deliver your opening statement on behalf of the defendant, ${dSide}.`,
    evidence_presentation: `We will now move to the evidence presentation phase. The parties may present arguments and evidence. Counsel, approach the evidence board.`,
    objection_ruling: `Before we proceed to cross-examination, the court will hear any objections to evidence already presented. Counsel, state your objections now.`,
    cross_examination: `We will now move to cross-examination. Each counsel may question the other party's expert witnesses. Objections to questions must be raised immediately.`,
    witness_testimony: `We will now take expert witness testimony. The court calls the expert witnesses. Counsel, you may conduct direct examination. The opposing counsel will have opportunity for cross-examination.`,
    motion_hearing: `The court will now hear any motions. Counsel, if you wish to make a motion to strike, dismiss, or regarding evidence, state your motion now.`,
    jury_instructions: `Before closing arguments, the Court will now instruct the jury on the law and evaluation of evidence for the case: ${title}. This is a fictional simulation for educational purposes only.`,
    rebuttal: `Now we move to the rebuttal phase. The plaintiff may respond to the defendant's arguments. The defendant may then provide final countering points.`,
    closing_arguments: `We will now hear closing arguments. Both counsel, summarize your priority claims. The court will consider all presented evidence for ${title}.`,
    judge_deliberation: `The court will now deliberate on the dispute: ${title}. All rise, please. This matter is taken under advisement.`,
    verdict: `The Court has reached a decision on ${title}. All rise for the verdict.`,
    case_summary: `This concludes the proceedings. The Court thanks all counsel for their professional conduct. Case dismissed.`,
  };

  return transitions[phase] || '';
}

function advanceToNextPhase(state: CourtState): CourtState {
  if (state.transcript.some(t => t.id.startsWith('trans-summary-'))) {
    return state;
  }
  const currentIndex = COURT_PHASES.indexOf(state.currentPhase);
  const nextPhase = COURT_PHASES[currentIndex + 1];
  
  // Get judge transition message for entering new phase
  const transitionMsg = getJudgeTransition(nextPhase, state);
  
  // Build new transcript with judge transition announcement
  const transitionEntry: TranscriptEntry = {
    id: `trans-j-transition-${Date.now()}`,
    speakerRole: 'judge',
    speakerName: getParticipantName(state, 'judge'),
    message: transitionMsg || `We will now proceed to the ${(nextPhase || '').replace('_', ' ')} phase.`,
    phase: nextPhase || 'case_summary',
    sequenceNumber: state.transcript.length + 1,
    timestamp: new Date().toISOString(),
    providerUsed: 'mock',
    modelUsed: 'judge-reasoner-v1',
    responseSource: 'mock',
    isComplete: true,
  };
  
  if (!nextPhase) {
    // End of trial - case summary phase
    const isPreset = state.case.caseSource === 'preset';
    const caseRef = isPreset ? 'Case 2024-CV-3847' : `Case: ${state.case.title}`;
    const summaryEntry: TranscriptEntry = {
      ...transitionEntry,
      id: `trans-summary-${Date.now()}`,
      phase: 'case_summary',
      message: `This concludes the proceedings in ${caseRef}. The Court thanks all counsel for their professional conduct. Case dismissed.`,
    };
    return { ...state, currentPhase: 'case_summary', currentSpeaker: 'judge', transcript: [...state.transcript, transitionEntry, summaryEntry] };
  }
  
  const nextSpeakers = getSpeakersForPhase(nextPhase);
  const firstSpeaker = nextSpeakers.length > 0 ? nextSpeakers[0] : null;

  let updatedMotions = [...state.motionHistory];
  const updatedEvidenceForMotions = [...state.evidence];
  const motionEntries: TranscriptEntry[] = [];

  // Leaving motion_hearing: the judge rules on any motions still pending
  if (state.currentPhase === 'motion_hearing' && updatedMotions.some(m => m.status === 'pending')) {
    updatedMotions = updatedMotions.map(motion => {
      if (motion.status !== 'pending') return motion;
      const granted = motion.motionType === 'motion_to_admit_evidence';
      const rulingNote = granted
        ? 'Motion GRANTED. The material is properly before the court.'
        : 'Motion DENIED. The court finds insufficient grounds; the record stands.';
      motionEntries.push({
        id: `trans-motion-ruling-${Date.now()}-${motion.id}`,
        speakerRole: 'judge',
        speakerName: getParticipantName(state, 'judge'),
        message: `On the ${motion.motionType.replace(/_/g, ' ')} filed by the ${motion.raisedBy}: ${rulingNote}`,
        phase: state.currentPhase,
        sequenceNumber: state.transcript.length + motionEntries.length + 1,
        timestamp: new Date().toISOString(),
        providerUsed: 'mock',
        modelUsed: 'judge-reasoner-v1',
        responseSource: 'mock',
        isComplete: true,
      });
      if (granted && motion.motionType === 'motion_to_admit_evidence' && motion.targetEvidence) {
        const idx = updatedEvidenceForMotions.findIndex(e => e.id === motion.targetEvidence);
        if (idx >= 0 && updatedEvidenceForMotions[idx].status !== 'disputed') {
          updatedEvidenceForMotions[idx] = { ...updatedEvidenceForMotions[idx], status: 'admitted' };
        }
      }
      return { ...motion, status: granted ? 'granted' as const : 'denied' as const, rulingNote, rulingReason: rulingNote };
    });
  }

  // Entering motion_hearing: counsel file case-derived motions for the court to rule on
  if (nextPhase === 'motion_hearing' && updatedMotions.length === 0) {
    const pSide = state.case.plaintiffSide || 'the Plaintiff';
    const dSide = state.case.defenseSide || 'the Defendant';
    const pExhibit = state.evidence.find(e => e.introducedBy === 'prosecutor');
    const dExhibit = state.evidence.find(e => e.introducedBy === 'defense');

    updatedMotions.push({
      id: `mot-${Date.now()}-p`,
      motionType: 'motion_to_admit_evidence',
      raisedBy: 'prosecutor',
      reason: `Formal admission of ${pExhibit ? pExhibit.title : 'plaintiff exhibits'} into the trial record.`,
      argumentSummary: `Counsel for ${pSide} argues the exhibit is authenticated, relevant, and central to proving the claim.`,
      oppositionResponse: `Counsel for ${dSide} contends the exhibit is self-serving and lacks independent verification.`,
      targetEvidence: pExhibit?.id,
      status: 'pending',
      phase: 'motion_hearing',
    });
    updatedMotions.push({
      id: `mot-${Date.now()}-d`,
      motionType: 'motion_to_exclude_evidence',
      raisedBy: 'defense',
      reason: `Exclusion of ${pExhibit ? pExhibit.title : "the plaintiff's key exhibit"} for lack of foundation.`,
      argumentSummary: `Counsel for ${dSide} argues the plaintiff's exhibit was prepared for litigation and lacks proper foundation.`,
      oppositionResponse: `Counsel for ${pSide} responds the exhibit is a business record with established provenance.`,
      targetEvidence: pExhibit?.id || dExhibit?.id,
      status: 'pending',
      phase: 'motion_hearing',
    });

    motionEntries.push({
      id: `trans-motion-filed-${Date.now()}`,
      speakerRole: 'prosecutor',
      speakerName: getParticipantName(state, 'prosecutor'),
      message: `Your Honor, ${pSide} moves to admit ${pExhibit ? pExhibit.title : 'our exhibits'} into the record. The defense has filed a competing motion to exclude. We ask the court to rule.`,
      phase: nextPhase,
      sequenceNumber: state.transcript.length + motionEntries.length + 2,
      timestamp: new Date().toISOString(),
      providerUsed: 'mock',
      modelUsed: 'motion-engine-v1',
      responseSource: 'mock',
      isComplete: true,
    });
  }

  if (nextPhase === 'verdict') {
    const calculatedVerdict = generateDynamicVerdict(state);
    const verdictEntry: TranscriptEntry = {
      ...transitionEntry,
      message: calculatedVerdict.ruling || `The Court finds in favour of ${calculatedVerdict.decision === 'plaintiff_wins' ? 'the plaintiff' : 'the defendant'}.`,
    };
    return {
      ...state,
      currentPhase: nextPhase,
      currentSpeaker: firstSpeaker,
      transcript: [...state.transcript, ...motionEntries, transitionEntry, verdictEntry],
      motionHistory: updatedMotions,
      evidence: updatedEvidenceForMotions,
      verdict: calculatedVerdict
    };
  }

  // Normal phase transition with judge announcement
  return {
    ...state,
    currentPhase: nextPhase,
    currentSpeaker: firstSpeaker,
    transcript: [...state.transcript, ...motionEntries, transitionEntry],
    motionHistory: updatedMotions,
    evidence: updatedEvidenceForMotions,
  };
}

/**
 * Rule on a pending motion (manual ruling from the bench / the user).
 */
export function ruleOnMotion(
  state: CourtState,
  motionId: string,
  granted: boolean,
  rulingNote?: string
): CourtState {
  const motion = state.motionHistory.find(m => m.id === motionId);
  if (!motion || motion.status !== 'pending') return state;

  const note = rulingNote || (granted
    ? 'Motion GRANTED. The material is properly before the court.'
    : 'Motion DENIED. The court finds insufficient grounds; the record stands.');

  const rulingEntry: TranscriptEntry = {
    id: `trans-motion-ruling-${Date.now()}`,
    speakerRole: 'judge',
    speakerName: getParticipantName(state, 'judge'),
    message: `On the ${motion.motionType.replace(/_/g, ' ')} filed by the ${motion.raisedBy}: ${note}`,
    phase: state.currentPhase,
    sequenceNumber: state.transcript.length + 1,
    timestamp: new Date().toISOString(),
    providerUsed: 'mock',
    modelUsed: 'judge-reasoner-v1',
    responseSource: 'mock',
    isComplete: true,
  };

  // Apply evidence effects of the ruling
  const updatedEvidence = [...state.evidence];
  if (granted && motion.targetEvidence) {
    const idx = updatedEvidence.findIndex(e => e.id === motion.targetEvidence);
    if (idx >= 0) {
      const newStatus: Evidence['status'] =
        motion.motionType === 'motion_to_exclude_evidence' ? 'excluded' : 'admitted';
      updatedEvidence[idx] = { ...updatedEvidence[idx], status: newStatus };
    }
  }

  return {
    ...state,
    transcript: [...state.transcript, rulingEntry],
    evidence: updatedEvidence,
    motionHistory: state.motionHistory.map(m =>
      m.id === motionId ? { ...m, status: granted ? 'granted' : 'denied', rulingNote: note, rulingReason: note } : m
    ),
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
/**
 * Phase 25: a human player (play-a-role mode) raises an objection against the
 * last statement. Creates a pending objection plus the counsel outburst in the
 * transcript; the AI judge (or the user) rules on it via ruleOnObjection.
 */
export function recordPlayerObjection(
  state: CourtState,
  raisedBy: AgentRole,
  objectionType: ObjectionType
): CourtState {
  if (state.objectionHistory.some(o => o.status === 'pending')) return state;

  const objectionEntry: TranscriptEntry = {
    id: `trans-objection-${Date.now()}`,
    speakerRole: raisedBy,
    speakerName: getParticipantName(state, raisedBy),
    message: getObjectionText(objectionType),
    phase: state.currentPhase,
    sequenceNumber: state.transcript.length + 1,
    timestamp: new Date().toISOString(),
    providerUsed: 'human',
    modelUsed: 'you',
    responseSource: 'real',
    isComplete: true,
  };

  return {
    ...state,
    transcript: [...state.transcript, objectionEntry],
    objectionHistory: [
      ...state.objectionHistory,
      {
        id: `obj-player-${Date.now()}`,
        raisedBy,
        type: objectionType,
        status: 'pending',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// Objection management
export function recordObjection(
  state: CourtState,
  raisedBy: AgentRole,
  objectionType: ObjectionType,
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
  // Determine reason and impact for the ruling
  const rulingReason = sustained ? 'Objection deemed relevant and impacts evidence admissibility.' : 'Objection not pertinent; evidence remains admissible.';
  const rulingImpact = sustained ? 'Evidence excluded or limited.' : 'Evidence admitted.';
  const rulingMessage = sustained
    ? `The objection is SUSTAINED. ${rulingReason} ${rulingImpact}`
    : `The objection is OVERRULED. ${rulingReason} ${rulingImpact}`;
  
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
  const updatedEvidence = [...state.evidence];
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
      obj.id === objectionId ? { ...obj, status: objStatus, reason: rulingReason, impact: rulingImpact } : obj
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

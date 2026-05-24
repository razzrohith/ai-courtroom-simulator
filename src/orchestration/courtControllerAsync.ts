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
import { JUDGE_TRANSITIONS, shouldTriggerObjection, MOCK_VERDICT } from '../data/mockCourtFlow';
import { loadCourtroomConfig, setAgentConnectionStatus } from '../types/providers';
import type { CaseData } from '../types/courtroom';

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
  let updatedCase = { ...state.case };
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

  return {
    ...state,
    isActive: true,
    currentPhase: 'court_opening',
    currentSpeaker: 'judge',
    case: updatedCase,
    evidence: updatedEvidence,
    witnesses: updatedWitnesses
  };
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
    caseData: state.case
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
    caseKeyFacts: state.case.keyFacts,
    caseData: state.case
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

export function generateDynamicVerdict(state: CourtState): Verdict {
  const isPreset = state.case.caseSource === 'preset';
  if (isPreset) {
    return MOCK_VERDICT;
  }

  // Count sustained objections
  const prosecutorSustained = state.objectionHistory.filter(o => o.raisedBy === 'prosecutor' && o.status === 'sustained').length;
  const defenseSustained = state.objectionHistory.filter(o => o.raisedBy === 'defense' && o.status === 'sustained').length;

  // Admitted or offered evidence
  const admittedItems = state.evidence.filter(e => e.status === 'admitted' || e.status === 'offered');
  const plaintiffAdmitted = admittedItems.filter(e => e.introducedBy === 'prosecutor').length;
  const defenseAdmitted = admittedItems.filter(e => e.introducedBy === 'defense').length;

  // Decide winner based on trial metrics (fall back to title length hash if tied)
  const plaintiffScore = plaintiffAdmitted + prosecutorSustained;
  const defenseScore = defenseAdmitted + defenseSustained;
  
  let isPlaintiffWinner = true;
  if (plaintiffScore !== defenseScore) {
    isPlaintiffWinner = plaintiffScore > defenseScore;
  } else {
    isPlaintiffWinner = state.case.title.length % 2 === 0;
  }

  const winner = isPlaintiffWinner ? state.case.plaintiffSide : state.case.defenseSide;
  const loser = isPlaintiffWinner ? state.case.defenseSide : state.case.plaintiffSide;
  const decision = isPlaintiffWinner ? 'plaintiff_wins' : 'defense_wins';

  // Extract transcript snippets to summarize evidence/facts considered
  const keyReasons = [
    `The court finds the arguments and evidence presented by ${winner} to be more compelling under the standard of proof.`,
    isPlaintiffWinner 
      ? `Plaintiff established that ${state.case.claimSummary.substring(0, 100)}... represents the correct operational priority.`
      : `Defense successfully countered the plaintiff's assertions and proved that ${state.case.defenseSide}'s model offers superior contextual capability.`,
    `A total of ${admittedItems.length} exhibits were admitted and weighed, with ${isPlaintiffWinner ? plaintiffAdmitted : defenseAdmitted} key files favoring the prevailing side.`
  ];

  return {
    decision,
    reasoningSummary: `Following careful deliberation, the Court enters judgment in favor of ${winner}. The trial proceedings demonstrated that ${winner}'s assertions are backed by concrete performance indicators. While ${loser} offered credible testimony, their core arguments failed to overcome the evidence submitted by the opposing side.`,
    plaintiffPoints: [
      `Presented arguments on the primary capability claims for ${state.case.plaintiffSide}.`,
      `Introduced evidence demonstrating the design strengths of the plaintiff's platform.`
    ],
    defensePoints: [
      `Countered the plaintiff's assertions with architectural capability studies.`,
      `Demonstrated the specialized advantages of ${state.case.defenseSide} during cross-examination.`
    ],
    weaknesses: {
      plaintiff: isPlaintiffWinner ? [] : [`Fails to address specialized long-form and safety benchmarks.`],
      defense: isPlaintiffWinner ? [`Could not fully match the sheer raw throughput of the plaintiff.`] : [],
    },
    ruling: `Judgment is hereby entered for the ${isPlaintiffWinner ? 'Plaintiff' : 'Defendant'}. The ${winner} is declared the prevailing party.`,
    witnessImpact: `The testimony of both technical experts was evaluated. The court notes that the credibility of the prevailing side's expert remained intact through cross-examination.`,
    juryInstructionSummary: 'Burden of proof: preponderance of evidence. Jury was instructed to prioritize factual benchmarks over marketing claims.',
    motionImpact: 'Admissibility motions for Exhibit P-1 and Exhibit D-1 were decided in accordance with relevance guidelines.',
    deliberationSummary: `The court deliberated on: ${state.case.title}. After weighing all elements, the balance of proof favors the ${isPlaintiffWinner ? 'Plaintiff' : 'Defendant'}.`,
    appealGrounds: [
      `Benchmarking: Disagreement on whether simulated performance metrics constitute sufficient proof of superiority.`,
      `Objection rulings: Challenging the admissibility of technical reports over direct testimony.`
    ],
    winnerName: winner,
    whyWinnerWon: `${winner} proved superior performance and capability benchmarks through admitted exhibits and consistent expert testimony.`,
    whyLoserLost: `${loser} failed to substantiate its superiority claims and was unable to impeach the credibility of the opposing expert.`,
    keyReasons,
    evidenceConsidered: admittedItems.map(e => `${e.id}: ${e.title}`)
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
      transcript: [...state.transcript, transitionEntry, verdictEntry],
      verdict: calculatedVerdict
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

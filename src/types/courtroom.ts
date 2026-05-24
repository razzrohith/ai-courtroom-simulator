/**
 * Courtroom Types — Core TypeScript definitions for the courtroom simulation
 */

export type CourtPhase =
  | 'case_setup'
  | 'court_opening'
  | 'plaintiff_opening'
  | 'defense_opening'
  | 'evidence_presentation'
  | 'objection_ruling'
  | 'cross_examination'
  | 'witness_testimony'
  | 'motion_hearing'
  | 'jury_instructions'
  | 'rebuttal'
  | 'closing_arguments'
  | 'judge_deliberation'
  | 'verdict'
  | 'case_summary';

export const COURT_PHASES: CourtPhase[] = [
  'case_setup',
  'court_opening',
  'plaintiff_opening',
  'defense_opening',
  'evidence_presentation',
  'objection_ruling',
  'cross_examination',
  'witness_testimony',
  'motion_hearing',
  'jury_instructions',
  'rebuttal',
  'closing_arguments',
  'judge_deliberation',
  'verdict',
  'case_summary',
];

export const PHASE_LABELS: Record<CourtPhase, string> = {
  case_setup: 'Case Setup',
  court_opening: 'Court Opening',
  plaintiff_opening: 'Plaintiff Opening Statement',
  defense_opening: 'Defense Opening Statement',
  evidence_presentation: 'Evidence Presentation',
  objection_ruling: 'Objection & Ruling',
  cross_examination: 'Cross Examination',
  witness_testimony: 'Witness Testimony',
  motion_hearing: 'Motion Hearing',
  jury_instructions: 'Jury Instructions',
  rebuttal: 'Rebuttal',
  closing_arguments: 'Closing Arguments',
  judge_deliberation: 'Judge Deliberation',
  verdict: 'Verdict',
  case_summary: 'Case Summary',
};

export type AgentRole = 'judge' | 'prosecutor' | 'defense';

export interface AgentParticipant {
  id: string;
  role: AgentRole;
  name: string;
  title: string;
  modelConfig: AgentModelConfig;
}

export interface TranscriptEntry {
  id: string;
  speakerRole: AgentRole;
  speakerName: string;
  message: string;
  phase: CourtPhase;
  sequenceNumber: number;
  timestamp: string;
  evidenceRef?: string;
  // Provider metadata (Phase 4)
  providerUsed?: string;
  modelUsed?: string;
  responseSource?: 'mock' | 'real' | 'fallback';
  // Streaming metadata (Phase 5)
  isComplete?: boolean;
  streamedChars?: number;
}

export type EvidenceStatus = 'pending' | 'offered' | 'admitted' | 'disputed' | 'excluded' | 'sealed';

export interface Evidence {
  id: string;
  title: string;
  // Phase 13: Exhibit management
  exhibitNumber?: string;
  type: 'document' | 'email' | 'report' | 'physical' | 'testimony' | 'digital';
  // Phase 13: Confidentiality
  confidentiality: 'public' | 'confidential' | 'sealed';
  summary: string;
  introducedBy: AgentRole;
  status: EvidenceStatus;
  content: string;
  // Phase 8: Timeline tracking (optional for backward compat)
  firstReferencedPhase?: CourtPhase;
  lastReferencedBy?: AgentRole;
  referenceCount?: number;
  objectionId?: string; // linked objection if status changed from ruling
  motionId?: string; // linked motion if status changed from motion
  // Phase 13: Additional exhibit tracking
  admittedBy?: AgentRole; // judge ruling
  admittedAtPhase?: CourtPhase;
  sealedSummary?: string; // Restricted view when sealed
  notes?: string;
}

// Phase 9: Witness types
export type WitnessCredibility = 'credible' | 'challenged' | 'inconsistent' | 'corroborated';

// Phase 10: Enhanced credibility scoring
export type CredibilityScore = 'strong' | 'moderate' | 'weak' | 'challenged';

export interface WitnessEvidenceLink {
  evidenceId: string;
  supports: boolean; // true = corroborates, false = contradicts
  notes?: string;
}

export interface WitnessQAndA {
  id: string;
  witnessId: string;
  examinerRole: AgentRole; // who asked the question
  question: string;
  answer: string;
  phase: CourtPhase;
  evidenceIds?: string[]; // evidence referenced
}

export interface Witness {
  id: string;
  name: string;
  role: 'prosecution' | 'defense' | 'court';
  title: string;
  summary: string;
  testimony?: string;
  credibility: WitnessCredibility;
  // Phase 10: Extended credibility tracking
  credibilityScore?: CredibilityScore;
  evidenceLinks?: WitnessEvidenceLink[];
  qAndAHistory?: WitnessQAndA[];
  // Direct examination by prosecution/defense
  directExamination?: string;
  // Cross-examination by opposing counsel
  crossExamination?: string;
  // Credibility notes
  credibilityNotes?: string;
}

// Phase 9: Motion types (enhanced in Phase 11)
export type MotionType = 
  | 'motion_to_strike' 
  | 'motion_to_dismiss' 
  | 'motion_to_admit_evidence' 
  | 'motion_to_exclude_evidence'
  | 'motion_for_directed_verdict'; // Phase 11

export type MotionStatus = 'pending' | 'granted' | 'denied';

// Enhanced Motion Event - Phase 11 with full argument structure
export interface MotionEvent {
  id: string;
  motionType: MotionType;
  raisedBy: AgentRole;
  reason: string;
  // Phase 11: Enhanced arguments
  argumentSummary?: string;
  oppositionResponse?: string;
  rulingReason?: string;
  targetEvidence?: string;
  targetWitness?: string;
  affectedEvidenceId?: string;
  affectedWitnessId?: string;
  status: MotionStatus;
  rulingNote?: string;
  phase: CourtPhase;
}

export type VerdictDecision = 'plaintiff_wins' | 'defense_wins' | 'partial_verdict' | 'dismissed';

export interface Verdict {
  decision: VerdictDecision;
  reasoningSummary: string;
  plaintiffPoints: string[];
  defensePoints: string[];
  weaknesses: { plaintiff: string[]; defense: string[] };
  ruling: string;
  // Phase 10: Witness credibility impact on verdict
  witnessImpact?: string;
  // Phase 11: Jury and motion integration
  juryInstructionSummary?: string;
  motionImpact?: string;
  // Phase 12: Deliberation and appeals
  deliberationSummary?: string;
  appealGrounds?: string[];
  // Verdict Clarity Enhancements
  winnerName?: string;
  whyWinnerWon?: string;
  whyLoserLost?: string;
  keyReasons?: string[];
  evidenceConsidered?: string[];
}

export interface CaseData {
  id: string;
  title: string;
  caseType: string;
  plaintiffSide: string;
  defenseSide: string;
  claimSummary: string;
  keyFacts: string[];
  evidenceItems: Evidence[];
  legalQuestions: string[];
  caseSource?: 'custom' | 'preset';
  presetId?: string;
  schemaVersion?: number;
}

export interface CourtState {
  objectionHistory: ObjectionEvent[];
  // Phase 9: Witnesses and motions
  witnesses: Witness[];
  motionHistory: MotionEvent[];
  currentPhase: CourtPhase;
  currentSpeaker: AgentRole | null;
  participants: AgentParticipant[];
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  verdict: Verdict | null;
  case: CaseData;
  isActive: boolean;
}

export type ObjectionType =
  | 'relevance'
  | 'speculation'
  | 'argumentative'
  | 'hearsay'
  | 'assumes_facts_not_shown'
  | 'misleading_evidence'
  | 'improper_conclusion'
  | 'leading_question'
  | 'lack_of_foundation'
  | 'compound_question';

export interface ObjectionEvent {
  id: string;
  raisedBy: AgentRole;
  type: ObjectionType;
  targetEvidence?: string;
  status: 'pending' | 'sustained' | 'overruled' | 'allowed_with_limitation';
  timestamp: string;
  // New fields for Phase 28D
  reason?: string; // short reason for ruling
  impact?: string; // why this matters / evidence impact description
}


// Agent model configuration (placeholder for future providers)
export interface ModelProviderType {
  id: string;
  name: string;
  status: 'mock' | 'planned';
}

export interface AgentModelConfig {
  provider: ModelProviderType;
  model: string;
  mode: 'mock' | 'local' | 'api';
}

// Courtroom context for memory management (Phase 5, enhanced Phase 7)
export interface CourtroomContext {
  caseSummary: string;
  currentPhase: CourtPhase;
  recentTranscript: TranscriptEntry[];
  relevantEvidence: Evidence[];
  caseKeyFacts?: string[];
  objectionHistory: ObjectionEvent[];
}

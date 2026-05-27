/**
 * Courtroom Types — Core TypeScript definitions for the courtroom simulation
 */
export const COURT_PHASES = [
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
export const PHASE_LABELS = {
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

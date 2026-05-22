/**
 * Sample Case Data — Philosophical / Scientific Debate
 * "The Hen v. The Egg: Origin Priority Dispute"
 * Phase 22.6: Dynamic Case Facts and Evidence Collection
 */

import type { CaseData } from '../types/courtroom';

export const SAMPLE_CASE: CaseData = {
  id: 'case-001',
  title: 'The Hen v. The Egg: Origin Priority Dispute',
  caseType: 'Philosophical / Scientific Debate',
  plaintiffSide: 'The Hen',
  defenseSide: 'The Egg',
  claimSummary: 'The Hen claims that the hen came first because an egg requires a living bird to lay it. The Egg argues that the egg came first because evolutionary changes happen before a new species fully appears.',
  keyFacts: [],
  evidenceItems: [],
  legalQuestions: [
    'Does the creation of a modern hen egg require a pre-existing hen to synthesize the shell proteins?',
    'Can evolutionary genetic mutations that define a new species occur within the zygote/egg before the adult form exists?',
    'Which entity is the logical and biological initiator of the reproductive cycle?'
  ],
};


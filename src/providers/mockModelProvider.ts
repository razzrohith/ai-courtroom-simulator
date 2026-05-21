/**
 * Mock Model Provider — Simulated AI responses for demo/testing
 */

import type { IModelProvider } from './modelProviderTypes';
import type { AgentRole, CourtPhase } from '../types/courtroom';

/**
 * Mock provider implementation
 * Returns pre-scripted responses based on agent role
 */
export class MockModelProvider implements IModelProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider';
  readonly status: 'mock' | 'available' | 'planned' = 'mock';

  private initialized = false;

  async initialize(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.initialized = true;
  }

  async generate(_prompt: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return '[Mock Response]';
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }
}

// Singleton instance
export const mockProvider = new MockModelProvider();

// Simple generateResponse function for use without class
export function generateMockResponse(params: {
  role: AgentRole;
  phase: CourtPhase;
  prompt: string;
}): string {
  const { role, phase } = params;
  
  const mockResponses: Record<CourtPhase, Record<AgentRole, string>> = {
    case_setup: {
      judge: 'This court is now in session. We will proceed with the case.',
      prosecutor: 'Your Honor, we are prepared to present our case.',
      defense: 'Your Honor, the defense is ready.',
    },
    court_opening: {
      judge: 'This court is now in session. Please approach.',
      prosecutor: 'The prosecution is ready to present its opening statement.',
      defense: 'The defense is ready, Your Honor.',
    },
    plaintiff_opening: {
      judge: '',
      prosecutor: 'Good morning. This case concerns a breach of contract regarding the supply agreement between Apex Logistics and Northstar Retail.',
      defense: '',
    },
    defense_opening: {
      judge: '',
      prosecutor: '',
      defense: 'The defense will show that Northstar Retail had valid reasons for refusing payment given the delivery delays.',
    },
    evidence_presentation: {
      judge: '',
      prosecutor: 'We enter into evidence the signed supply agreement, dated January 15, 2024.',
      defense: '',
    },
    objection_ruling: {
      judge: 'The objection is overruled. The evidence is relevant.',
      prosecutor: '',
      defense: '',
    },
    cross_examination: {
      judge: '',
      prosecutor: 'Did you receive notice of the delays?',
      defense: 'Yes, but the delays were excessive.',
    },
    rebuttal: {
      judge: '',
      prosecutor: 'The defense has not provided documentation.',
      defense: '',
    },
    closing_arguments: {
      judge: '',
      prosecutor: 'We ask the court to rule in favor of the plaintiff.',
      defense: 'We ask the court to dismiss the case.',
    },
    judge_deliberation: {
      judge: 'The court will recess for deliberation.',
      prosecutor: '',
      defense: '',
    },
    verdict: {
      judge: 'After careful consideration, the court finds in favor of the defendant.',
      prosecutor: '',
      defense: '',
    },
    // Phase 9: New phases
    witness_testimony: {
      judge: 'The court will now take testimony. Please proceed with direct examination.',
      prosecutor: 'I call my witness to the stand.',
      defense: 'I will cross-examine this witness.',
    },
    motion_hearing: {
      judge: 'The court will hear any motions at this time.',
      prosecutor: 'Your Honor, we make a motion to admit Exhibit E03.',
      defense: 'Your Honor, we make a motion to dismiss.',
    },
    // Phase 11: Jury instructions
    jury_instructions: {
      judge: `Members of the jury, at this time the Court will provide you with instructions on the law. This is a fictional educational simulation and does not constitute legal advice.

BURDEN OF PROOF: The plaintiff bears the burden of proving their claims by a preponderance of the evidence. This means it's more likely than not that the plaintiff's claims are true.

EVIDENCE CONSIDERATION: You must consider all testimony and documents presented. Evaluate witness credibility based on consistency, potential bias, and corroboration.

OBJECTIONS: Any objections raised during trial were ruled upon by the Court. You should not penalize a party for having an objection sustained or overruled.

FINALLY: This simulation is for educational purposes only. Do not use this as legal advice in any real matter.`,
      prosecutor: '',
      defense: '',
    },
    case_summary: {
      judge: 'This concludes the proceedings.',
      prosecutor: '',
      defense: '',
    },
  };
  
  return mockResponses[phase]?.[role] || `[${role} at ${phase}]`;
}

/**
 * Generate witness Q&A - Phase 10
 * Creates structured question/answer pairs for direct and cross examination
 */
export function generateWitnessQAndA(params: {
  witnessId: string;
  examinerRole: 'prosecutor' | 'defense' | 'judge';
  questionType: 'direct' | 'cross' | 'clarification';
}): {
  question: string;
  answer: string;
  examinerRole: 'prosecutor' | 'defense' | 'judge';
  evidenceIds?: string[];
} {
  const { witnessId, examinerRole, questionType } = params;
  
  // Mock Q&A based on witness and question type
  const mockQA: Record<string, Record<string, { q: string; a: string; evidence?: string[] }>> = {
    'wit-001': { // James Morrison (prosecution)
      direct: {
        q: 'Mr. Morrison, please describe your role at Apex Logistics during the relevant period.',
        a: 'I was Operations Manager responsible for overseeing all delivery operations and coordinating with Northstar on supply chain matters.',
        evidence: ['E01'],
      },
      cross: {
        q: 'Mr. Morrison,weren\'t the delivery delays caused by factors beyond Northstar\'s control?',
        a: 'Objection, Your Honor. Calls for speculation.\n\nSustained. Counsel, rephrase.',
      },
      clarification: {
        q: 'Mr. Morrison, can you clarify the timeline of the first delay notice?',
        a: 'Yes, Your Honor. The first notice was sent on March 15th, referencing the February delay.',
      },
    },
    'wit-002': { // Linda Patterson (defense)
      direct: {
        q: 'Ms. Patterson, what was your understanding of the delivery schedule?',
        a: 'The contract required delivery within 14 days of order placement. We consistently received late deliveries.',
      },
      cross: {
        q: 'Ms. Patterson, didn\'t Northstar accept late deliveries without complaint for months?',
        a: 'We documented each late delivery and reserved our rights under Section 4.2 of the contract.',
      },
      clarification: {
        q: 'Ms. Patterson, regarding the payment refusal - what was the basis?',
        a: 'Section 4.2 Material Breach - we were entitled to withhold payment for continued failures.',
      },
    },
  };
  
  const witnessQA = mockQA[witnessId]?.[questionType];
  if (!witnessQA) {
    return {
      question: '[Question]',
      answer: '[Answer]',
      examinerRole,
    };
  }
  
  return {
    question: witnessQA.q,
    answer: witnessQA.a,
    examinerRole,
    evidenceIds: witnessQA.evidence,
  };
}

/**
 * Calculate credibility score - Phase 10
 * Simple scoring based on evidence consistency
 */
export function calculateCredibilityScore(witness: {
  consistencyWithEvidence: number; // 0-100
  contradictions: number;
  corroborations: number;
}): {
  score: 'strong' | 'moderate' | 'weak' | 'challenged';
  notes: string;
} {
  const { consistencyWithEvidence, contradictions, corroborations } = witness;
  
  if (contradictions > 2 || consistencyWithEvidence < 30) {
    return { score: 'challenged', notes: 'Multiple contradictions found in testimony.' };
  }
  if (consistencyWithEvidence < 50) {
    return { score: 'weak', notes: 'Limited consistency with documented evidence.' };
  }
  if (consistencyWithEvidence < 75 || corroborations < 1) {
    return { score: 'moderate', notes: 'Generally consistent but with some gaps.' };
  }
  return { score: 'strong', notes: 'Strong consistency with corroborating evidence.' };
}

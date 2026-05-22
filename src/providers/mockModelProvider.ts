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
      judge: 'This court is now in session. We will proceed with the origin priority dispute.',
      prosecutor: 'Your Honor, we are prepared to present the plaintiff\'s case.',
      defense: 'Your Honor, the defense is ready.',
    },
    court_opening: {
      judge: 'This court is now in session. Please approach.',
      prosecutor: 'The plaintiff is ready to present its opening statement.',
      defense: 'The defense is ready, Your Honor.',
    },
    plaintiff_opening: {
      judge: '',
      prosecutor: 'Good morning, Your Honor. The Plaintiff, The Hen, claims that the hen came first in this priority dispute. A hen is required to lay the egg, which means the bird itself must have existed prior to the egg. We will demonstrate the living bird requirement as the biological basis of life.',
      defense: '',
    },
    defense_opening: {
      judge: '',
      prosecutor: '',
      defense: 'Your Honor, the defense representing The Egg will show that the egg came first. Evolutionary genetic mutations occur at the zygote stage, before the new species develops into an adult hen. Therefore, the first true hen egg came before the first hen.',
    },
    evidence_presentation: {
      judge: '',
      prosecutor: 'We introduce the living bird requirement to prove that hen eggs require OC-17, a protein synthesized only inside a living hen\'s ovaries. This is supported by Exhibit P-1.',
      defense: 'The defense points to the egg fossil record and the evolutionary record, which show that egg-laying organisms existed hundreds of millions of years before the first hen. We also cite genetic mutation evidence showing mutations occur in the zygote, as documented in Exhibit D-1.',
    },
    objection_ruling: {
      judge: 'The objection is overruled. The scientific argument is relevant to the priority dispute.',
      prosecutor: '',
      defense: '',
    },
    cross_examination: {
      judge: '',
      prosecutor: 'Dr. Vance, does your egg fossil record show a modern chicken egg specifically?',
      defense: 'The evolutionary record shows that the transition was gradual, meaning the egg containing the first hen was laid by a pre-hen ancestor.',
    },
    rebuttal: {
      judge: '',
      prosecutor: 'Without a living bird to produce the OC-17 protein, no such egg shell could form. Therefore, the hen is the initiator.',
      defense: 'The genetic mutation evidence shows that the zygote is where the new species is defined. Thus, the egg came first.',
    },
    closing_arguments: {
      judge: '',
      prosecutor: 'Biology dictates that the shell requires the hen. We request a verdict for the Plaintiff, The Hen.',
      defense: 'Evolution dictates that the genetic change happened in the egg. We request a verdict for the Defendant, The Egg.',
    },
    judge_deliberation: {
      judge: `The Court will now consider all scientific evidence, testimony, objections, and motions before reaching a verdict. This matter is taken under advisement.

Reviewing: Living bird requirement for egg shell protein synthesis. Evidence established evolutionary record, egg fossil record, and genetic mutation evidence. Both witnesses examined regarding ovarian biology and palaeontological transition records.

Preliminary findings: The living bird requirement (OC-17) is proven biochemically, but the evolutionary record shows egg-laying preceded the hen. The genetic mutation evidence shows speciation starts in the zygote. Dr. Rostova credible with ovarian biology data. Dr. Vance credible with dinosaur egg fossil records. Motion to admit Exhibit D-1 granted.

Parties will be notified of final ruling.`,
      prosecutor: '',
      defense: '',
    },
    verdict: {
      judge: 'After careful consideration, the court finds in favor of the defendant, The Egg.',
      prosecutor: '',
      defense: '',
    },
    // Phase 9: New phases
    witness_testimony: {
      judge: 'The court will now take expert testimony. Please proceed with direct examination.',
      prosecutor: 'I call my witness, Dr. Evelyn Rostova, to the stand.',
      defense: 'I will cross-examine the witness.',
    },
    motion_hearing: {
      judge: 'The court will hear any motions at this time.',
      prosecutor: 'Your Honor, we make a motion to admit Exhibit P-1.',
      defense: 'Your Honor, we make a motion to admit Exhibit D-1.',
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
    'wit-001': { // Dr. Evelyn Rostova (plaintiff)
      direct: {
        q: 'Dr. Rostova, please describe your findings regarding the chemical structure of the chicken egg shell.',
        a: 'Through chemical analysis, we found that the formation of the egg shell requires OC-17, a protein synthesized exclusively in the ovaries of a living hen. Without a living bird, the egg shell cannot form, proving the living bird requirement as shown in Exhibit P-1.',
        evidence: ['EXHIBITP1', 'LIVING_BIRD_REQUIREMENT'],
      },
      cross: {
        q: 'Dr. Rostova, is it not true that other egg-laying species existed before the hen?',
        a: 'While egg-laying as a general mechanism predates hens, a true hen egg specifically requires the specific OC-17 avian protein which only a hen possesses.',
        evidence: ['EVOLUTIONARY_RECORD'],
      },
      clarification: {
        q: 'Dr. Rostova, can the OC-17 protein be produced by any other ancestor species?',
        a: 'No, Your Honor. Our genomic studies indicate OC-17 is a novel avian protein unique to the modern Gallus gallus domesticus.',
        evidence: ['EXHIBITP1'],
      },
    },
    'wit-002': { // Dr. Marcus Vance (defense)
      direct: {
        q: 'Dr. Vance, what does the evolutionary and fossil record tell us about the appearance of the egg?',
        a: 'The fossil record shows that amniotic, egg-laying organisms existed hundreds of millions of years before hens. Furthermore, the evolutionary record demonstrates that genetic mutation happens at the zygote stage. Therefore, the first true hen egg containing the first mutated hen zygote came before the adult hen itself, as documented in Exhibit D-1.',
        evidence: ['EXHIBITD1', 'EGG_FOSSIL_RECORD', 'GENETIC_MUTATION_EVIDENCE'],
      },
      cross: {
        q: 'Dr. Vance, how could that first egg be laid without a parent bird to incubate and shelter it?',
        a: 'The parent was a transitional proto-hen ancestor. It possessed almost identical biology, but was genetically distinct from the modern hen. It laid the egg containing the genetic mutation.',
        evidence: ['EVOLUTIONARY_RECORD'],
      },
      clarification: {
        q: 'Dr. Vance, does the genetic mutation evidence show a sharp demarcation?',
        a: 'Yes, Your Honor. At the zygote stage, the genetic mutation sequence defines the species boundaries, establishing priority for the egg.',
        evidence: ['GENETIC_MUTATION_EVIDENCE'],
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

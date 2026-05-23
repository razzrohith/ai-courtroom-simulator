/**
 * Mock Model Provider — Simulated AI responses for demo/testing
 */

import type { IModelProvider } from './modelProviderTypes';
import { sanitizeAgentResponse } from '../utils/sanitizeAgentResponse';
import type { AgentRole, CourtPhase, TranscriptEntry } from '../types/courtroom';

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
  transcript?: TranscriptEntry[];
}): string {
  const { role, phase, transcript } = params;
  
  // Calculate how many substantive entries exist for this speaker in current phase
  const substantiveEntries = transcript ? transcript.filter(
    t => t.phase === phase &&
         t.speakerRole === role &&
         !t.id.startsWith('trans-j-transition-') &&
         !t.id.startsWith('trans-summary-') &&
         !t.id.startsWith('trans-ruling-')
  ) : [];
  const turnIndex = substantiveEntries.length;
  
  const mockResponses: Record<CourtPhase, Record<AgentRole, string | string[]>> = {
    case_setup: {
      judge: 'This court is now in session. We will proceed with the origin priority dispute.',
      prosecutor: 'Your Honor, we are prepared to present the plaintiff\'s case.',
      defense: 'Your Honor, the defense is ready.',
    },
    court_opening: {
      judge: [
        'This court is now in session. The Honorable Justice Arvind Menon presiding. We are here to resolve the priority dispute of the century: The Hen v. The Egg.',
        'Excellent. The counsel for both parties have introduced themselves. We will now proceed to opening statements. Advocate Verma, you may begin.'
      ],
      prosecutor: 'Yes, Your Honor. The Plaintiff, represented by Advocate Rahul Verma, is ready to establish that the living bird is the essential initiator of the egg.',
      defense: 'The Defense is also ready, Your Honor. Advocate Sneha Kapoor representing the Egg. We will show that genetic mutation dictates priority.',
    },
    plaintiff_opening: {
      judge: [
        'Advocate Verma, please present the opening statement for the Plaintiff.',
        'Save it for your opening, Advocate Kapoor. Advocate Verma has laid out the plaintiff\'s foundation. Advocate Kapoor, you may now present the defense\'s opening statement.'
      ],
      prosecutor: 'Good morning, Your Honor. The Plaintiff, The Hen, claims that the hen came first in this priority dispute. A hen is required to lay the egg, which means the bird itself must have existed prior to the egg. We will demonstrate the living bird requirement as the biological basis of life, supported by the maternal shell-protein crystallization process.',
      defense: 'Your Honor, if I may briefly object to this framing—the shell protein is not the only definition of an egg.',
    },
    defense_opening: {
      judge: [
        'Advocate Kapoor, the floor is yours for the Defense\'s opening.',
        'Order, counsel. We will let the evidence speak. Let us transition to the official evidence presentation.'
      ],
      prosecutor: 'But Advocate, a blueprint without a printer cannot produce anything!',
      defense: [
        'Thank you, Your Honor. The Plaintiff focuses on the packaging, but we focus on the genetic blueprint. Evolution dictates that the zygote stage is where any new species is defined through genetic mutation. Therefore, the first true hen egg containing the mutated blueprint came before the first adult hen.'
      ],
    },
    evidence_presentation: {
      judge: [
        'Advocate Verma, please present your primary evidence.',
        'Wait, Advocate Kapoor. Are you arguing that the ancestral bird that laid the first hen egg was not a hen itself?',
        'This is a key point of disagreement. Let us hear from the expert witnesses to clarify these evolutionary and biochemical boundaries.'
      ],
      prosecutor: [
        'Your Honor, we submit Exhibit P-1, a scientific report on the OC-17 protein. It shows that without this specific protein, shell crystallization cannot occur. Since this protein is only made in the hen\'s ovaries, the living bird requirement is absolute.',
        'Exactly, Your Honor! If the parent wasn\'t a chicken, how could it be a chicken egg? It would be a proto-chicken egg!'
      ],
      defense: [
        'Advocate Verma ignores evolutionary history. We present Exhibit D-1, detailing the egg fossil record and mutation dynamics. Amniotic eggs existed 340 million years ago, long before any bird. The genetic transition to the modern chicken occurred inside the zygote of the egg.',
        'No, Your Honor. A chicken egg is defined by the species of the organism inside it, not the parent. The genetic mutation sequence in Exhibit D-1 shows a clear boundary at the zygote stage.'
      ],
    },
    objection_ruling: {
      judge: 'I will rule on this objection. The relevance of the ancestral egg-laying biology is critical to establishing the evolutionary definition of the egg. The objection is overruled. The testimony shall proceed.',
      prosecutor: '',
      defense: '',
    },
    cross_examination: {
      judge: [
        'Advocate Verma, you may cross-examine the defense\'s expert witness, Dr. Amit Patel.',
        'Counsel, let the witness answer. Dr. Patel has shown that evolutionary transitions are gradual. I will note these arguments.'
      ],
      prosecutor: [
        'Dr. Patel, you state that the mutation occurred in the zygote of the egg. But could that egg shell have formed without the maternal OC-17 protein from the parent bird?',
        'But not the modern chicken egg shell. Dr. Patel, isn\'t it true that the modern hen shell requires modern OC-17?'
      ],
      defense: [
        'If I may interject, Dr. Patel\'s report already clarifies that proto-birds had homologous proteins that could form similar shells.',
        'Your Honor, the exact composition of the shell is secondary to the genetic definition of the organism inside.'
      ],
    },
    witness_testimony: {
      judge: [
        'Let us proceed with the witness testimony. Advocate Verma, call your witness.',
        'Understood, Advocate Kapoor. Dr. Sen, please explain the biological priority from your perspective. We will record the testimony.'
      ],
      prosecutor: 'I call Dr. Isha Sen, our evolutionary biologist, to explain the biochemical synthesis of the shell.',
      defense: 'Your Honor, we do not contest the synthesis, but rather its philosophical and evolutionary significance in priority.',
    },
    motion_hearing: {
      judge: [
        'The court is open to motions regarding the admissibility of scientific exhibits.',
        'Both Exhibits P-1 and D-1 are hereby admitted into the official record. They will be heavily weighed in the final decision.'
      ],
      prosecutor: 'Your Honor, we move to admit Exhibit P-1, the biochemical analysis of OC-17, as primary evidence of the living bird requirement.',
      defense: 'We do not object, provided Exhibit D-1, the fossil and genetic mutation records, is also fully admitted to show evolutionary priority.',
    },
    jury_instructions: {
      judge: 'Members of the jury, you must decide this case based on the standard of proof. Weigh the biochemical necessity of the living hen (Exhibit P-1) against the evolutionary genetic mutation priority of the egg (Exhibit D-1). Remember, this is a simulated legal exploration of science.',
      prosecutor: '',
      defense: '',
    },
    rebuttal: {
      judge: [
        'We will now hear rebuttals. Advocate Verma, you may go first.'
      ],
      prosecutor: [
        'Thank you, Your Honor. The Defense\'s theory relies on an abstract genetic mutation. But science is material. You cannot have a chicken egg without a chicken egg shell, and you cannot have that shell without a living hen. Therefore, the hen is the material initiator.',
        'But DNA cannot express itself without the maternal cellular machinery of the parent!'
      ],
      defense: [
        'Your Honor, materiality starts with the DNA. A chicken shell is just a physical container. The actual organism—the chicken—starts at the zygote inside the egg. That zygote is the origin of the species.',
        'And that parent machinery was a proto-hen, meaning the egg containing the first true hen came first!'
      ],
    },
    closing_arguments: {
      judge: [
        'Counsel, present your final closing arguments.',
        'Thank you, Counsel. The arguments have been exceptionally well-presented. This court will now recess for deliberation.'
      ],
      prosecutor: 'Biochemistry dictates that the egg shell requires a living bird\'s ovaries. Without the hen, there is no egg. The hen is the biological initiator. We ask the court to rule in favor of the plaintiff, The Hen.',
      defense: 'Evolutionary genetics dictates that the genetic mutation happened in the egg. The first hen came from the first hen egg. The egg came first. We ask the court to rule in favor of the defendant, The Egg.',
    },
    judge_deliberation: {
      judge: 'The Court is now deliberating. On one hand, we have the material biochemical proof of Exhibit P-1: the hen\'s ovaries produce the essential shell-crystallization protein. On the other hand, the genetic mutation of Exhibit D-1 establishes that the first true chicken existed as a zygote inside the egg first. We will balance these two perspectives.',
      prosecutor: '',
      defense: '',
    },
    verdict: {
      judge: 'After careful scientific and legal consideration, this court rules in favor of the Defendant, The Egg. The evolutionary definition of a species is determined by its genetic blueprint, which is established at fertilization. The first egg containing the modern chicken zygote must have preceded the adult chicken itself. Verdict for the Egg.',
      prosecutor: '',
      defense: '',
    },
    case_summary: {
      judge: 'This concludes the proceedings of this simulated court. We thank Advocate Rahul Verma and Advocate Sneha Kapoor for their outstanding advocacy. This case demonstrates the beautiful intersection of biochemistry and evolutionary theory. Court is dismissed.',
      prosecutor: '',
      defense: '',
    },
  };
  
  const responses = mockResponses[phase]?.[role];
  if (Array.isArray(responses)) {
    const raw = responses[turnIndex] || responses[responses.length - 1] || `[${role} at ${phase} turn ${turnIndex}]`;
    return sanitizeAgentResponse(raw) || raw;
  }
  const raw = responses || `[${role} at ${phase}]`;
  return sanitizeAgentResponse(raw) || raw;
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
    'wit-001': { // Dr. Isha Sen (plaintiff)
      direct: {
        q: 'Dr. Sen, please describe your findings regarding the chemical structure of the chicken egg shell.',
        a: 'Through chemical analysis, we found that the formation of the egg shell requires OC-17, a protein synthesized exclusively in the ovaries of a living hen. Without a living bird, the egg shell cannot form, proving the living bird requirement as shown in Exhibit P-1.',
        evidence: ['EXHIBITP1', 'LIVING_BIRD_REQUIREMENT'],
      },
      cross: {
        q: 'Dr. Sen, is it not true that other egg-laying species existed before the hen?',
        a: 'While egg-laying as a general mechanism predates hens, a true hen egg specifically requires the specific OC-17 avian protein which only a hen possesses.',
        evidence: ['EVOLUTIONARY_RECORD'],
      },
      clarification: {
        q: 'Dr. Sen, can the OC-17 protein be produced by any other ancestor species?',
        a: 'No, Your Honor. Our genomic studies indicate OC-17 is a novel avian protein unique to the modern Gallus gallus domesticus.',
        evidence: ['EXHIBITP1'],
      },
    },
    'wit-002': { // Dr. Amit Patel (defense)
      direct: {
        q: 'Dr. Patel, what does the evolutionary and fossil record tell us about the appearance of the egg?',
        a: 'The fossil record shows that amniotic, egg-laying organisms existed hundreds of millions of years before hens. Furthermore, the evolutionary record demonstrates that genetic mutation happens at the zygote stage. Therefore, the first true hen egg containing the first mutated hen zygote came before the adult hen itself, as documented in Exhibit D-1.',
        evidence: ['EXHIBITD1', 'EGG_FOSSIL_RECORD', 'GENETIC_MUTATION_EVIDENCE'],
      },
      cross: {
        q: 'Dr. Patel, how could that first egg be laid without a parent bird to incubate and shelter it?',
        a: 'The parent was a transitional proto-hen ancestor. It possessed almost identical biology, but was genetically distinct from the modern hen. It laid the egg containing the genetic mutation.',
        evidence: ['EVOLUTIONARY_RECORD'],
      },
      clarification: {
        q: 'Dr. Patel, does the genetic mutation evidence show a sharp demarcation?',
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

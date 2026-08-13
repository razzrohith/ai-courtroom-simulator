/**
 * Mock Model Provider — Simulated AI responses for demo/testing
 */

import type { IModelProvider } from './modelProviderTypes';
import { sanitizeAgentResponse } from '../utils/sanitizeAgentResponse';
import type { AgentRole, CourtPhase, TranscriptEntry, CaseData } from '../types/courtroom';

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
  caseData?: CaseData;
}): string {
  const { role, phase, transcript, caseData } = params;
  
  // Calculate how many substantive entries exist for this speaker in current phase
  const substantiveEntries = transcript ? transcript.filter(
    t => t.phase === phase &&
         t.speakerRole === role &&
         !t.id.startsWith('trans-j-transition-') &&
         !t.id.startsWith('trans-summary-') &&
         !t.id.startsWith('trans-ruling-')
  ) : [];
  const turnIndex = substantiveEntries.length;

  const isHenEgg = caseData?.title?.toLowerCase().includes('hen') && caseData?.title?.toLowerCase().includes('egg');
  if (caseData && !isHenEgg) {
    const plaintiff = caseData.plaintiffSide || 'the Plaintiff';
    const defense = caseData.defenseSide || 'the Defendant';
    const title = caseData.title || 'this dispute';
    const summary = caseData.claimSummary || 'the active claim';
    const judgeName = 'Justice Arvind Menon';
    const prosecutorName = 'Advocate Rahul Verma';
    const defenseName = 'Advocate Sneha Kapoor';

    const pClean = plaintiff.replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0] || 'Plaintiff';
    const dClean = defense.replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0] || 'Defendant';
    const pWitnessName = `Dr. Sarah ${pClean}`;
    const dWitnessName = `Dr. David ${dClean}`;
    const pWitnessLastName = pClean;
    const dWitnessLastName = dClean;

    const dynamicResponses: Record<CourtPhase, Record<AgentRole, string | string[]>> = {
      case_setup: {
        judge: `This court is now in session. We will proceed with the case of ${title}.`,
        prosecutor: `Your Honor, we are prepared to present the plaintiff's case on behalf of ${plaintiff}.`,
        defense: `Your Honor, the defense is ready to represent ${defense}.`,
      },
      court_opening: {
        judge: [
          `This court is now in session. The Honorable ${judgeName} presiding. We are here to resolve the dispute: ${title}. Counsel, please state your appearances for the record.`,
          `Excellent. Counsel for both parties have introduced themselves. We will now proceed to opening statements. Advocate ${prosecutorName.split(' ')[1]}, you may begin.`
        ],
        prosecutor: `Yes, Your Honor. Representing the Plaintiff, ${plaintiff}, I am Advocate ${prosecutorName}. We are ready to proceed.`,
        defense: `Representing the Defendant, ${defense}, I am Advocate ${defenseName}. We are also ready, Your Honor.`,
      },
      plaintiff_opening: {
        judge: [
          `Advocate ${prosecutorName.split(' ')[1]}, please present the opening statement for the Plaintiff.`,
          `Save it for your opening, Advocate ${defenseName.split(' ')[1]}. Advocate ${prosecutorName.split(' ')[1]} has laid out the plaintiff's foundation. Advocate ${defenseName.split(' ')[1]}, you may now present the defense's opening statement.`
        ],
        prosecutor: `Good morning, Your Honor. The Plaintiff, ${plaintiff}, claims that we are entitled to a favorable judgment because: ${summary}. We will show that our position is supported by the facts and evidence.`,
        defense: `Your Honor, if I may object—the plaintiff's claims are completely unfounded.`,
      },
      defense_opening: {
        judge: [
          `Advocate ${defenseName.split(' ')[1]}, the floor is yours for the Defense's opening.`,
          `Order, counsel. We will let the evidence speak. Let us transition to the official evidence presentation.`
        ],
        prosecutor: `We ask the court to note that the plaintiff's arguments remain solid.`,
        defense: [
          `Thank you, Your Honor. The Plaintiff focuses on incorrect premises. In contrast, the Defendant, ${defense}, will demonstrate that the truth is otherwise. We will show that ${summary} should lead to a verdict in our favor.`
        ],
      },
      evidence_presentation: {
        judge: [
          `Advocate ${prosecutorName.split(' ')[1]}, please present your primary evidence.`,
          `Wait, Advocate ${defenseName.split(' ')[1]}. Are you arguing that the opposing side's evidence is irrelevant?`,
          `This is a key point of disagreement. Let us hear from the expert witnesses to clarify these boundaries.`
        ],
        prosecutor: [
          `Your Honor, we submit Exhibit P-1, our technical report. It shows that the metrics and benchmarks favor ${plaintiff} decisively. We ask the court to admit it.`,
          `Exactly, Your Honor! If the evidence supports ${plaintiff}, how could any other conclusion be reached?`
        ],
        defense: [
          `The Plaintiff ignores key contextual elements. We present Exhibit D-1, detailing our own capability study. It shows that ${defense} has superior specialized attributes and performance details.`,
          `No, Your Honor. The evidence in Exhibit D-1 shows a clear advantage for ${defense} in real-world scenarios.`
        ],
      },
      objection_ruling: {
        judge: `I will rule on this objection. The relevance of this evidence is critical to establishing the parameters of this dispute. The objection is overruled. The testimony shall proceed.`,
        prosecutor: '',
        defense: '',
      },
      cross_examination: {
        judge: [
          `Advocate ${prosecutorName.split(' ')[1]}, you may cross-examine the defense's expert witness, ${dWitnessName}.`,
          `Counsel, let the witness answer. Dr. ${dWitnessLastName} has shown that these transitions are gradual. I will note these arguments.`
        ],
        prosecutor: [
          `Dr. ${dWitnessLastName}, you state that the benchmarks are mixed. But isn't it true that your claims ignore the key advantages of ${plaintiff}?`,
          `Dr. ${dWitnessLastName}, isn't it true that our technical report contains undisputed proof?`
        ],
        defense: [
          `If I may interject, Dr. ${dWitnessLastName}'s report already clarifies that other parameters homologous to our system could achieve similar results.`,
          `Your Honor, the exact composition of the benchmarks is secondary to the real-world utility.`
        ],
      },
      witness_testimony: {
        judge: [
          `Let us proceed with the witness testimony. Advocate ${prosecutorName.split(' ')[1]}, call your witness.`,
          `Understood, Advocate ${defenseName.split(' ')[1]}. Dr. ${pWitnessLastName}, please explain the priority from your perspective.`
        ],
        prosecutor: `I call ${pWitnessName}, our technical expert, to explain the performance synthesis.`,
        defense: `Your Honor, we do not contest the identity of the witness, but rather their significance in priority.`,
      },
      motion_hearing: {
        judge: [
          `The court is open to motions regarding the admissibility of scientific exhibits.`,
          `Both Exhibit P-1 and Exhibit D-1 are hereby admitted into the official record. They will be heavily weighed.`
        ],
        prosecutor: `Your Honor, we move to admit Exhibit P-1, the benchmarking analysis, as primary proof of ${plaintiff}'s claims.`,
        defense: `We do not object, provided Exhibit D-1, the capability study, is also fully admitted to show defense priority.`,
      },
      jury_instructions: {
        judge: `Members of the jury, you must decide this case based on the standard of proof. Weigh the technical benchmarks of ${plaintiff} against the capability study of ${defense}. Remember, this is a simulated legal exploration.`,
        prosecutor: '',
        defense: '',
      },
      rebuttal: {
        judge: [
          `We will now hear rebuttals. Advocate ${prosecutorName.split(' ')[1]}, you may go first.`
        ],
        prosecutor: [
          `Thank you, Your Honor. The Defense's theory relies on abstract claims. But the benchmarks are clear. You cannot achieve these results without ${plaintiff}'s design, which is the material initiator of the priority.`,
          `But their model cannot express itself without our design machinery!`
        ],
        defense: [
          `Your Honor, materiality starts with the architecture. The Plaintiff's design is just a container. The actual value—the performance—starts inside the model. That is the origin of the priority.`,
          `And that architecture was a transitional one, meaning the system containing the first true capability came first!`
        ],
      },
      closing_arguments: {
        judge: [
          `Counsel, present your final closing arguments.`,
          `Thank you, Counsel. The arguments have been exceptionally well-presented. This court will now recess for deliberation.`
        ],
        prosecutor: `The benchmarks dictate that ${plaintiff} is the superior choice. We ask the court to rule in favor of the plaintiff, ${plaintiff}.`,
        defense: `The capability study dictates that ${defense} came first. We ask the court to rule in favor of the defendant, ${defense}.`,
      },
      judge_deliberation: {
        judge: `The Court is now deliberating on ${title}. On one hand, we have the material proof of Exhibit P-1. On the other hand, the capability study of Exhibit D-1 establishes priority for the defense. We will balance these two perspectives.`,
        prosecutor: '',
        defense: '',
      },
      verdict: {
        judge: `After careful consideration, this court rules in favor of the Defendant, ${defense}. The performance benchmarks and capability metrics establish priority for the defense. Verdict for the Defendant.`,
        prosecutor: '',
        defense: '',
      },
      case_summary: {
        judge: `This concludes the proceedings of this simulated court. We thank Advocate ${prosecutorName} and Advocate ${defenseName} for their outstanding advocacy. This case demonstrates the beautiful intersection of design and capability. Court is dismissed.`,
        prosecutor: '',
        defense: '',
      },
    };

    const responses = dynamicResponses[phase]?.[role];
    if (Array.isArray(responses)) {
      const raw = responses[turnIndex] || responses[responses.length - 1] || `[${role} at ${phase} turn ${turnIndex}]`;
      return sanitizeAgentResponse(raw) || raw;
    }
    const raw = responses || `[${role} at ${phase}]`;
    return sanitizeAgentResponse(raw) || raw;
  }
  
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
  caseData?: CaseData;
  /** Phase 25: a human examiner's own question drives the witness's answer */
  customQuestion?: string;
  /** Phase 26: the witness's persona sheet (bias + secret weakness) */
  persona?: {
    background: string;
    bias: string;
    secretWeakness: string;
    weaknessKeywords: string[];
  };
}): {
  question: string;
  answer: string;
  examinerRole: 'prosecutor' | 'defense' | 'judge';
  evidenceIds?: string[];
  /** Phase 26: the cross-examination hit the witness's secret weakness */
  weaknessHit?: boolean;
} {
  const { witnessId, examinerRole, questionType, caseData, customQuestion, persona } = params;

  // Interactive examination: answer the human's actual question with a
  // case-grounded response instead of the scripted pair.
  if (customQuestion && customQuestion.trim() && caseData) {
    const plaintiff = caseData.plaintiffSide || 'the Plaintiff';
    const defense = caseData.defenseSide || 'the Defendant';
    const forPlaintiff = witnessId === 'wit-001';
    const mySide = forPlaintiff ? plaintiff : defense;
    const otherSide = forPlaintiff ? defense : plaintiff;
    const friendly = (forPlaintiff && examinerRole === 'prosecutor') || (!forPlaintiff && examinerRole === 'defense');
    const q = customQuestion.trim();
    const mentionsEvidence = /EXHIBIT|E\d\d|record|report|study|document/i.test(q);

    // Phase 26: a hostile question that targets the persona's secret weakness
    // cracks the witness — they concede, and credibility takes the hit.
    const weaknessHit = !friendly && !!persona &&
      persona.weaknessKeywords.some(k => q.toLowerCase().includes(k.toLowerCase()));
    if (weaknessHit && persona) {
      return {
        question: q,
        answer: `I… will concede the point counsel is driving at. ${persona.secretWeakness} I maintain my conclusions, but yes — that limitation is real, and the court should weigh my testimony with that in mind.`,
        examinerRole,
        weaknessHit: true,
      };
    }

    const answer = friendly
      ? `That is correct. ${mentionsEvidence ? `The exhibit supports exactly that — ` : ''}my analysis of ${mySide} confirms the point counsel raises: ${caseData.claimSummary.split('.')[0]}. I stand by those findings.`
      : `I must push back on counsel's framing. ${mentionsEvidence ? `The material cited does not say what counsel implies. ` : ''}My expert assessment of ${mySide} does not support that characterization, and nothing in the record from ${otherSide} changes my professional opinion.`;
    return {
      question: q,
      answer,
      examinerRole,
      evidenceIds: mentionsEvidence ? [forPlaintiff ? 'EXHIBITP1' : 'EXHIBITD1'] : undefined,
      weaknessHit: false,
    };
  }
  
  const isHenEgg = caseData?.title?.toLowerCase().includes('hen') && caseData?.title?.toLowerCase().includes('egg');
  if (caseData && !isHenEgg) {
    const plaintiff = caseData.plaintiffSide || 'the Plaintiff';
    const defense = caseData.defenseSide || 'the Defendant';
    const pClean = plaintiff.replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0] || 'Plaintiff';
    const dClean = defense.replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0] || 'Defendant';
    
    if (witnessId === 'wit-001') {
      if (questionType === 'direct') {
        return {
          question: `Dr. ${pClean}, please describe your findings regarding ${plaintiff}.`,
          answer: `Through detailed benchmark tests, we found that ${plaintiff} provides superior efficiency and capabilities as documented in Exhibit P-1.`,
          examinerRole,
          evidenceIds: ['EXHIBITP1'],
        };
      } else if (questionType === 'cross') {
        return {
          question: `Dr. ${pClean}, is it not true that ${defense} has superior specialized attributes?`,
          answer: `While ${defense} excels in certain context conditions, the core advantages of ${plaintiff} in general usage remain unchallenged.`,
          examinerRole,
          evidenceIds: ['EXHIBITD1'],
        };
      } else {
        return {
          question: `Dr. ${pClean}, does any other system match these performance parameters?`,
          answer: `No, Your Honor. Our analysis shows ${plaintiff} maintains a distinct technical advantage.`,
          examinerRole,
          evidenceIds: ['EXHIBITP1'],
        };
      }
    } else {
      if (questionType === 'direct') {
        return {
          question: `Dr. ${dClean}, what does your study reveal about the capabilities of ${defense}?`,
          answer: `The study shows that ${defense} has exceptional context length and reasoning depth, establishing clear superiority as shown in Exhibit D-1.`,
          examinerRole,
          evidenceIds: ['EXHIBITD1'],
        };
      } else if (questionType === 'cross') {
        return {
          question: `Dr. ${dClean}, how do you address the high execution speeds of ${plaintiff}?`,
          answer: `While ${plaintiff} is fast, the depth of analysis and contextual accuracy of ${defense} represent a more critical benchmark.`,
          examinerRole,
          evidenceIds: ['EXHIBITP1'],
        };
      } else {
        return {
          question: `Dr. ${dClean}, does the data show a clear boundary?`,
          answer: `Yes, Your Honor. In complex evaluation tasks, the structural design of ${defense} consistently outperforms the alternative.`,
          examinerRole,
          evidenceIds: ['EXHIBITD1'],
        };
      }
    }
  }

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

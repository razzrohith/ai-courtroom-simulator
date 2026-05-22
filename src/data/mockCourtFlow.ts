/**
 * Mock Court Flow — Structured mock responses for each phase
 * Phase 7: Judge transitions, objection logic, improved verdict
 */

import type { CourtPhase, AgentRole, TranscriptEntry, Verdict, ObjectionEvent } from '../types/courtroom';

// Agent speaking order per phase
export const SPEAKER_ORDER: Record<CourtPhase, AgentRole[]> = {
  case_setup: [],
  court_opening: ['judge'],
  plaintiff_opening: ['prosecutor'],
  defense_opening: ['defense'],
  evidence_presentation: ['prosecutor', 'defense'],
  objection_ruling: ['judge'],
  cross_examination: ['prosecutor', 'defense'],
  witness_testimony: ['prosecutor', 'defense', 'judge'],
  motion_hearing: ['prosecutor', 'defense', 'judge'],
  jury_instructions: ['judge'],
  rebuttal: ['prosecutor', 'defense'],
  closing_arguments: ['prosecutor', 'defense'],
  judge_deliberation: ['judge'],
  verdict: ['judge'],
  case_summary: ['judge'],
};

// Judge transition messages - announced when entering new phase
export const JUDGE_TRANSITIONS: Record<CourtPhase, string> = {
  case_setup: '',
  court_opening: "The Court will now come to order. This is Case Number 2026-PHIL-001: The Hen v. The Egg: Origin Priority Dispute. This is a scientific and philosophical debate regarding which came first. Counsel, please state your appearances for the record.",
  plaintiff_opening: "Thank you, counsel. Now, Ms. Chen, you may deliver your opening statement on behalf of the plaintiff, The Hen. Jury, pay close attention.",
  defense_opening: "Thank you, Ms. Chen. Mr. Williams, you may deliver your opening statement on behalf of the defendant, The Egg.",
  evidence_presentation: "We will now move to the evidence presentation phase. The parties may present scientific arguments, theories, and studies. Counsel, approach the evidence board.",
  objection_ruling: "Before we proceed to cross-examination, the court will hear any objections to evidence already presented. Counsel, state your objections now.",
  cross_examination: "We will now move to cross-examination. Each counsel may question the other party's expert witnesses. Objections to questions must be raised immediately.",
  witness_testimony: "We will now take expert witness testimony. The court calls the expert witnesses. Counsel, you may conduct direct examination. The opposing counsel will have opportunity for cross-examination.",
  motion_hearing: "The court will now hear any motions. Counsel, if you wish to make a motion to strike, dismiss, or regarding evidence, state your motion now.",
  jury_instructions: "Before closing arguments, the Court will now instruct the jury on the law and scientific evaluation of evidence. This is a fictional simulation for educational purposes only and does not constitute legal advice.",
  rebuttal: "Now we move to the rebuttal phase. The plaintiff may respond to the defendant's evolutionary arguments. The defendant may then provide final countering points.",
  closing_arguments: "We will now hear closing arguments. Both counsel, summarize your priority claims. The court will consider all biological and evolutionary evidence.",
  judge_deliberation: "The court will now deliberate on the origin priority dispute. All rise, please. This matter is taken under advisement.",
  verdict: "The Court has reached a decision on the Hen or Egg debate. All rise for the verdict.",
  case_summary: "This concludes the proceedings. The Court will now summarize the outcome and issue its final ruling.",
};

// Phase instruction context for agents
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PHASE_INSTRUCTIONS: any = {
  case_setup: {
    judge: 'You are the judge. Begin case setup.',
    prosecutor: 'Prepare your case materials.',
    defense: 'Prepare your defense.',
  },
  court_opening: {
    judge: "You are Presiding Judge Sarah Mitchell. Open court, welcome parties, state case info, have counsel state appearances. Be formal and procedural.",
    prosecutor: "You are Attorney Rebecca Chen for The Hen. Introduce yourself. Wait for your opening statement phase.",
    defense: "You are Attorney Marcus Williams for The Egg. Introduce yourself. Wait for your opening statement phase.",
  },
  plaintiff_opening: {
    judge: "You are the judge. Listen to plaintiff's opening. Acknowledge when complete. Then invite defendant.",
    prosecutor: "Deliver a strong opening arguing that the Hen came first because a hen is required to lay the egg (living bird requirement). Cite evidence and facts.",
    defense: "Wait for your turn after plaintiff completes.",
  },
  defense_opening: {
    judge: "You are the judge. Listen to defendant's opening.",
    prosecutor: "Listen to defendant's opening. Note their claims.",
    defense: "Deliver opening arguing that the Egg came first because evolutionary genetic mutations occur in the zygote before the adult form emerges. Counter plaintiff's narrative.",
  },
  evidence_presentation: {
    judge: "You are the judge. Allow evidence introduction. Note any relevance issues. Rule on objections if raised.",
    prosecutor: "Present evidence supporting your case. Mention the living bird requirement and Exhibit P-1. Describe their significance.",
    defense: "Present evidence supporting your case. Mention the evolutionary record, egg fossil record, genetic mutation evidence, and Exhibit D-1.",
  },
  cross_examination: {
    judge: "You are the judge. Control questioning. Allow both sides to test witness credibility. Rule on objections.",
    prosecutor: "Question defendant's witness (Dr. Vance). Challenge the fossil record of hen eggs specifically.",
    defense: "Question plaintiff's witness (Dr. Rostova). Challenge the assumption that the first hen egg required a modern hen parent.",
  },
  witness_testimony: {
    judge: "You are the judge. Conduct witness examination. Allow direct and cross examination. Assess credibility.",
    prosecutor: "Call Dr. Rostova for direct examination. Ask her about the living bird requirement and OC-17 shell protein synthesis.",
    defense: "Cross-examine Dr. Rostova. Call Dr. Vance for direct examination to discuss dinosaur egg fossils and genetic mutation evidence.",
  },
  motion_hearing: {
    judge: "You are the judge. Hear motions. Consider legal basis. Rule on each motion.",
    prosecutor: "Make any necessary motions: motion to admit Exhibit P-1, motion to strike evolutionary speculation.",
    defense: "Present your motions: motion to admit Exhibit D-1, motion to dismiss plaintiff's claim.",
  },
  closing_arguments: {
    judge: "You are the judge. Listen to both summaries. Prepare to deliberate.",
    prosecutor: "Summarize the biochemical evidence showing that the egg shell requires a living hen's ovaries. Request a ruling for The Hen.",
    defense: "Summarize the evolutionary evidence showing that the egg containing the first hen had to exist before the bird. Request a ruling for The Egg.",
  },
  verdict: {
    judge: "You are the judge. Deliver verdict. State findings, analysis, ruling. Thank counsel.",
    prosecutor: "Wait for verdict.",
    defense: "Wait for verdict.",
  },
};

// Objection types with weight - higher weight = more likely to trigger
export const OBJECTION_TYPES = {
  relevance: { weight: 0.15, desc: "irrelevant" },
  hearsay: { weight: 0.12, desc: "hearsay" },
  speculation: { weight: 0.10, desc: "speculation" },
  lack_of_foundation: { weight: 0.15, desc: "lack of foundation" },
  leading: { weight: 0.10, desc: "leading" },
  argumentative: { weight: 0.08, desc: "argumentative" },
  compound: { weight: 0.05, desc: "compound question" },
  assume_facts: { weight: 0.08, desc: "assumes facts not in evidence" },
};

// Decide if an objection should occur based on phase and random chance
// Phase 7.5: More deterministic - reduce duplicates and use smarter triggers
export function shouldTriggerObjection(phase: CourtPhase, speakerTurn: number, existingObjections: ObjectionEvent[], evidenceRefs: string[]): string | null {
  // Objections most likely in evidence and cross-examination
  const likelyPhases = ['evidence_presentation', 'cross_examination'];
  if (!likelyPhases.includes(phase)) return null;
  
  // Only after speaker has said at least one substantive thing
  if (speakerTurn < 1) return null;
  
  // Don't trigger if there's already a pending objection
  const hasPending = existingObjections.some(o => o.status === 'pending');
  if (hasPending) return null;
  
  // Check recent objections to help avoid repeats (variable kept for potential future logic)
  
  // unused but available for future use
  
  // Random probability lower now
  const rand = Math.random();
  const threshold = 0.80; // ~20% chance if all conditions met
  
  if (rand > threshold) {
    // Choose objection based on whether evidence was referenced
    if (evidenceRefs.length > 0) {
      // Evidence was mentioned - might trigger relevance or foundation
      const evidenceObjTypes = ['relevance', 'lack_of_foundation', 'hearsay'];
      return evidenceObjTypes[Math.floor(Math.random() * evidenceObjTypes.length)];
    } else {
      // No evidence - might trigger procedural
      const noEvTypes = ['argumentative', 'speculation', 'leading'];
      return noEvTypes[Math.floor(Math.random() * noEvTypes.length)];
    }
  }
  return null;
}

// Get jury instructions for trial phases
export function getJuryInstruction(phase: CourtPhase): string | null {
  if (phase === 'plaintiff_opening') {
    return "Jurors, opening statements are not evidence. They are a preview of what each side intends to prove.";
  }
  if (phase === 'evidence_presentation') {
    return "Jurors, consider all evidence. Give appropriate weight. Don't decide until all is presented.";
  }
  if (phase === 'jury_instructions') {
    return "Members of the jury, this is a fictional educational simulation. The plaintiff must prove claims by preponderance. Consider all testimony and evidence. Evaluate witness credibility. Objections were ruled upon by the Court.";
  }
  if (phase === 'closing_arguments') {
    return "Jurors, closing arguments are not evidence. They are a summary of the case. Decide on the facts presented.";
  }
  return null;
}

// Mock messages for each phase and speaker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MOCK_MESSAGES: any = {
  court_opening: {
    judge: [
      "All rise. This court is now in session. The Honorable Judge Sarah Mitchell presiding.",
      "Good morning. This is Case Number 2026-PHIL-001: The Hen v. The Egg: Origin Priority Dispute.",
      "This is a scientific and philosophical debate regarding which came first.",
      "The plaintiff, The Hen, alleges that the hen must precede the egg. The defendant, The Egg, argues that evolutionary changes occur in the zygote first.",
      "Counsel, please state your appearances for the record.",
    ],
  },
  plaintiff_opening: {
    prosecutor: [
      "Your Honor, good morning. I am Attorney Rebecca Chen representing The Hen.",
      "Our case rests on biological fact. A modern chicken egg shell cannot form without the OC-17 protein, which is synthesized only inside a living hen's ovaries.",
      "Therefore, a physical egg cannot exist without a pre-existing living bird to lay it. This is the living bird requirement.",
      "We will present clear biological proof that the hen must be the initiator of the cycle.",
      "The evidence will show that The Hen came first. We ask for a ruling in our favor.",
    ],
    judge: [
      "Thank you, Ms. Chen. Mr. Williams, your opening statement?",
    ],
  },
  defense_opening: {
    defense: [
      "Your Honor, good morning. I am Attorney Marcus Williams representing The Egg.",
      "This case is about the fundamental laws of evolution and genetics.",
      "Speciation occurs when a genetic mutation happens in the zygote, which exists inside the egg.",
      "The bird that laid the first true hen egg was a close ancestor, not a modern hen itself. Thus, the egg came first.",
      "We will present evidence showing that the egg fossil record and the evolutionary record support our position.",
    ],
  },
  evidence_presentation: {
    prosecutor: [
      "Your Honor, I would like to introduce the living bird requirement as our primary argument.",
      "This is supported by Exhibit P-1, an embryology laboratory report showing the role of OC-17.",
      "Without this specific avian protein, the egg shell cannot materialize.",
      "Let the record show this exhibit has been admitted.",
    ],
    judge: [
      "So noted. The exhibit is admitted into evidence.",
      "Mr. Williams, your response?",
    ],
    defense: [
      "Your Honor, we introduce the evolutionary record and the egg fossil record.",
      "This is backed by Exhibit D-1, detailing how egg-laying species existed millions of years before hens.",
      "We also present genetic mutation evidence showing mutations occur at the zygote stage.",
    ],
    judge_2: [
      "Defense Exhibit D-1 is admitted.",
    ],
  },
  objection_ruling: {
    judge: [
      "The prosecution's objection to Defense Exhibit D-2 is noted.",
      "This court finds the evolutionary evidence relevant and admissible.",
      "The objection is overruled. The document will be considered.",
    ],
  },
  cross_examination: {
    prosecutor: [
      "Dr. Vance, does your egg fossil record show a modern chicken egg specifically?",
      "So, you admit that dinosaur eggs are not modern hen eggs?",
      "No further questions.",
    ],
    defense: [
      "Dr. Rostova, does the living bird requirement negate the fact that genetic changes occur in the zygote?",
      "So, the first chicken had to hatch from an egg laid by a pre-chicken, correct?",
      "Thank you. No further questions.",
    ],
    judge: [
      "We'll take a brief recess before closing arguments.",
    ],
  },
  rebuttal: {
    prosecutor: [
      "Your Honor, the defense argues that the zygote came first, but a zygote is not an egg shell.",
      "The egg shell is the physical entity that defines the egg, and that shell requires the hen's protein synthesis.",
      "Without the hen, the zygote has no protective egg shell and cannot survive.",
    ],
    defense: [
      "Your Honor, the shell is merely packaging. The organism itself is defined by its genome.",
      "The genetic mutation evidence proves the first true hen came from a mutated zygote.",
      "The packaging does not define the species; the genome does.",
    ],
  },
  closing_arguments: {
    prosecutor: [
      "Biochemistry dictates that the egg shell requires a living bird's ovaries.",
      "Without the hen, there is no egg. The hen is the biological initiator.",
      "We ask the court to rule in favor of the plaintiff, The Hen.",
    ],
    defense: [
      "Evolutionary genetics dictates that the genetic mutation happened in the egg.",
      "The first hen came from the first hen egg. The egg came first.",
      "We ask the court to rule in favor of the defendant, The Egg.",
    ],
  },
  judge_deliberation: {
    judge: [
      "This court will now deliberate on the priority dispute.",
      "I've reviewed all scientific evidence and heard from both parties.",
      "Key findings: The living bird requirement (OC-17) is proven biochemically, but the evolutionary record shows egg-laying preceded the hen.",
      "The genetic mutation evidence shows speciation starts in the zygote.",
      "This court will recess for deliberation.",
    ],
  },
  verdict: {
    judge: [
      "This court renders its verdict.",
      "The court finds in favor of the defendant, The Egg.",
      "The evidence shows that evolutionary genetic mutations occur at the zygote stage.",
      "Therefore, the first modern chicken had to hatch from the first modern chicken egg.",
      "Judgment is entered for the Egg, establishing origin priority.",
    ],
  },
  case_summary: {
    judge: [
      "Case Number 2026-PHIL-001 is concluded.",
      "Defendant, The Egg, is declared the winner of the origin priority dispute.",
      "This court stands adjourned.",
    ],
  },
};

// Final verdict object
export const MOCK_VERDICT: Verdict = {
  decision: 'defense_wins',
  reasoningSummary: 'The court finds that evolutionary genetic mutations defining a new species occur at the fertilization/zygote stage. Therefore, the first modern chicken had to hatch from the first modern chicken egg, which was laid by a closely related ancestor. While the plaintiff proved that egg shell protein synthesis requires the OC-17 protein found only in living hen ovaries, the biological genome defines the species, not the shell packaging.',
  plaintiffPoints: [
    'OC-17 protein required for egg shell formation is synthesized only in living hen ovaries (living bird requirement)',
    'The egg shell is a physical prerequisite for the zygote\'s survival',
  ],
  defensePoints: [
    'Amniotic egg-laying organisms existed hundreds of millions of years before the modern hen (egg fossil record)',
    'Speciation mutations occur in the zygote/fertilized egg first (genetic mutation evidence)',
    'The ancestor bird laid the first egg containing the modern hen\'s DNA profile',
  ],
  weaknesses: {
    plaintiff: ['Fails to account for genetic mutations occurring prior to the adult form', 'Confuses shell synthesis with species definition'],
    defense: ['Cannot explain how the first egg shell was formed without the OC-17 protein machinery'],
  },
  ruling: 'Judgment for the defendant. The Egg is declared to have origin priority over The Hen.',
  witnessImpact: 'Both expert witnesses provided highly credible scientific testimony. Dr. Rostova\'s biochemical analysis of OC-17 protein synthesis was undisputed. However, Dr. Vance\'s evolutionary record and genetic mutation data established that the speciation boundary is defined at the zygote stage. The court credits the defense expert\'s evolutionary logic as more legally and biologically compelling for defining the priority event.',
  juryInstructionSummary: 'Burden of proof: preponderance. Evidence consideration: biochemical vs evolutionary. Witness credibility: scientific consensus and logical consistency.',
  motionImpact: 'Plaintiff motion to strike evolutionary speculation was denied. Defense motion to admit Exhibit D-1 was granted. The evolutionary timeline was considered in full.',
  deliberationSummary: 'Deliberations focused on comparing the biochemical shell requirement with the genomic speciation model. The Court concludes that genome definition holds precedence over physical packaging machinery.',
  appealGrounds: [
    'Scientific: Disagreement on whether a shell synthesized by a non-hen ancestor can be classified as a true "chicken egg".',
    'Evidentiary: Admission of dinosaur fossil records as relevant to modern avian speciation.',
    'Procedural: Overruling of plaintiff\'s objection to genetic mutation data.',
  ],
};

// Helper to generate transcript entries from mock messages
export function generateTranscriptForPhase(
  phase: CourtPhase,
  messageIndex: number,
  speakerRole: AgentRole,
  speakerName: string,
  sequenceBase: number
): TranscriptEntry | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phaseMessages = (MOCK_MESSAGES as any)[phase];
  const messages = phaseMessages?.[speakerRole];
  if (!messages || messageIndex >= messages.length) {
    return null;
  }
  
  return {
    id: `trans-${phase}-${sequenceBase}-${speakerRole}`,
    speakerRole,
    speakerName,
    message: messages[messageIndex],
    phase,
    sequenceNumber: sequenceBase + messageIndex,
    timestamp: new Date().toISOString(),
  };
}

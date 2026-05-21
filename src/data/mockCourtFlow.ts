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
  court_opening: "The Court will now come to order. This is Case Number 2024-CV-3847: Apex Logistics Inc. v. Northstar Retail Corp. This is a civil contract dispute regarding an alleged breach of supply agreement. Counsel, please state your appearances for the record.",
  plaintiff_opening: "Thank you, counsel. Now, Ms. Chen, you may deliver your opening statement on behalf of the plaintiff. Jury, pay close attention.",
  defense_opening: "Thank you, Ms. Chen. Mr. Williams, you may deliver your opening statement on behalf of the defendant.",
  evidence_presentation: "We will now move to the evidence presentation phase. The parties may present documentary evidence and witnesses may be called. Counsel, approach the evidence board.",
  objection_ruling: "Before we proceed to cross-examination, the court will hear any objections to evidence already presented. Counsel, state your objections now.",
  cross_examination: "We will now move to cross-examination. Each counsel may question the other party's witnesses. Objections to questions must be raised immediately.",
  witness_testimony: "We will now take witness testimony. The court calls its first witness. Counsel, you may conduct direct examination. The opposing counsel will have opportunity for cross-examination.",
  motion_hearing: "The court will now hear any motions. Counsel, if you wish to make a motion to strike, dismiss, or regarding evidence, state your motion now.",
  jury_instructions: "Before closing arguments, the Court will now instruct the jury on the law. This is a fictional simulation for educational purposes only and does not constitute legal advice.",
  rebuttal: "Now we move to the rebuttal phase. The plaintiff may respond to the defendant's arguments. The defendant may then provide final countering points.",
  closing_arguments: "We will now hear closing arguments. Both counsel, summarize your positions. The court will consider all evidence and testimony presented.",
  judge_deliberation: "The court will now deliberate. All rises, please. This matter is taken under advisement.",
  verdict: "The Court has reached a decision. All rise for the verdict.",
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
    prosecutor: "You are Attorney Rebecca Chen for Apex Logistics. Introduce yourself. Wait for your opening statement phase.",
    defense: "You are Attorney Marcus Williams for Northstar Retail. Wait for your opening statement phase.",
  },
  plaintiff_opening: {
    judge: "You are the judge. Listen to plaintiff's opening. Acknowledge when complete. Then invite defendant.",
    prosecutor: "Deliver a strong opening. Cover: contract exists, deliveries made, payment refused, damages($247,500). Cite evidence IDs when relevant.",
    defense: "Wait for your turn after plaintiff completes.",
  },
  defense_opening: {
    judge: "You are the judge. Listen to defendant's opening.",
    prosecutor: "Listen to defendant's opening. Note their claims.",
    defense: "Deliver opening arguing: delays were material, contract terms violated, damages claimed are inflated. Counter plaintiff's narrative.",
  },
  evidence_presentation: {
    judge: "You are the judge. Allow evidence introduction. Note any relevance issues. Rule on objections if raised.",
    prosecutor: "Present evidence supporting your case. Reference E01, E02, E03, E04, E05. Describe each document's significance.",
    defense: "Challenge evidence validity where possible. Cross-examine plaintiff's evidence. Present your own exhibits.",
  },
  cross_examination: {
    judge: "You are the judge. Control questioning. Allow both sides to test证据 credibility. Rule on objections.",
    prosecutor: "Question defendant's witnesses. Challenge their credibility. Don't lead inappropriately.",
    defense: "Same - question plaintiff's witnesses. Challenge account of events.",
  },
  witness_testimony: {
    judge: "You are the judge. Conduct witness examination. Allow direct and cross examination. Assess credibility.",
    prosecutor: "Call your witness for direct examination. Establish key facts. Present testimony favorable to your case.",
    defense: "Cross-examine opposing witness. Challenge inconsistencies. Attack credibility.",
  },
  motion_hearing: {
    judge: "You are the judge. Hear motions. Consider legal basis. Rule on each motion.",
    prosecutor: "Make any necessary motions: motion to admit evidence, motion to exclude, motion to strike improper testimony.",
    defense: "Present your motions: motion to dismiss, motion to exclude, motion to strike.",
  },
  closing_arguments: {
    judge: "You are the judge. Listen to both summaries. Prepare to deliberate.",
    prosecutor: "Summarize strong evidence, key facts that prove breach, damages. Request judgment.",
    defense: "Summarize defense strengths, plaintiff's weaknesses. Ask for dismissal.",
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
      "Good morning. This is Case Number 2024-CV-3847: Apex Logistics Inc. v. Northstar Retail Corp.",
      "This is a civil contract dispute regarding an alleged breach of supply agreement.",
      "The plaintiff, Apex Logistics Inc., alleges the defendant, Northstar Retail Corp., wrongfully refused payment of $247,500 for delivered goods.",
      "Counsel, please state your appearances for the record.",
    ],
  },
  plaintiff_opening: {
    prosecutor: [
      "Your Honor, good morning. I am Attorney Rebecca Chen representing Apex Logistics Inc.",
      "Apex Logistics supplied electronics to Northstar Retail under a binding supply agreement.",
      "We delivered all goods. Every single shipment was received and accepted by Northstar.",
      "Yet Northstar refuses to pay $247,500—money owed for goods they accepted and sold.",
      "The evidence will show Northstar's refusal is baseless. We'll prove our case.",
    ],
    judge: [
      "Thank you, Ms. Chen. Mr. Williams, your opening statement?",
    ],
  },
  defense_opening: {
    defense: [
      "Your Honor, good morning. I am Attorney Marcus Williams representing Northstar Retail.",
      "This case is about consequences. Every contract has terms—both sides must hold up their end.",
      "Apex promised on-time delivery. They failed—consistently—for three months in a row.",
      "Apex cannot cherry-pick which contract terms to follow and expect payment anyway.",
      "We look forward to presenting our evidence that Apex materially breached this agreement.",
    ],
  },
  evidence_presentation: {
    prosecutor: [
      "Your Honor, I would like to introduce Exhibit A: the signed supply agreement.",
      "This document clearly outlines the delivery terms and payment schedule.",
      "Section 7.1 shows a valid force majeure clause that covers our April delay.",
      "Let the record show this exhibit has been admitted.",
    ],
    judge: [
      "So noted. The exhibit is admitted into evidence.",
      "Mr. Williams, your response?",
    ],
    defense: [
      "Your Honor, we would like to introduce Defense Exhibit 1: the payment refusal letter.",
      "This letter outlines our client's position and the specific breaches we allege.",
      "Northstar reserves all rights under Section 9.3 of the agreement.",
    ],
    judge_2: [
      "Defense Exhibit 1 is admitted.",
    ],
  },
  objection_ruling: {
    judge: [
      "The prosecution's objection to Defense Exhibit 2 is noted.",
      "This court finds the evidence relevant and admissible.",
      "The objection is overruled. The document will be considered.",
    ],
  },
  cross_examination: {
    prosecutor: [
      "Mr. Witness, you testified that all deliveries were late. Is that correct?",
      "Are you aware that the April delay was caused by a documented force majeure event?",
      "Would you like to revise your statement about 'consistent delays'?",
      "No further questions.",
    ],
    defense: [
      "Your Honor, I would like to question the witness about the May delivery.",
      "The May shipment arrived two days late, correct?",
      "Was there a force majeure event cited for the May delay?",
      "Thank you. No further questions.",
    ],
    judge: [
      "We'll take a brief recess before closing arguments.",
    ],
  },
  rebuttal: {
    prosecutor: [
      "Your Honor, the defense claims Apex 'consistently' breached. This is simply false.",
      "June delivery was on time—we have the signed receipt proving it.",
      "One delay, with valid documentation, is not 'consistent' breach.",
      "Northstar accepted, used, and sold our merchandise. They cannot now refuse payment.",
    ],
    defense: [
      "Your Honor, the prosecution misrepresents the facts.",
      "Three deliveries—one on time, two late—is not performance.",
      "Their own agreement specifies remedies for breach. We're exercising those rights.",
    ],
  },
  closing_arguments: {
    prosecutor: [
      "Apex fulfilled its contractual obligations. The evidence proves this.",
      "Northstar accepted $310,000 in goods and refuses to pay $247,500 owed.",
      "This court should rule in favor of Apex and award the full amount plus damages.",
      "Thank you for your time.",
    ],
    defense: [
      "Apex did not deliver on time. That's a breach—a material one.",
      "Northstar was within its rights to refuse payment.",
      "Judgment should be entered for Northstar. Thank you.",
    ],
  },
  judge_deliberation: {
    judge: [
      "This court will now deliberate on the matter.",
      "I've reviewed all evidence and heard from both parties.",
      "Key findings: One delay was documented as force majeure; one was weather-related; one was on time.",
      "Northstar accepted and used all goods—roughly $310,000 in retail value.",
      "This court will recess for deliberation.",
    ],
  },
  verdict: {
    judge: [
      "This court renders its verdict.",
      "The court finds in favor of the plaintiff, Apex Logistics Inc.",
      "The evidence shows the April delay was covered by force majeure.",
      "The defense waived their objection by accepting and selling the merchandise.",
      "Judgment is entered for Apex Logistics for $247,500 plus applicable interest.",
    ],
  },
  case_summary: {
    judge: [
      "Case Number 2024-CV-3847 is concluded.",
      "Plaintiff awarded $247,500 plus interest from July 1, 2024.",
      "Court costs are assessed to the defendant.",
      "This court stands adjourned.",
    ],
  },
};

// Final verdict object
export const MOCK_VERDICT: Verdict = {
  decision: 'plaintiff_wins',
  reasoningSummary: 'The court finds that the plaintiff properly invoked force majeure for the April delay. Furthermore, the defendant waived any breach claim by accepting and selling the goods. The defense failed to prove material breach by the plaintiff.',
  plaintiffPoints: [
    'Force majeure properly invoked for April delay',
    'All goods delivered and accepted by defendant',
    'Defendant sold merchandise worth ~$310,000',
    'June delivery was on schedule',
  ],
  defensePoints: [
    'Two of three shipments were delayed',
    'Contract specifies delivery by 15th of each month',
    'May delay was not force majeure',
  ],
  weaknesses: {
    plaintiff: ['Not all deliveries were on time', 'One delay lacked proper documentation'],
    defense: ['Failed to reject acceptance of goods', 'Accepted full value while refusing payment'],
  },
  ruling: 'Judgment for plaintiff. Defendant shall pay $247,500 plus 5% annual interest from July 1, 2024 until paid. Court costs assessed to defendant.',
  // Phase 10: Witness credibility impact
  witnessImpact: 'Both witnesses provided credible testimony. Mr. Morrison\'s testimony regarding operational constraints was corroborated by delivery logs. Ms. Patterson\'s claims regarding delay notification were found to lack sufficient documentation. The court credits the prosecution witness testimony more heavily.',
  // Phase 11: Jury and motion integration
  juryInstructionSummary: 'Burden of proof: preponderance. Evidence consideration: all testimony/documents. Witness credibility: consistency and corroboration. Objections: rulings do not penalize either party.',
  motionImpact: 'Defense motion to dismiss was denied. Prosecution motion to admit Exhibit E03 was granted. The excluded testimony was not considered for credibility.',
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

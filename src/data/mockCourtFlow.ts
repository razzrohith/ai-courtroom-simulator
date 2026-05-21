/**
 * Mock Court Flow — Structured mock responses for each phase
 */

import type { CourtPhase, AgentRole, TranscriptEntry, Verdict } from '../types/courtroom';

// Agent speaking order per phase
export const SPEAKER_ORDER: Record<CourtPhase, AgentRole[]> = {
  case_setup: [],
  court_opening: ['judge'],
  plaintiff_opening: ['prosecutor'],
  defense_opening: ['defense'],
  evidence_presentation: ['prosecutor', 'defense'],
  objection_ruling: ['judge'],
  cross_examination: ['prosecutor', 'defense'],
  rebuttal: ['prosecutor', 'defense'],
  closing_arguments: ['prosecutor', 'defense'],
  judge_deliberation: ['judge'],
  verdict: ['judge'],
  case_summary: ['judge'],
};

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

/**
 * Agent Service — Generates agent responses via provider runtime
 * Phase 7: Improved context building with phase instructions and objection awareness
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase, CourtroomContext, ObjectionEvent, CaseData } from '../types/courtroom';
import type { AgentModelConfig } from '../types/providers';
import { generateResponseWithMetadata, isProviderReady } from './runtime';
import { sanitizeAgentResponse } from '../utils/sanitizeAgentResponse';
import { PHASE_INSTRUCTIONS, getJuryInstruction } from '../data/mockCourtFlow';

/**
 * Build a trimmed context window for the agent
 * Phase 7: Includes objection history and case facts
 */
export function buildCourtroomContext(params: {
  caseSummary: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  objectionHistory?: ObjectionEvent[];
  caseKeyFacts?: string[];
}): CourtroomContext {
  const { caseSummary, phase, transcript, evidence, objectionHistory = [], caseKeyFacts = [] } = params;

  const recentTranscript = transcript.slice(-6); // More recent entries
  const relevantEvidence = evidence.filter(e => e.status !== 'pending');

  return {
    caseSummary,
    currentPhase: phase,
    recentTranscript,
    relevantEvidence,
    caseKeyFacts,
    objectionHistory,
  };
}

/**
 * Format context as prompt - improved for Phase 7
 */
export function formatContextAsPrompt(context: CourtroomContext): string {
  let prompt = '';

  prompt += `Case Overview: ${context.caseSummary}\n\n`;

  // Add case key facts if available
  if (context.caseKeyFacts && context.caseKeyFacts.length > 0) {
    prompt += `Key Facts:\n`;
    context.caseKeyFacts.slice(0, 5).forEach((fact, i) => {
      prompt += `${i + 1}. ${fact}\n`;
    });
    prompt += '\n';
  }

  prompt += `Current Phase: ${context.currentPhase}\n\n`;

  // Add recent transcript entries
  if (context.recentTranscript.length > 0) {
    prompt += 'Recent Statements:\n';
    context.recentTranscript.forEach(t => {
      const prefix = t.speakerRole === 'judge' ? 'COURT' : t.speakerRole === 'prosecutor' ? 'PLAINTIFF' : 'DEFENSE';
      prompt += `[${prefix}] ${truncate(t.message, 100)}\n`;
    });
    prompt += '\n';
  }

  // Add evidence status
  if (context.relevantEvidence.length > 0) {
    prompt += 'Evidence Status:\n';
    context.relevantEvidence.forEach(e => {
      const statusMarker = e.status === 'disputed' ? '(DISPUTED)' : e.status === 'admitted' ? '(ACCEPTED)' : `(${e.status.toUpperCase()})`;
      prompt += `- ${e.id}: ${e.title} ${statusMarker}\n`;
    });
    prompt += '\n';
  }

  // Add recent objections/rulings
  if (context.objectionHistory && context.objectionHistory.length > 0) {
    const recentObj = context.objectionHistory.slice(-3);
    prompt += 'Recent Objections:\n';
    recentObj.forEach(o => {
      const ruling = o.status === 'sustained' ? 'SUSTAINED' : o.status === 'overruled' ? 'OVERRULED' : 'PENDING';
      prompt += `- ${o.type.toUpperCase()} by ${o.raisedBy}: ${ruling}\n`;
    });
    prompt += '\n';
  }

  // Add jury instruction if relevant
  const juryInstr = getJuryInstruction(context.currentPhase);
  if (juryInstr) {
    prompt += `[JURY NOTE]: ${juryInstr}\n\n`;
  }

  return prompt;
}

function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : text.substring(0, maxLen) + '...';
}

/**
 * Get detailed phase instruction by role - Phase 7 version
 */
function getPhaseInstruction(phase: CourtPhase, role: AgentRole, caseData?: CaseData): string {
  // Try to get from mockCourtFlow first if it's the Hen/Egg preset
  const isHenEgg = caseData?.title?.toLowerCase().includes('hen') && caseData?.title?.toLowerCase().includes('egg');
  if (isHenEgg) {
    const phaseInstr = PHASE_INSTRUCTIONS as Record<string, Record<string, string>>;
    if (phaseInstr[phase]?.[role]) {
      return phaseInstr[phase][role];
    }
  }

  const plaintiffSide = caseData?.plaintiffSide || 'the Plaintiff';
  const defenseSide = caseData?.defenseSide || 'the Defendant';
  const caseTitle = caseData?.title || 'this case';

  // Fallback to simple instructions dynamically populated
  const judgeInstr = {
    case_setup: 'Confirm case is ready to proceed.',
    court_opening: `Open court formally. State the case title "${caseTitle}" and case type. Have counsel state appearances.`,
    plaintiff_opening: `Acknowledge plaintiff's opening statement. Note key points. Invite defense.`,
    defense_opening: `Acknowledge defense's opening statement. Note position. Move to evidence presentation.`,
    evidence_presentation: 'Oversee evidence introduction. Note any relevance issues. Rule on objections if raised.',
    objection_ruling: 'Rule on any objections promptly and decisively. State reasoning briefly.',
    cross_examination: 'Control questioning. Allow both sides to test witness credibility. Rule on objections.',
    witness_testimony: 'Supervise testimony. Allow examination. Assess credibility.',
    motion_hearing: 'Hear motions. Consider legal basis. Rule.',
    rebuttal: 'Allow rebuttal. Keep focused on disputed facts.',
    closing_arguments: 'Hear closing summaries. Note key arguments. Prepare deliberation.',
    judge_deliberation: `Consider all evidence and arguments for ${caseTitle}. Apply law fairly. Reach just verdict.`,
    verdict: 'Deliver verdict clearly. State reasoning and ruling. Thank counsel.',
    case_summary: 'Summarize case outcome. Thank counsel. Dismiss court.',
    jury_instructions: `Provide jury instructions on burden of proof, evidence evaluation, witness credibility, and objection treatment for the case: ${caseTitle}.`,
  } as const;

  const lawyerInstr = {
    case_setup: 'Be prepared. Know your case facts and evidence.',
    court_opening: 'Stand ready. State your appearance when recognized.',
    plaintiff_opening: `Deliver clear opening. State facts supporting ${plaintiffSide}, damages, relief sought. Engage jury.`,
    defense_opening: `Present defense position for ${defenseSide}. Counter ${plaintiffSide}'s claims.`,
    evidence_presentation: `Present compelling evidence supporting ${role === 'prosecutor' ? plaintiffSide : defenseSide}. Connect to key facts. Cite exhibits (e.g. EXHIBITP1 or EXHIBITD1).`,
    objection_ruling: 'Knowingly raise valid objections. Cite rules.',
    cross_examination: `Question opposing witness. Establish facts favorable to ${role === 'prosecutor' ? plaintiffSide : defenseSide}. Challenging credibility.`,
    witness_testimony: `Conduct direct or cross-examination. Establish key facts.`,
    motion_hearing: 'Make appropriate motions. Cite legal grounds.',
    jury_instructions: 'Listen to jury instructions. Note how they should evaluate evidence.',
    rebuttal: role === 'prosecutor' 
      ? `Counter defense arguments for ${defenseSide} with evidence. Address weaknesses.` 
      : `Counter plaintiff rebuttals. Highlight remaining key facts.`,
    closing_arguments: `Summarize favorable evidence for ${role === 'prosecutor' ? plaintiffSide : defenseSide}. Request a favorable verdict.`,
    judge_deliberation: 'Wait respectfully. Accept verdict.',
    verdict: 'Accept verdict gracefully. Thank the court.',
    case_summary: 'Express gratitude for fair proceedings.',
  };

  return role === 'judge' ? judgeInstr[phase] : lawyerInstr[phase];
}

function getFallbackMessage(role: AgentRole): string {
  switch (role) {
    case 'judge':
      return 'Thank you. The court will proceed to the next matter.';
    case 'prosecutor':
      return 'Your Honor, the plaintiff is ready to proceed.';
    case 'defense':
      return 'Your Honor, the defense is ready to respond.';
    default:
      return 'Continuing...';
  }
}

function getPersonaInstructions(role: AgentRole, caseData?: CaseData): string {
  const plaintiffSide = caseData?.plaintiffSide || 'the Plaintiff';
  const defenseSide = caseData?.defenseSide || 'the Defendant';

  const base = role === 'judge' 
    ? `You are the Presiding Judge. Remain neutral, fair, and procedural. Control the courtroom firmly but courteously. Keep arguments simple and clear.`
    : role === 'prosecutor'
    ? `You are Plaintiff Counsel representing ${plaintiffSide}. Argue simply and persuasively in plain English.`
    : `You are Defense Counsel representing ${defenseSide}. Challenge arguments and explain concepts in clear layman terms.`;

  const outputRule = `\n\nOUTPUT FORMAT RULES (CRITICAL):
- You must output ONLY the direct spoken response of your character.
- Do NOT include planning notes, introduction headers, reasoning, stage directions, or meta-commentary (e.g., do NOT output "We must keep...", "Let's craft...", "Something like:", etc.).
- Do NOT wrap your output in quotation marks or code blocks unless quoting evidence.
- Answer directly as your character.`;

  const lengthRule = `\n\nRESPONSE LENGTH & STYLE RULES:
- Keep your response brief: target 2 to 5 short sentences (maximum 80-140 words).
- Write in plain English, short, layman-friendly, and human style.
- Avoid long legalistic essays, excessive markdown, and heavy jargon.
- If discussing the case:
  * Plaintiff counsel (${plaintiffSide} side) must argue in favor of their claim and evidence.
  * Defense counsel (${defenseSide} side) must counter their points and argue in favor of their defense and evidence.
  * Judge must remain neutral, simple, and direct.`;

  const restrictions = `\n\nIMPORTANT CONSTRAINTS:\n- NEVER give legal advice outside simulation.\n- Cite evidence IDs when discussing evidence (e.g., EXHIBITP1, EXHIBITD1, E01, E02).\n- Stay in character throughout.\n- Use proper courtroom decorum.\n- This is an educational simulation - not real legal counsel.`;

  return base + outputRule + lengthRule + restrictions;
}

/**
 * Generate agent response - improved for Phase 7
 */
export async function generateAgentResponse(params: {
  role: AgentRole;
  config: AgentModelConfig;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  caseTitle: string;
  caseSummary: string;
  objectionHistory?: ObjectionEvent[];
  caseKeyFacts?: string[];
  caseData?: CaseData;
}): Promise<{
  message: string;
  providerUsed: string;
  modelUsed: string;
  responseSource: 'mock' | 'real' | 'fallback';
}> {
  const { role, config, phase, transcript, evidence, caseSummary, objectionHistory = [], caseKeyFacts = [], caseData } = params;
  const providerId = (config as any).providerId || 'mock';

  const context = buildCourtroomContext({
    caseSummary,
    phase,
    transcript,
    evidence,
    objectionHistory,
    caseKeyFacts,
  });

  const contextStr = formatContextAsPrompt(context);
  const phaseInstruction = getPhaseInstruction(phase, role, caseData);
  const persona = getPersonaInstructions(role, caseData);

  const prompt = `${persona}\n\n${contextStr}\n\nTask: ${phaseInstruction}\n\nREMINDER: You must output ONLY the direct courtroom speech of your character. Do NOT include planning notes, meta-commentary, or instructions.`;

  try {
    const ready = await isProviderReady(providerId);

    if (ready) {
      const { message } = await generateResponseWithMetadata({
        role,
        config,
        phase,
        transcript,
        evidence,
        prompt,
        caseData,
      });

      return {
        message: sanitizeAgentResponse(message) || getFallbackMessage(role),
        providerUsed: providerId,
        modelUsed: config.model,
        responseSource: 'real',
      };
    } else {
      const { message } = await generateResponseWithMetadata({
        role,
        config,
        phase,
        transcript,
        evidence,
        prompt,
        caseData,
      });

      return {
        message: sanitizeAgentResponse(message) || getFallbackMessage(role),
        providerUsed: 'mock',
        modelUsed: config.model,
        responseSource: 'fallback',
      };
    }
  } catch (error) {
    console.error(`Provider error: ${providerId}`, error);
    const { message } = await generateResponseWithMetadata({
      role,
      config,
      phase,
      transcript,
      evidence,
      prompt,
      caseData,
    });

    return {
      message: sanitizeAgentResponse(message) || getFallbackMessage(role),
      providerUsed: 'mock',
      modelUsed: config.model,
      responseSource: 'fallback',
    };
  }
}

/**
 * Parse evidence references from message text
 */
export function parseEvidenceReferences(message: string): string[] {
  const refs: string[] = [];
  
  // 1. Check for specific natural-language phrases
  const phraseMapping: Record<string, string> = {
    'evolutionary record': 'EVOLUTIONARY_RECORD',
    'egg fossil record': 'EGG_FOSSIL_RECORD',
    'living bird requirement': 'LIVING_BIRD_REQUIREMENT',
    'genetic mutation evidence': 'GENETIC_MUTATION_EVIDENCE',
    'exhibit p-1': 'EXHIBITP1',
    'exhibit p1': 'EXHIBITP1',
    'exhibit d-1': 'EXHIBITD1',
    'exhibit d1': 'EXHIBITD1',
  };

  const lowerMessage = message.toLowerCase();
  Object.entries(phraseMapping).forEach(([phrase, ref]) => {
    if (lowerMessage.includes(phrase)) {
      if (!refs.includes(ref)) {
        refs.push(ref);
      }
    }
  });

  // 2. Fall back to matching standard pattern-based matches
  // Matches e.g. E01, E1, Evidence-1, Exhibit-1, Exhibit P-1, Exhibit D-1, etc.
  const regexMatches = message.matchAll(/(?:E(?:0)?\d+|Evidence[-\s]?\d+|Ex(?:hibit)?\s?[-]?\s?(?:P|D)?\s?[-]?\d+)/gi);
  for (const match of regexMatches) {
    let raw = match[0].toUpperCase();
    let ref = raw.replace(/[-\s]/g, '');
    
    // Normalize prefix patterns
    if (ref.startsWith('EVID')) {
      const numMatch = ref.match(/\d+/);
      if (numMatch) {
        let numStr = numMatch[0];
        if (numStr.length === 1) numStr = '0' + numStr;
        ref = `E${numStr}`;
      }
    } else if (ref.startsWith('EX')) {
      // Normalize Exhibit P-1 -> EXHIBITP1
      if (ref.includes('EXHIBITP') || ref.includes('EXP')) {
        ref = 'EXHIBITP1';
      } else if (ref.includes('EXHIBITD') || ref.includes('EXD')) {
        ref = 'EXHIBITD1';
      } else {
        const numMatch = ref.match(/\d+/);
        if (numMatch) {
          let numStr = numMatch[0];
          if (numStr.length === 1) numStr = '0' + numStr;
          ref = `E${numStr}`;
        }
      }
    } else {
      // Direct E1/E01 matches
      const numMatch = ref.match(/\d+/);
      if (numMatch) {
        let numStr = numMatch[0];
        if (numStr.length === 1) numStr = '0' + numStr;
        ref = `E${numStr}`;
      }
    }

    if (!refs.includes(ref)) {
      refs.push(ref);
    }
  }

  // Prevent excessive weak evidence-card spam by limiting to 2 items per turn
  return refs.slice(0, 2);
}

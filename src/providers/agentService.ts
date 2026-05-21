/**
 * Agent Service — Generates agent responses via provider runtime
 * Phase 7: Improved context building with phase instructions and objection awareness
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase, CourtroomContext, ObjectionEvent } from '../types/courtroom';
import type { AgentModelConfig } from '../types/providers';
import { generateResponse, isProviderReady } from './runtime';
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
      const statusMarker = e.status === 'disputed' ? '(DISPUTED)' : e.status === 'accepted' ? '(ACCEPTED)' : `(${e.status.toUpperCase()})`;
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
function getPhaseInstruction(phase: CourtPhase, role: AgentRole): string {
  // Try to get from mockCourtFlow first
  const phaseInstr = PHASE_INSTRUCTIONS as Record<string, Record<string, string>>;
  if (phaseInstr[phase]?.[role]) {
    return phaseInstr[phase][role];
  }

  // Fallback to simple instructions
  const judgeInstr = {
    case_setup: 'Confirm case is ready to proceed.',
    court_opening: 'Open court formally. State case number and nature. Have counsel state appearances.',
    plaintiff_opening: 'Acknowledge plaintiff opening. Note key points. Invite defense.',
    defense_opening: 'Acknowledge defense opening. Note position. Move to evidence.',
    evidence_presentation: 'Oversee evidence introduction. Note relevance. Admit or exclude as appropriate.',
    objection_ruling: 'Rule on any objections promptly and decisively. State reasoning briefly.',
    cross_examination: 'Control questioning. Allow relevant queries. Sustain or overrule.',
    witness_testimony: 'Supervise testimony. Allow examination. Assess credibility.',
    motion_hearing: 'Hear motions. Consider legal basis. Rule.',
    rebuttal: 'Allow rebuttal. Keep focused on disputed facts.',
    closing_arguments: 'Hear closing summaries. Note key arguments. Prepare deliberation.',
    judge_deliberation: 'Consider all evidence and arguments. Apply law fairly. Reach just verdict.',
    verdict: 'Deliver verdict clearly. State reasoning. Issue final ruling.',
    case_summary: 'Summarize case outcome. Thank counsel. Dismiss court.',
    jury_instructions: 'Provide jury instructions on burden of proof, evidence evaluation, witness credibility, and objection treatment. Remind this is educational only.',
  } as const;

  const lawyerInstr = {
    case_setup: 'Be prepared. Know your case facts and evidence.',
    court_opening: 'Stand ready. State your appearance when recognized.',
    plaintiff_opening: 'Deliver clear opening. State facts, damages, relief sought. Engage jury.',
    defense_opening: 'Present defense position. Counter plaintiff claims. Question damages.',
    evidence_presentation: 'Present compelling evidence. Connect to key facts. Establish foundation.',
    objection_ruling: 'Knowingly raise valid objections. Cite rules.',
    cross_examination: 'Question effectively. Establish favourable facts. Impeach credibility.',
    witness_testimony: 'Conduct direct or cross-examination. Establish facts.',
    motion_hearing: 'Make appropriate motions. Cite legal grounds.',
    jury_instructions: 'Listen to jury instructions. Note how they should evaluate evidence.',
    rebuttal: 'Counter defense arguments with evidence. Address weaknesses.',
    closing_arguments: 'Summarize favourable evidence. Attack defense case. Request favourable verdict.',
    judge_deliberation: 'Wait respectfully. Accept verdict.',
    verdict: 'Accept verdict gracefully. Thank the court.',
    case_summary: 'Express gratitude for fair proceedings.',
  };

  return role === 'judge' ? judgeInstr[phase] : lawyerInstr[phase];
}

/**
 * Agent persona instructions - Phase 7: Stronger role adherence
 */
function getPersonaInstructions(role: AgentRole): string {
  const base = role === 'judge' 
    ? `You are the Presiding Judge. Remain neutral, fair, and Procedural. Control the courtroom firmly but courteously.`
    : role === 'prosecutor'
    ? `You are Plaintiff Counsel. Present facts persuasively. Argue vigorously for your client. Build clear narrative.`
    : `You are Defense Counsel. Challenge opposing evidence. Present alternative interpretation. Protect client interests.`;

  const restrictions = `\n\nIMPORTANT CONSTRAINTS:\n- NEVER give legal advice outside simulation.\n-Cite evidence IDs when discussing evidence (e.g., E01, E02).\n- Stay in character throughout.\n- Use proper courtroom decorum.\n- This is an educational simulation - not real legal counsel.`;

  return base + restrictions;
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
}): Promise<{
  message: string;
  providerUsed: string;
  modelUsed: string;
  responseSource: 'mock' | 'real' | 'fallback';
}> {
  const { role, config, phase, transcript, evidence, caseSummary, objectionHistory = [], caseKeyFacts = [] } = params;
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
  const phaseInstruction = getPhaseInstruction(phase, role);
  const persona = getPersonaInstructions(role);

  const prompt = `${persona}\n\n${contextStr}\n\nTask: ${phaseInstruction}`;

  try {
    const ready = await isProviderReady(providerId);

    if (ready) {
      const message = await generateResponse({
        role,
        config,
        phase,
        transcript,
        evidence,
        prompt,
      });

      return {
        message,
        providerUsed: providerId,
        modelUsed: config.model,
        responseSource: 'real',
      };
    } else {
      const msg = await generateResponse({
        role,
        config,
        phase,
        transcript,
        evidence,
        prompt,
      });

      return {
        message: msg,
        providerUsed: 'mock',
        modelUsed: config.model,
        responseSource: 'fallback',
      };
    }
  } catch (error) {
    console.error(`Provider error: ${providerId}`, error);
    const fallback = await generateResponse({
      role,
      config,
      phase,
      transcript,
      evidence,
      prompt,
    });

    return {
      message: fallback,
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
  // Match patterns like E01, E1, E02, Evidence-1, etc.
  const matches = message.matchAll(/(?:E(?:0)?\d+|Evidence[-\s]?\d+|Ex(?:hibit)?\s?[-]?\d+)/gi);
  const refs: string[] = [];
  
  for (const match of matches) {
    const ref = match[0].replace(/[-\s]/i, '').toUpperCase();
    if (!refs.includes(ref)) {
      refs.push(ref);
    }
  }
  
  return refs;
}

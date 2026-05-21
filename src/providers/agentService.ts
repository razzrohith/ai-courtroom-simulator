/**
 * Agent Service — Generates agent responses via provider runtime
 * Phase 5: Streaming support
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase, CourtroomContext } from '../types/courtroom';
import type { AgentModelConfig } from '../types/providers';
import { generateResponse, isProviderReady } from './runtime';

/**
 * Build a trimmed context window for the agent
 */
export function buildCourtroomContext(params: {
  caseSummary: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
}): CourtroomContext {
  const { caseSummary, phase, transcript, evidence } = params;

  const recentTranscript = transcript.slice(-4);
  const relevantEvidence = evidence.filter(e => e.status !== 'pending');

  return {
    caseSummary,
    currentPhase: phase,
    recentTranscript,
    relevantEvidence,
    objectionHistory: [],
  };
}

/**
 * Format context as prompt
 */
export function formatContextAsPrompt(context: CourtroomContext): string {
  let prompt = '';

  prompt += `Case: ${context.caseSummary}\n\n`;
  prompt += `Current Phase: ${context.currentPhase}\n\n`;

  if (context.recentTranscript.length > 0) {
    prompt += 'Recent statements:\n';
    context.recentTranscript.forEach(t => {
      prompt += `[${t.speakerRole}] ${truncate(t.message, 120)}\n`;
    });
    prompt += '\n';
  }

  if (context.relevantEvidence.length > 0) {
    prompt += 'Evidence:\n';
    context.relevantEvidence.forEach(e => {
      prompt += `- ${e.title} (${e.status})\n`;
    });
    prompt += '\n';
  }

  return prompt;
}

function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : text.substring(0, maxLen) + '...';
}

/**
 * Get phase instruction by role
 */
function getPhaseInstruction(phase: CourtPhase, role: AgentRole): string {
  const judgeInstr: Record<CourtPhase, string> = {
    case_setup: 'Confirm case is ready.',
    court_opening: 'Open court and call the case.',
    plaintiff_opening: 'Listen to opening.',
    defense_opening: 'Listen to defense.',
    evidence_presentation: 'Admit evidence appropriately.',
    objection_ruling: 'Rule on objections timely.',
    cross_examination: 'Oversee examination.',
    rebuttal: 'Allow rebuttal.',
    closing_arguments: 'Hear closings.',
    judge_deliberation: 'Deliberate and prepare verdict.',
    verdict: 'Deliver verdict.',
    case_summary: 'Conclude proceedings.',
  };

  const lawyerInstr: Record<CourtPhase, string> = {
    case_setup: 'Prepare your case.',
    court_opening: 'Be ready.',
    plaintiff_opening: 'State your position.',
    defense_opening: 'Present defense.',
    evidence_presentation: 'Submit evidence.',
    objection_ruling: 'Raise objections if needed.',
    cross_examination: 'Question witness.',
    rebuttal: 'Address opposing arguments.',
    closing_arguments: 'Summarize key points.',
    judge_deliberation: 'Wait for decision.',
    verdict: 'Accept verdict.',
    case_summary: 'Thank the court.',
  };

  return role === 'judge' ? judgeInstr[phase] : lawyerInstr[phase];
}

/**
 * Generate agent response
 */
export async function generateAgentResponse(params: {
  role: AgentRole;
  config: AgentModelConfig;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  caseTitle: string;
  caseSummary: string;
}): Promise<{
  message: string;
  providerUsed: string;
  modelUsed: string;
  responseSource: 'mock' | 'real' | 'fallback';
}> {
  const { role, config, phase, transcript, evidence, caseTitle:_caseTitle, caseSummary, } = params;
  const providerId = (config as any).providerId || 'mock';

  const context = buildCourtroomContext({
    caseSummary,
    phase,
    transcript,
    evidence,
  });

  const contextStr = formatContextAsPrompt(context);
  const phaseInstruction = getPhaseInstruction(phase, role);

  const prompt = `You are ${role === 'judge' ? 'the presiding Judge' : role === 'prosecutor' ? 'the Plaintiff Counsel' : 'the Defense Counsel'} in a simulated courtroom.\n\n${contextStr}${phaseInstruction}\n\nIMPORTANT: This is a simulation. Do not give real legal advice.`;

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
 * Streaming generator for incremental UI display
 * Can be called from UI layer for typewriter effect
 */
export async function* streamAgentResponse(params: {
  role: AgentRole;
  config: AgentModelConfig;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  caseTitle: string;
  caseSummary: string;
}): AsyncGenerator<{
  chunk: string;
  complete: boolean;
  providerUsed: string;
  modelUsed: string;
}> {
  const result = await generateAgentResponse(params);

  const words = result.message.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? '' : ' ') + words[i];

    yield {
      chunk: accumulated,
      complete: i === words.length - 1,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
    };

    if (i < words.length - 1) {
      await new Promise(r => setTimeout(r, 15));
    }
  }
}

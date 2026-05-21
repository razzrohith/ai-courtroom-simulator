/**
 * Agent Service — Generates agent responses via provider runtime
 * 
 * Phase 4: Runtime integration
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase } from '../types/courtroom';
import type { AgentModelConfig, ProviderId } from '../types/providers';
import { generateResponse, isProviderReady } from './runtime';

/**
 * Build prompt for agent based on current context
 */
function buildPrompt(params: {
  role: AgentRole;
  phase: CourtPhase;
  caseTitle: string;
  caseSummary: string;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
}): string {
  const { role, phase, caseTitle, caseSummary, transcript, evidence } = params;
  
  let prompt = `You are ${role === 'judge' ? 'the presiding Judge' : role === 'prosecutor' ? 'the Plaintiff/Prosecutor' : 'the Defense Attorney'} in a simulated courtroom.\n\n`;
  prompt += `Case: ${caseTitle}\n`;
  prompt += `Issue: ${caseSummary}\n\n`;
  prompt += `Current Phase: ${phase}\n\n`;
  
  // Recent transcript (last 3 entries)
  const recentTranscript = transcript.slice(-3);
  if (recentTranscript.length > 0) {
    prompt += 'Recent statements:\n';
    recentTranscript.forEach((t) => {
      prompt += `[${t.speakerRole}] ${t.message.substring(0, 150)}\n`;
    });
    prompt += '\n';
  }
  
  // Current evidence
  const currentEvidence = evidence.filter(e => e.status !== 'pending');
  if (currentEvidence.length > 0) {
    prompt += 'Evidence introduced:\n';
    currentEvidence.forEach((e) => {
      prompt += `- ${e.title} (${e.status}): ${e.summary.substring(0, 100)}\n`;
    });
    prompt += '\n';
  }
  
  // Phase-specific instruction
  prompt += getPhaseInstruction(phase);
  
  prompt += '\n\nIMPORTANT: Do not provide real legal advice. This is a simulation for educational purposes.';
  
  return prompt;
}

/**
 * Get phase-specific instruction
 */
function getPhaseInstruction(phase: CourtPhase): string {
  const instructions: Record<CourtPhase, string> = {
    case_setup: 'Confirm readiness to proceed.',
    court_opening: 'Open court and confirm the case is ready.',
    plaintiff_opening: 'Give opening statement outlining your position.',
    defense_opening: 'Give opening statement presenting your defense.',
    evidence_presentation: 'Present evidence to support your case.',
    objection_ruling: 'Rule on any objections (Judge) or raise objections (lawyers).',
    cross_examination: 'Question witnesses or challenge testimony.',
    rebuttal: 'Rebutt opposing arguments with evidence.',
    closing_arguments: 'Summarize your case and request favorable ruling.',
    judge_deliberation: 'Take time to deliberate (Judge) or wait (lawyers).',
    verdict: 'Deliver verdict (Judge) or respond (lawyers).',
    case_summary: 'Conclude proceedings.',
  };
  
  return instructions[phase];
}

/**
 * Generate agent response via provider runtime
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
  const { role, config, phase, transcript, evidence, caseTitle, caseSummary } = params;
  const providerId = config.providerId as ProviderId;
  
  const prompt = buildPrompt({
    role,
    phase,
    caseTitle,
    caseSummary,
    transcript,
    evidence,
  });
  
  // Try to generate via provider runtime
  try {
    const ready = await isProviderReady(providerId);
    
    if (ready) {
      // Try real provider
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
      // Provider not ready - fall back to mock
      const fallbackMsg = await generateResponse({
        role,
        config,
        phase,
        transcript,
        evidence,
        prompt,
      });
      
      return {
        message: fallbackMsg,
        providerUsed: 'mock',
        modelUsed: config.model,
        responseSource: 'fallback',
      };
    }
  } catch (error) {
    // Error - fall back to mock
    console.error(`Provider error for ${providerId}:`, error);
    const fallbackMsg = await generateResponse({
      role,
      config,
      phase,
      transcript,
      evidence,
      prompt,
    });
    
    return {
      message: fallbackMsg,
      providerUsed: 'mock',
      modelUsed: config.model,
      responseSource: 'fallback',
    };
  }
}

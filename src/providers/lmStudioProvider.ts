/**
 * LM Studio Provider — Local OpenAI-compatible API
 * Phase 17.5: Add LM Studio support
 */

import type { TranscriptEntry, Evidence, CourtPhase } from '../types/courtroom';
import type { AgentRole } from '../types/courtroom';

/**
 * Check if LM Studio is available
 */
export async function isLMStudioAvailable(baseUrl: string = 'http://localhost:1234'): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get LM Studio status
 */
export async function getLMStudioStatus(baseUrl: string = 'http://localhost:1234'): Promise<{ available: boolean; missingEndpoint: boolean }> {
  try {
    const available = await isLMStudioAvailable(baseUrl);
    return {
      available,
      missingEndpoint: !available,
    };
  } catch {
    return { available: false, missingEndpoint: true };
  }
}

/**
 * Build messages for chat completion
 */
function buildMessages(
  role: AgentRole,
  transcript: TranscriptEntry[],
  currentPrompt: string
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];

  // Simple system prompts per role
  let systemPrompt = '';
  switch (role) {
    case 'judge':
      systemPrompt = 'You are a fair and impartial judge presiding over a courtroom case.';
      break;
    case 'prosecutor':
      systemPrompt = 'You are a prosecutor presenting a case against the defendant.';
      break;
    case 'defense':
      systemPrompt = 'You are a defense attorney defending your client.';
      break;
  }
  messages.push({ role: 'system', content: systemPrompt });

  // Recent transcript
  const recentTranscripts = transcript.slice(-5);
  for (const entry of recentTranscripts) {
    messages.push({
      role: entry.speakerRole === 'judge' ? 'assistant' : 'user',
      content: `${entry.speakerRole}: ${entry.message}`,
    });
  }

  messages.push({ role: 'user', content: currentPrompt });
  return messages;
}

/**
 * Generate response using LM Studio API (OpenAI-compatible)
 */
export async function generateWithLMStudio(params: {
  role: AgentRole;
  model: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  prompt: string;
  baseUrl?: string;
}): Promise<string> {
  const baseUrl = params.baseUrl || 'http://localhost:1234';
  
  const { role, model, phase, transcript, evidence, prompt } = params;
  
  // Build evidence context
  const evidenceContext = evidence.length > 0 
    ? `\n\nRelevant Evidence:\n${evidence.map(e => `- ${e.title}: ${e.summary}`).join('\n')}`
    : '';
  
  const fullPrompt = `[${phase}] ${prompt}${evidenceContext}`;
  const messages = buildMessages(role, transcript, fullPrompt);

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('LM Studio generation error:', error);
    throw error;
  }
}

/**
 * List models from LM Studio
 */
export async function fetchLMStudioModels(baseUrl: string = 'http://localhost:1234'): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data?.map((m: { id: string }) => m.id) || [];
  } catch {
    return [];
  }
}

export default {
  isLMStudioAvailable,
  getLMStudioStatus,
  generateWithLMStudio,
  fetchLMStudioModels,
};
/**
 * OpenAI Provider — Direct OpenAI API provider
 * Phase 14: Direct OpenAI runtime
 */

import type { TranscriptEntry, Evidence, CourtPhase } from '../types/courtroom';
import type { AgentRole } from '../types/courtroom';
import { loadApiKey } from '../types/providers';

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured(): boolean {
  const key = loadApiKey('openai');
  return !!key && key.length > 0;
}

/**
 * Get OpenAI status
 */
export function getOpenAIStatus(): { configured: boolean; missingKey: boolean } {
  const configured = isOpenAIConfigured();
  return {
    configured,
    missingKey: !configured,
  };
}

/**
 * Build messages for chat completion from transcript
 */
function buildMessages(
  role: AgentRole,
  transcript: TranscriptEntry[],
  currentPrompt: string
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];
  
  // Add system prompt based on role
  let systemPrompt = '';
  switch (role) {
    case 'judge':
      systemPrompt = 'You are a fair and impartial judge presiding over a courtroom case. Consider all evidence and arguments before making decisions.';
      break;
    case 'prosecutor':
      systemPrompt = 'You are a prosecutor presenting a case against the defendant. Present evidence and argue for conviction.';
      break;
    case 'defense':
      systemPrompt = 'You are a defense attorney defending your client. Challenge evidence and argue for acquittal.';
      break;
  }
  messages.push({ role: 'system', content: systemPrompt });
  
  // Add relevant transcript context (last 10 entries)
  const recentTranscripts = transcript.slice(-10);
  for (const entry of recentTranscripts) {
    messages.push({
      role: entry.speakerRole === 'judge' ? 'assistant' : 'user',
      content: `${entry.speakerRole}: ${entry.message}`,
    });
  }
  
  // Add current prompt
  messages.push({ role: 'user', content: currentPrompt });
  
  return messages;
}

/**
 * Generate response using OpenAI API
 */
export async function generateWithOpenAI(params: {
  role: AgentRole;
  model: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  prompt: string;
}): Promise<string> {
  const apiKey = loadApiKey('openai');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const { role, model, phase, transcript, evidence, prompt } = params;
  
  // Build evidence context
  const evidenceContext = evidence.length > 0 
    ? `\n\nRelevant Evidence:\n${evidence.map(e => `- ${e.title}: ${e.summary}`).join('\n')}`
    : '';
  
  // Build full prompt
  const fullPrompt = `[${phase}] ${prompt}${evidenceContext}`;
  
  const messages = buildMessages(role, transcript, fullPrompt);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw error;
  }
}

/**
 * Test OpenAI connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  const apiKey = loadApiKey('openai');
  if (!apiKey) return false;

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
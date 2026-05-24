/**
 * Anthropic Provider — Direct Anthropic Claude API provider
 * Phase 14: Direct Anthropic runtime
 */

import type { TranscriptEntry, Evidence, CourtPhase, CaseData } from '../types/courtroom';
import type { AgentRole } from '../types/courtroom';
import { loadApiKey } from '../types/providers';

/**
 * Check if Anthropic API key is configured
 */
export function isAnthropicConfigured(): boolean {
  const key = loadApiKey('anthropic');
  return !!key && key.length > 0;
}

/**
 * Get Anthropic status
 */
export function getAnthropicStatus(): { configured: boolean; missingKey: boolean } {
  const configured = isAnthropicConfigured();
  return {
    configured,
    missingKey: !configured,
  };
}

/**
 * Build messages for Claude from transcript
 */
function buildMessages(
  _role: AgentRole,
  transcript: TranscriptEntry[],
  currentPrompt: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  // Add recent transcript context (last 8 entries for token savings)
  const recentTranscripts = transcript.slice(-8);
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
 * System prompt for each role
 */
function getSystemPrompt(role: AgentRole): string {
  switch (role) {
    case 'judge':
      return 'You are a fair and impartial judge presiding over a courtroom case. Consider all evidence and arguments before making rulings and decisions. Keep responses brief and professional.';
    case 'prosecutor':
      return 'You are a prosecutor presenting a case against the defendant. Present evidence clearly and argue for conviction. Be concise and impactful.';
    case 'defense':
      return 'You are a defense attorney defending your client. Challenge evidence and argue for acquittal. Be strategic and persuasive.';
  }
}

/**
 * Generate response using Anthropic API
 */
export async function generateWithAnthropic(params: {
  role: AgentRole;
  model: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  prompt: string;
  caseData?: CaseData;
}): Promise<string> {
  const apiKey = loadApiKey('anthropic');
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const { role, model, phase, transcript, evidence, prompt, caseData } = params;
  void caseData;
  
  // Build evidence context
  const evidenceContext = evidence.length > 0 
    ? `\n\nRelevant Evidence:\n${evidence.map(e => `- ${e.title}: ${e.summary}`).join('\n')}`
    : '';
  
  // Build full prompt
  const fullPrompt = `[${phase}] ${prompt}${evidenceContext}`;
  
  const messages = buildMessages(role, transcript, fullPrompt);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 220,
        temperature: 0.5,
        system: getSystemPrompt(role),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'No response generated';
  } catch (error) {
    console.error('Anthropic generation error:', error);
    throw error;
  }
}

/**
 * Test Anthropic connection
 */
export async function testAnthropicConnection(): Promise<boolean> {
  const apiKey = loadApiKey('anthropic');
  if (!apiKey) return false;

  try {
    // Test with a minimal request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      }),
    });

    // 400 means the API key works but request was malformed - that's ok for a test
    return response.ok || response.status === 400;
  } catch {
    return false;
  }
}
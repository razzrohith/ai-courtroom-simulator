/**
 * Gemini Provider — Direct Google Gemini API provider
 * Phase 14: Direct Gemini runtime
 */

import type { TranscriptEntry, Evidence, CourtPhase } from '../types/courtroom';
import type { AgentRole } from '../types/courtroom';
import { loadApiKey } from '../types/providers';

/**
 * Check if Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
  const key = loadApiKey('gemini');
  return !!key && key.length > 0;
}

/**
 * Get Gemini status
 */
export function getGeminiStatus(): { configured: boolean; missingKey: boolean } {
  const configured = isGeminiConfigured();
  return {
    configured,
    missingKey: !configured,
  };
}

/**
 * System prompt for each role
 */
function getSystemPrompt(role: AgentRole): string {
  switch (role) {
    case 'judge':
      return 'You are a fair and impartial judge presiding over a courtroom case. Consider all evidence and arguments before making rulings and decisions. Respond briefly and professionally.';
    case 'prosecutor':
      return 'You are a prosecutor presenting a case against the defendant. Present evidence clearly and argue for conviction. Be concise and impactful.';
    case 'defense':
      return 'You are a defense attorney defending your client. Challenge evidence and argue for acquittal. Be strategic and persuasive.';
  }
}

/**
 * Build content for Gemini from transcript
 */
function buildContents(
  role: AgentRole,
  transcript: TranscriptEntry[],
  currentPrompt: string
): Array<{ role: string; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  
  // Add relevant transcript context (last 8 entries)
  const recentTranscripts = transcript.slice(-8);
  for (const entry of recentTranscripts) {
    contents.push({
      role: 'model',
      parts: [{ text: `${entry.speakerRole}: ${entry.message}` }],
    });
  }
  
  // Add current prompt
  contents.push({
    role: 'user',
    parts: [{ text: getSystemPrompt(role) + '\n\n' + currentPrompt }],
  });
  
  return contents;
}

/**
 * Generate response using Gemini API
 */
export async function generateWithGemini(params: {
  role: AgentRole;
  model: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  prompt: string;
}): Promise<string> {
  const apiKey = loadApiKey('gemini');
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const { role, model, phase, transcript, evidence, prompt } = params;
  
  // Build evidence context
  const evidenceContext = evidence.length > 0 
    ? `\n\nRelevant Evidence:\n${evidence.map(e => `- ${e.title}: ${e.summary}`).join('\n')}`
    : '';
  
  // Build full prompt
  const fullPrompt = `[${phase}] ${prompt}${evidenceContext}`;
  
  const contents = buildContents(role, transcript, fullPrompt);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.95,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  } catch (error) {
    console.error('Gemini generation error:', error);
    throw error;
  }
}

/**
 * Test Gemini connection
 */
export async function testGeminiConnection(): Promise<boolean> {
  const apiKey = loadApiKey('gemini');
  if (!apiKey) return false;

  try {
    // Test with a minimal request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
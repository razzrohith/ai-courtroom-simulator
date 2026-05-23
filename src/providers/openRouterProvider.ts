/**
 * OpenRouter Provider — Real LLM API via OpenRouter
 * 
 * Phase 3: Runtime foundation
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase } from '../types/courtroom';
import { loadApiKey, loadCourtroomConfig } from '../types/providers';

// Base URL configuration
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Check if OpenRouter is configured using dynamic key storage
 */
export function isOpenRouterConfigured(): boolean {
  const apiKey = loadApiKey('openrouter');
  const hasProxy = !!import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
  return (!!apiKey && apiKey.length > 0) || hasProxy;
}

/**
 * Get status for UI display
 */
export function getOpenRouterStatus(): { label: string; ready: boolean; missingKey: boolean } {
  if (!isOpenRouterConfigured()) {
    return { label: 'OpenRouter Missing Key', ready: false, missingKey: true };
  }
  return { label: 'OpenRouter Ready', ready: true, missingKey: false };
}

// Build context for the LLM
function buildContext(params: {
  role: AgentRole;
  model: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
}): string {
  const { role, phase, transcript, evidence } = params;
  
  let context = `You are playing the role of ${role.toUpperCase()} in a courtroom simulation.\n`;
  context += `Current phase: ${phase}\n\n`;
  
  // Recent transcript context (last 5 entries)
  if (transcript.length > 0) {
    context += 'Relevant transcript:\n';
    transcript.slice(-5).forEach((t) => {
      context += `[${t.speakerRole}] ${t.message}\n`;
    });
  }
  
  // Evidence context
  if (evidence.length > 0) {
    context += '\nEvidence:\n';
    evidence.forEach((e) => {
      context += `- ${e.title} (${e.status}): ${e.summary}\n`;
    });
  }
  
  return context;
}

// Generate response using OpenRouter
export async function generateWithOpenRouter(params: {
  role: AgentRole;
  model: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  prompt: string;
}): Promise<string> {
  const config = loadCourtroomConfig();
  const agentConfig = config[params.role];
  const openRouterMode = agentConfig?.openRouterMode || 'personal';

  const apiKey = loadApiKey('openrouter');
  const proxyUrl = import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
  
  let url = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (openRouterMode === 'demo') {
    if (!proxyUrl) {
      throw new Error('Free demo gateway not configured. Use your own OpenRouter key.');
    }
    url = proxyUrl;
  } else {
    // personal mode
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured.');
    }
    url = `${OPENROUTER_BASE_URL}/chat/completions`;
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'JudgeBench';
  }

  const context = buildContext({
    role: params.role,
    model: params.model,
    phase: params.phase,
    transcript: params.transcript,
    evidence: params.evidence,
  });

  const systemPrompt = getSystemPromptForRole(params.role);
  
  try {

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: context },
          { role: 'user', content: params.prompt },
        ],
        temperature: 0.5,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenRouter');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter request error:', error);
    throw error;
  }
}

// Get system prompt based on role
function getSystemPromptForRole(role: AgentRole): string {
  const prompts: Record<AgentRole, string> = {
    judge: `You are the presiding Judge in a simulated courtroom. 
- Be neutral, fair, and impartial.
- Ask clarifying questions when needed.
- Rule on objections based on evidence and law.
- Give clear, reasoned verdicts.
- Use formal judicial language.`,

    prosecutor: `You are the Plaintiff/Prosecutor in a simulated courtroom.
- Present your case clearly and persuasively.
- Challenge evidence from the opposing side.
- Make logical arguments.
- Use appropriate legal terminology.
- Stay focused on the facts supporting your position.`,

    defense: `You are the Defense Attorney in a simulated courtroom.
- Defend your client's position.
- Challenge prosecution evidence.
- Present alternative explanations.
- Use appropriate legal strategy.
- Stay focused on weaknesses in the opposition's case.`,
  };
  
  return prompts[role];
}

/**
 * OpenRouter Provider — Real LLM API via OpenRouter
 * 
 * Phase 3: Runtime foundation
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase, CaseData } from '../types/courtroom';
import { loadApiKey, loadCourtroomConfig, setAgentConnectionStatus } from '../types/providers';

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
  caseData?: CaseData;
}): string {
  const { role, phase, transcript, evidence, caseData } = params;
  
  let context = `You are playing the role of ${role.toUpperCase()} in a courtroom simulation.\n`;
  if (caseData) {
    context += `Case Title: ${caseData.title}\n`;
    context += `Case Type: ${caseData.caseType}\n`;
    context += `Plaintiff Side: ${caseData.plaintiffSide}\n`;
    context += `Defense Side: ${caseData.defenseSide}\n`;
    context += `Claim Summary: ${caseData.claimSummary}\n\n`;
  }
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
  caseData?: CaseData;
}): Promise<string> {
  const config = loadCourtroomConfig();
  const agentConfig = config[params.role];
  const apiKey = loadApiKey('openrouter');
  const proxyUrl = import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
  const openRouterMode = agentConfig?.openRouterMode || (proxyUrl ? 'demo' : 'personal');
  
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
    caseData: params.caseData,
  });

  const systemPrompt = getSystemPromptForRole(params.role);

  // Active free models to rotate through as fallbacks (total 3 attempts max)
  const fallbackModelIds = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'google/gemma-4-31b-it:free',
    'deepseek/deepseek-v4-flash:free'
  ];

  // Build the list of models to try
  const modelsToAttempt = [params.model];
  if (openRouterMode === 'demo') {
    for (const mId of fallbackModelIds) {
      if (mId !== params.model && modelsToAttempt.length < 3) {
        modelsToAttempt.push(mId);
      }
    }
  }

  let lastError: any = null;

  for (let attempt = 0; attempt < modelsToAttempt.length; attempt++) {
    const currentModel = modelsToAttempt[attempt];
    
    // If this is a fallback attempt, update connection status to show "busy — trying another free model…"
    if (attempt > 0 && openRouterMode === 'demo') {
      setAgentConnectionStatus(
        params.role, 
        'openrouter', 
        params.model, 
        'failed:Free Demo busy — trying another free model…'
      );
      // Brief delay before the fallback attempt
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: currentModel,
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

      // If a fallback model succeeded, update status back to connected
      if (attempt > 0 && openRouterMode === 'demo') {
        setAgentConnectionStatus(
          params.role, 
          'openrouter', 
          params.model, 
          'connected'
        );
      }

      return data.choices[0].message.content;

    } catch (error) {
      console.warn(`Attempt ${attempt + 1} with model ${currentModel} failed:`, error);
      lastError = error;
      
      // If we are not in demo mode, don't try other models
      if (openRouterMode !== 'demo') {
        break;
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
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

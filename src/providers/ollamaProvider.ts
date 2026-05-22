/**
 * Ollama Provider — Local LLM via Ollama
 * 
 * Phase 3: Runtime foundation
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase } from '../types/courtroom';

// Environment configuration
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';

// Check if Ollama is available
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Get status for UI display
export async function getOllamaStatus(): Promise<{ label: string; ready: boolean; unavailable: boolean }> {
  const available = await isOllamaAvailable();
  if (!available) {
    return { label: 'Ollama Unavailable', ready: false, unavailable: true };
  }
  return { label: 'Ollama Ready', ready: true, unavailable: false };
}

// List available models
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch {
    return [];
  }
}

// Build context for the LLM
function buildContext(params: {
  role: AgentRole;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
}): string {
  const { role, phase, transcript, evidence } = params;
  
  let context = `You are role: ${role.toUpperCase()}\n`;
  context += `Phase: ${phase}\n`;
  
  if (transcript.length > 0) {
    context += 'Recent transcript:\n';
    transcript.slice(-5).forEach((t) => {
      context += `[${t.speakerRole}] ${t.message}\n`;
    });
  }
  
  if (evidence.length > 0) {
    context += '\nEvidence:\n';
    evidence.forEach((e) => {
      context += `- ${e.title}: ${e.summary}\n`;
    });
  }
  
  return context;
}

// Generate response using Ollama
export async function generateWithOllama(params: {
  role: AgentRole;
  model: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  prompt: string;
}): Promise<string> {
  const context = buildContext({
    role: params.role,
    phase: params.phase,
    transcript: params.transcript,
    evidence: params.evidence,
  });

  const systemPrompt = getSystemPromptForRole(params.role);
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: context },
          { role: 'user', content: params.prompt },
        ],
        options: {
          temperature: 0.5,
          num_predict: 220,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.message?.content) {
      throw new Error('Invalid response from Ollama');
    }

    return data.message.content;
  } catch (error) {
    console.error('Ollama request error:', error);
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

/**
 * Agent Types — Modular agent system for multi-provider support
 */

import type { AgentRole, AgentModelConfig } from '../types/courtroom';

/**
 * Base agent interface that all agents must implement
 */
export interface BaseAgent {
  id: string;
  role: AgentRole;
  name: string;
  title: string;
  modelConfig: AgentModelConfig;
  
  // Core methods
  speak(context: AgentContext): Promise<string>;
  respondToObjection(objection: ObjectionContext): Promise<string>;
}

export interface AgentContext {
  phase: string;
  transcriptSoFar: Array<{
    speakerRole: AgentRole;
    speakerName: string;
    message: string;
  }>;
  caseData: unknown; // CaseData
  evidenceRef: string[];
  objections: ObjectionContext[];
}

export interface ObjectionContext {
  id: string;
  raisedBy: AgentRole;
  type: string;
  targetMessage?: string;
  targetEvidence?: string;
}

/**
 * Provider adapter interface - implemented by each model provider
 */
export interface ModelProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly status: 'mock' | 'available' | 'planned';
  
  /**
   * Initialize the provider (load API keys, etc.)
   */
  initialize(): Promise<void>;
  
  /**
   * Generate a response from the model
   */
  generate(prompt: string, config: AgentModelConfig): Promise<string>;
  
  /**
   * Check if provider is available
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Available provider IDs
 */
export type ProviderId = 
  | 'mock'
  | 'openrouter'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'ollama'
  | 'lmstudio';

/**
 * All planned provider configurations
 */
export const PROVIDER_REGISTRY: Record<ProviderId, { name: string; status: 'mock' | 'available' | 'planned' }> = {
  mock: { name: 'Mock Provider', status: 'mock' },
  openrouter: { name: 'OpenRouter', status: 'planned' },
  openai: { name: 'OpenAI', status: 'planned' },
  anthropic: { name: 'Anthropic Claude', status: 'planned' },
  gemini: { name: 'Google Gemini', status: 'planned' },
  ollama: { name: 'Ollama (Local)', status: 'planned' },
  lmstudio: { name: 'LM Studio (Local)', status: 'planned' },
};

/**
 * Agent profile - defines personality and behavior for each role
 */
export interface AgentProfile {
  role: AgentRole;
  name: string;
  title: string;
  personality: string;
  speakingStyle: string;
  defaultModel: string;
  systemPrompt: string;
}

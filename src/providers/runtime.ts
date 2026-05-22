/**
 * Provider Runtime — Unified runtime that selects between providers
 * 
 * Phase 14: Full provider runtime with OpenAI, Anthropic, Gemini
 * Phase 17: Enhanced with token usage tracking
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase } from '../types/courtroom';
import type { AgentModelConfig, ProviderId } from '../types/providers';
import { generateMockResponse } from './mockModelProvider';
import { generateWithOpenRouter, isOpenRouterConfigured, getOpenRouterStatus } from './openRouterProvider';
import { generateWithOllama, isOllamaAvailable } from './ollamaProvider';
import { generateWithOpenAI, isOpenAIConfigured, getOpenAIStatus } from './openAIProvider';
import { generateWithAnthropic, isAnthropicConfigured, getAnthropicStatus } from './anthropicProvider';
import { generateWithGemini, isGeminiConfigured, getGeminiStatus } from './geminiProvider';
import { generateWithLMStudio, isLMStudioAvailable } from './lmStudioProvider';

/**
 * Response metadata from provider calls
 */
export interface ResponseMetadata {
  providerUsed: string;
  modelUsed: string;
  fallbackUsed: boolean;
  errorMessage?: string;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  inputCost?: number;
  outputCost?: number;
}

// Provider status for UI
export type ProviderRuntimeStatus = 
  | 'mock'
  | 'openrouter_ready'
  | 'openrouter_missing_key'
  | 'ollama_ready'
  | 'ollama_unavailable'
  | 'error_fallback_mock';

// Get current overall status
export async function getProviderRuntimeStatus(providerId: ProviderId): Promise<ProviderRuntimeStatus> {
  switch (providerId) {
    case 'mock':
      return 'mock';
      
    case 'openrouter': {
      const status = getOpenRouterStatus();
      if (status.missingKey) return 'openrouter_missing_key';
      return 'openrouter_ready';
    }
    
    case 'ollama': {
      const available = await isOllamaAvailable();
      if (!available) return 'ollama_unavailable';
      return 'ollama_ready';
    }
    
    case 'openai': {
      const status = getOpenAIStatus();
      if (status.missingKey) return 'openrouter_missing_key'; // reuse status type
      return 'openrouter_ready';
    }
    
    case 'anthropic': {
      const status = getAnthropicStatus();
      if (status.missingKey) return 'openrouter_missing_key';
      return 'openrouter_ready';
    }
    
    case 'gemini': {
      const status = getGeminiStatus();
      if (status.missingKey) return 'openrouter_missing_key';
      return 'openrouter_ready';
    }
    
    default:
      return 'error_fallback_mock';
  }
}

// Generate response using appropriate provider
export async function generateResponse(params: {
  role: AgentRole;
  config: AgentModelConfig;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  prompt: string;
}): Promise<string> {
  const { role, config, phase, prompt } = params;
  const providerId = config.providerId;
  
  // Use mock for 'mock' provider
  if (providerId === 'mock') {
    return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
  }
  
  // OpenRouter
  if (providerId === 'openrouter') {
    if (!isOpenRouterConfigured()) {
      console.warn('OpenRouter API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
    
    try {
      return await generateWithOpenRouter({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
      });
    } catch (error) {
      console.error('OpenRouter error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
  }
  
  // Ollama
  if (providerId === 'ollama') {
    const available = await isOllamaAvailable();
    if (!available) {
      console.warn('Ollama unavailable, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
    
    try {
      return await generateWithOllama({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
      });
    } catch (error) {
      console.error('Ollama error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
  }
  
  // OpenAI Direct
  if (providerId === 'openai') {
    if (!isOpenAIConfigured()) {
      console.warn('OpenAI API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
    
    try {
      return await generateWithOpenAI({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
      });
    } catch (error) {
      console.error('OpenAI error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
  }
  
  // Anthropic
  if (providerId === 'anthropic') {
    if (!isAnthropicConfigured()) {
      console.warn('Anthropic API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
    
    try {
      return await generateWithAnthropic({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
      });
    } catch (error) {
      console.error('Anthropic error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
  }
  
  // Gemini
  if (providerId === 'gemini') {
    if (!isGeminiConfigured()) {
      console.warn('Gemini API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
    
    try {
      return await generateWithGemini({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
      });
    } catch (error) {
      console.error('Gemini error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
  }
  
  // LM Studio (local)
  if (providerId === 'lmstudio') {
    const available = await isLMStudioAvailable();
    if (!available) {
      console.warn('LM Studio unavailable, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
    
    try {
      return await generateWithLMStudio({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
      });
    } catch (error) {
      console.error('LM Studio error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
    }
  }
  
  // Unknown provider, use mock
  console.warn(`Unknown provider ${providerId}, using mock`);
  return generateMockResponse({ role, phase, prompt, transcript: params.transcript });
}

// Helper to check if a provider is ready
export async function isProviderReady(providerId: ProviderId): Promise<boolean> {
  switch (providerId) {
    case 'mock':
      return true;
    case 'openrouter':
      return isOpenRouterConfigured();
    case 'ollama':
      return isOllamaAvailable();
    case 'openai':
      return isOpenAIConfigured();
    case 'anthropic':
      return isAnthropicConfigured();
    case 'gemini':
      return isGeminiConfigured();
    case 'lmstudio':
      return isLMStudioAvailable();
    default:
      return false;
  }
}

/**
 * Generate response with full metadata including token usage
 */
export async function generateResponseWithMetadata(params: {
  role: AgentRole;
  config: AgentModelConfig;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
  prompt: string;
}): Promise<{ message: string; metadata: ResponseMetadata }> {
  const { role, config, phase, transcript, evidence, prompt } = params;
  const startTime = Date.now();
  const providerId = config.providerId;
  const modelName = config.model;
  
  const message = await generateResponse({
    role,
    config,
    phase,
    transcript,
    evidence,
    prompt,
  });
  const latencyMs = Date.now() - startTime;
  
  // Determine if fallback was used
  const fallbackUsed = message.startsWith('[Mock') || message.startsWith('Mock');
  
  // Estimate token counts (basic approximation based on message length)
  const estimatedCompletion = Math.ceil(message.length / 4);
  const estimatedPrompt = Math.ceil(prompt.length / 4);
  
  const metadata: ResponseMetadata = {
    providerUsed: fallbackUsed ? 'mock' : providerId,
    modelUsed: fallbackUsed ? 'mock' : modelName,
    fallbackUsed,
    latencyMs,
    promptTokens: fallbackUsed ? undefined : estimatedPrompt,
    completionTokens: fallbackUsed ? undefined : estimatedCompletion,
    totalTokens: fallbackUsed ? undefined : (estimatedPrompt + estimatedCompletion),
  };
  
  // Add cost estimation if available
  if (!fallbackUsed && modelName) {
    const pricing = getModelPricing(modelName, providerId);
    if (pricing) {
      metadata.inputCost = (estimatedPrompt / 1_000_000) * pricing.inputPerMillion;
      metadata.outputCost = (estimatedCompletion / 1_000_000) * pricing.outputPerMillion;
    }
  }
  
  return { message, metadata };
}

/**
 * Rough pricing estimates per 1M tokens
 * In production, use actual OpenRouter pricing metadata
 */
function getModelPricing(model: string, _provider: string): { inputPerMillion: number; outputPerMillion: number } | null {
  // Free models have $0 pricing
  const freeModels = ['free', 'gpt-3.5-turbo', 'gpt-3.5-turbo-0613', 'llama-3.1-8b-instruct', 'mistral-7b-instruct'];
  const isFree = freeModels.some(f => model.toLowerCase().includes(f));
  
  if (isFree) {
    return { inputPerMillion: 0, outputPerMillion: 0 };
  }
  
  // Rough estimates for common models
  const pricing: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
    'gpt-4': { inputPerMillion: 30, outputPerMillion: 60 },
    'gpt-4-turbo': { inputPerMillion: 10, outputPerMillion: 30 },
    'gpt-4o': { inputPerMillion: 5, outputPerMillion: 15 },
    'claude-3-opus': { inputPerMillion: 15, outputPerMillion: 75 },
    'claude-3-sonnet': { inputPerMillion: 3, outputPerMillion: 15 },
    'claude-3-5-sonnet': { inputPerMillion: 3, outputPerMillion: 15 },
    'gemini-pro': { inputPerMillion: 1.25, outputPerMillion: 5 },
    'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5 },
  };
  
  for (const [key, val] of Object.entries(pricing)) {
    if (model.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  
  return null;
}

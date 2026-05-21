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
    return generateMockResponse({ role, phase, prompt });
  }
  
  // OpenRouter
  if (providerId === 'openrouter') {
    if (!isOpenRouterConfigured()) {
      console.warn('OpenRouter API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt });
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
      return generateMockResponse({ role, phase, prompt });
    }
  }
  
  // Ollama
  if (providerId === 'ollama') {
    const available = await isOllamaAvailable();
    if (!available) {
      console.warn('Ollama unavailable, falling back to mock');
      return generateMockResponse({ role, phase, prompt });
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
      return generateMockResponse({ role, phase, prompt });
    }
  }
  
  // OpenAI Direct
  if (providerId === 'openai') {
    if (!isOpenAIConfigured()) {
      console.warn('OpenAI API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt });
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
      return generateMockResponse({ role, phase, prompt });
    }
  }
  
  // Anthropic
  if (providerId === 'anthropic') {
    if (!isAnthropicConfigured()) {
      console.warn('Anthropic API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt });
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
      return generateMockResponse({ role, phase, prompt });
    }
  }
  
  // Gemini
  if (providerId === 'gemini') {
    if (!isGeminiConfigured()) {
      console.warn('Gemini API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt });
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
      return generateMockResponse({ role, phase, prompt });
    }
  }
  
  // LM Studio (local)
  if (providerId === 'lmstudio') {
    const available = await isLMStudioAvailable();
    if (!available) {
      console.warn('LM Studio unavailable, falling back to mock');
      return generateMockResponse({ role, phase, prompt });
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
      return generateMockResponse({ role, phase, prompt });
    }
  }
  
  // Unknown provider, use mock
  console.warn(`Unknown provider ${providerId}, using mock`);
  return generateMockResponse({ role, phase, prompt });
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

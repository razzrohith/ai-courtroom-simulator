/**
 * Provider Runtime — Unified runtime that selects between providers
 * 
 * Phase 14: Full provider runtime with OpenAI, Anthropic, Gemini
 * Phase 17: Enhanced with token usage tracking
 */

import type { AgentRole, TranscriptEntry, Evidence, CourtPhase, CaseData } from '../types/courtroom';
import type { AgentModelConfig, ProviderId } from '../types/providers';
import { setAgentConnectionStatus, loadApiKey } from '../types/providers';
import { generateMockResponse } from './mockModelProvider';
import { generateWithOpenRouter, isOpenRouterConfigured, getOpenRouterStatus } from './openRouterProvider';
import { generateWithOllama, isOllamaAvailable } from './ollamaProvider';
import { generateWithOpenAI, isOpenAIConfigured, getOpenAIStatus } from './openAIProvider';
import { generateWithAnthropic, isAnthropicConfigured, getAnthropicStatus } from './anthropicProvider';
import { generateWithGemini, isGeminiConfigured, getGeminiStatus } from './geminiProvider';
import { generateWithLMStudio, isLMStudioAvailable } from './lmStudioProvider';
import { recordProviderEvent } from './telemetry';

/**
 * Test a specific provider & model configuration for an agent and update status.
 */
export async function testProviderAndModel(
  role: AgentRole,
  config: AgentModelConfig
): Promise<void> {
  const providerId = config.providerId;
  if (providerId === 'mock') {
    setAgentConnectionStatus(role, providerId, config.model, 'mock');
    return;
  }

  setAgentConnectionStatus(role, providerId, config.model, 'testing');

  const testPrompt = "Reply with only: OK";
  const params = {
    role,
    model: config.model,
    phase: 'court_opening' as CourtPhase,
    transcript: [] as TranscriptEntry[],
    evidence: [] as Evidence[],
    prompt: testPrompt,
  };

  try {
    let result = '';
    switch (providerId) {
      case 'openrouter':
        result = await generateWithOpenRouter(params);
        break;
      case 'ollama': {
        result = await generateWithOllama({ ...params, prompt: testPrompt }); // ollama expects specific endpoint
        break;
      }
      case 'openai':
        result = await generateWithOpenAI(params);
        break;
      case 'anthropic':
        result = await generateWithAnthropic(params);
        break;
      case 'gemini':
        result = await generateWithGemini(params);
        break;
      case 'lmstudio': {
        const baseUrl = loadApiKey('lmstudio') || 'http://localhost:1234';
        result = await generateWithLMStudio({ ...params, baseUrl });
        break;
      }
      case 'custom-openai': {
        const baseUrl = loadApiKey('custom-openai') || 'http://localhost:1234';
        result = await generateWithLMStudio({ ...params, baseUrl });
        break;
      }
      default:
        throw new Error(`Unsupported provider: ${providerId}`);
    }

    if (!result || result.trim().length === 0) {
      throw new Error('Empty response from model');
    }

    setAgentConnectionStatus(role, providerId, config.model, 'connected');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const sanitizedMsg = errorMsg.replace(/(?:sk-|AIzaSy)[a-zA-Z0-9_-]+/g, '***REDACTED***');
    
    let failedReason = `Failed — ${sanitizedMsg}`;
    if (sanitizedMsg.toLowerCase().includes('shared key not set') || sanitizedMsg.toLowerCase().includes('proxy configuration error')) {
      failedReason = 'Failed — missing proxy secret';
    } else if (sanitizedMsg.toLowerCase().includes('api key') || sanitizedMsg.includes('401') || sanitizedMsg.includes('403') || sanitizedMsg.toLowerCase().includes('unauthorized') || sanitizedMsg.toLowerCase().includes('invalid_key')) {
      if (config.providerId === 'openrouter' && config.openRouterMode === 'demo') {
        failedReason = 'Failed — invalid proxy key';
      } else {
        failedReason = 'Failed — invalid API key';
      }
    } else if (sanitizedMsg.includes('429') || sanitizedMsg.toLowerCase().includes('rate_limited') || sanitizedMsg.toLowerCase().includes('rate-limit') || sanitizedMsg.toLowerCase().includes('too many requests')) {
      if (config.providerId === 'openrouter' && config.openRouterMode === 'demo') {
        failedReason = 'Failed — Free Demo rate-limited — try later or use your own OpenRouter key.';
      } else {
        failedReason = 'Failed — rate limited';
      }
    } else if (sanitizedMsg.toLowerCase().includes('model not found') || sanitizedMsg.includes('404') || sanitizedMsg.toLowerCase().includes('does not exist')) {
      failedReason = 'Failed — model unavailable';
    } else if (sanitizedMsg.toLowerCase().includes('timeout') || sanitizedMsg.toLowerCase().includes('fetch failed')) {
      failedReason = 'Failed — provider timeout';
    }
    
    setAgentConnectionStatus(role, providerId, config.model, `failed:${failedReason}`);
  }
}

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
  caseData?: CaseData;
}): Promise<string> {
  const { role, config, phase, prompt, caseData } = params;
  const providerId = config.providerId;
  
  // Use mock for 'mock' provider
  if (providerId === 'mock') {
    return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
  }
  
  // OpenRouter
  if (providerId === 'openrouter') {
    if (!isOpenRouterConfigured()) {
      console.warn('OpenRouter API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
    
    try {
      return await generateWithOpenRouter({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
        caseData,
      });
    } catch (error) {
      console.error('OpenRouter error, falling back to mock:', error);
      recordProviderEvent('error', 'runtime', `${role} turn fell back to mock: ${(error as Error)?.message || error}`);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
  }
  
  // Ollama
  if (providerId === 'ollama') {
    const available = await isOllamaAvailable();
    if (!available) {
      console.warn('Ollama unavailable, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
    
    try {
      return await generateWithOllama({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
        caseData,
      });
    } catch (error) {
      console.error('Ollama error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
  }
  
  // OpenAI Direct
  if (providerId === 'openai') {
    if (!isOpenAIConfigured()) {
      console.warn('OpenAI API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
    
    try {
      return await generateWithOpenAI({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
        caseData,
      });
    } catch (error) {
      console.error('OpenAI error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
  }
  
  // Anthropic
  if (providerId === 'anthropic') {
    if (!isAnthropicConfigured()) {
      console.warn('Anthropic API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
    
    try {
      return await generateWithAnthropic({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
        caseData,
      });
    } catch (error) {
      console.error('Anthropic error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
  }
  
  // Gemini
  if (providerId === 'gemini') {
    if (!isGeminiConfigured()) {
      console.warn('Gemini API key not configured, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
    
    try {
      return await generateWithGemini({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
        caseData,
      });
    } catch (error) {
      console.error('Gemini error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
  }
  
  // LM Studio (local)
  if (providerId === 'lmstudio') {
    const available = await isLMStudioAvailable();
    if (!available) {
      console.warn('LM Studio unavailable, falling back to mock');
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
    
    try {
      return await generateWithLMStudio({
        role,
        model: config.model,
        phase,
        transcript: params.transcript,
        evidence: params.evidence,
        prompt,
        caseData,
      });
    } catch (error) {
      console.error('LM Studio error, falling back to mock:', error);
      return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
    }
  }
  
  // Unknown provider, use mock
  console.warn(`Unknown provider ${providerId}, using mock`);
  return generateMockResponse({ role, phase, prompt, transcript: params.transcript, caseData });
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
  caseData?: CaseData;
}): Promise<{ message: string; metadata: ResponseMetadata }> {
  const { role, config, phase, transcript, evidence, prompt, caseData } = params;
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
    caseData,
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

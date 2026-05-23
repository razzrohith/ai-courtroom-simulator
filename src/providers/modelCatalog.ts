/**
 * Model Catalog — Dynamic model loading for providers
 * Phase 14: Live model catalogs
 */

import type { ProviderId } from '../types/providers';
import { loadApiKey } from '../types/providers';

/**
 * Model information from a catalog
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider?: string;
  contextLength?: number;
  inputPrice?: number;
  outputPrice?: number;
  isFree: boolean;
  isVision?: boolean;
  isReasoning?: boolean;
  isCoding?: boolean;
}

/**
 * OpenRouter model from API
 */
interface OpenRouterModel {
  id: string;
  name?: string;
  provider_owner?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    modality?: string[];
    function_call?: boolean;
  };
}

/**
 * OpenRouter model list response
 */
interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export const OPENROUTER_FREE_MODELS: ModelInfo[] = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (free)', provider: 'Google', isFree: true },
  { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B Instruct (free)', provider: 'Meta', isFree: true },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (free)', provider: 'Mistral', isFree: true },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi 3 Mini 128k Instruct (free)', provider: 'Microsoft', isFree: true },
  { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B Instruct (free)', provider: 'Qwen', isFree: true },
];

/**
 * Fetch models from OpenRouter catalog
 */
export async function fetchOpenRouterModels(): Promise<ModelInfo[]> {
  const apiKey = loadApiKey('openrouter');
  
  const headers: Record<string, string> = {
    'HTTP-Referer': window.location.origin,
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data: OpenRouterModelsResponse = await response.json();
    
    return data.data.map((model) => {
      const promptPrice = model.pricing?.prompt ? parseFloat(model.pricing.prompt) : 0;
      const completionPrice = model.pricing?.completion ? parseFloat(model.pricing.completion) : 0;
      const isFree = (promptPrice === 0 && completionPrice === 0) || model.id.endsWith(':free');
      
      return {
        id: model.id,
        name: model.name || model.id,
        provider: model.provider_owner,
        contextLength: model.context_length,
        inputPrice: promptPrice,
        outputPrice: completionPrice,
        isFree,
        isVision: model.architecture?.modality?.includes('image'),
        isReasoning: model.id.toLowerCase().includes('reasoning') || model.id.toLowerCase().includes('o1'),
        isCoding: model.id.toLowerCase().includes('code') || model.id.toLowerCase().includes('coder'),
      };
    });
  } catch (error) {
    console.warn('Failed to fetch live OpenRouter models, using static free models:', error);
    return OPENROUTER_FREE_MODELS;
  }
}

/**
 * Ollama model from API
 */
interface OllamaModel {
  name: string;
  size?: number;
  modified_at?: string;
}

/**
 * Ollama tags response
 */
interface OllamaTagsResponse {
  models: OllamaModel[];
}

/**
 * Fetch models from local Ollama
 */
export async function fetchOllamaModels(baseUrl: string = 'http://localhost:11434'): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Ollama unavailable: ${response.status}`);
    }

    const data: OllamaTagsResponse = await response.json();
    
    return data.models.map((model) => ({
      id: model.name,
      name: model.name,
      provider: 'ollama',
      isFree: true,
      contextLength: undefined,
      inputPrice: 0,
      outputPrice: 0,
    }));
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Ollama unavailable: Could not connect');
    }
    throw error;
  }
}

/**
 * OpenAI model from API
 */
interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

/**
 * OpenAI models response
 */
interface OpenAIModelsResponse {
  data: OpenAIModel[];
}

/**
 * Fetch models from OpenAI API
 */
export async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch models: ${response.status} - ${error}`);
  }

  const data: OpenAIModelsResponse = await response.json();
  
  // Filter toChat models only, exclude older models
  const chatModels = data.data.filter((m) => 
    m.id.startsWith('gpt-') && 
    !m.id.includes('davinci') &&
    !m.id.includes('ada')
  );

  return chatModels.map((model) => ({
    id: model.id,
    name: model.id,
    provider: 'openai',
    isFree: false,
    contextLength: undefined,
    inputPrice: 0,
    outputPrice: 0,
  }));
}

/**
 * Anthropic model list (static since no public catalog API)
 */
export const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4.0',
    provider: 'anthropic',
    contextLength: 200000,
    inputPrice: 0.003,
    outputPrice: 0.015,
    isFree: false,
    isVision: false,
  },
  {
    id: 'claude-sonnet-3-5-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextLength: 200000,
    inputPrice: 0.003,
    outputPrice: 0.015,
    isFree: false,
    isVision: true,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextLength: 200000,
    inputPrice: 0.015,
    outputPrice: 0.075,
    isFree: false,
    isVision: true,
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    contextLength: 200000,
    inputPrice: 0.003,
    outputPrice: 0.015,
    isFree: false,
    isVision: true,
  },
];

export async function fetchAnthropicModels(_apiKey: string): Promise<ModelInfo[]> {
  // Anthropic doesn't have a public models API, use static list
  return ANTHROPIC_MODELS;
}

/**
 * Gemini model list (static since authentication required for API)
 */
export const GEMINI_MODELS: ModelInfo[] = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    provider: 'gemini',
    contextLength: 1000000,
    inputPrice: 0,
    outputPrice: 0,
    isFree: true,
    isVision: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    contextLength: 2000000,
    inputPrice: 0,
    outputPrice: 0,
    isFree: true,
    isVision: true,
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    provider: 'gemini',
    contextLength: 1000000,
    inputPrice: 0,
    outputPrice: 0,
    isFree: true,
    isVision: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    contextLength: 1000000,
    inputPrice: 0,
    outputPrice: 0,
    isFree: true,
    isVision: true,
  },
];

export async function fetchGeminiModels(_apiKey: string): Promise<ModelInfo[]> {
  // Gemini requires authenticated API for model list, use static list
  return GEMINI_MODELS;
}

/**
 * Fetch models from custom OpenAI-compatible endpoint
 */
export async function fetchCustomModels(
  baseUrl: string,
  apiKey?: string | null
): Promise<ModelInfo[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/models`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Endpoint unavailable: ${response.status}`);
    }

    const data: OpenAIModelsResponse = await response.json();
    
    return data.data.map((model) => ({
      id: model.id,
      name: model.id,
      provider: 'custom',
      isFree: false,
      contextLength: undefined,
      inputPrice: 0,
      outputPrice: 0,
    }));
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Could not connect to endpoint');
    }
    throw error;
  }
}

/**
 * Cache for model catalogs
 */
const modelCache: Map<ProviderId, { models: ModelInfo[]; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedModels(providerId: ProviderId): ModelInfo[] | null {
  const cached = modelCache.get(providerId);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    modelCache.delete(providerId);
    return null;
  }
  
  return cached.models;
}

export function setCachedModels(providerId: ProviderId, models: ModelInfo[]): void {
  modelCache.set(providerId, { models, timestamp: Date.now() });
}

/**
 * Filter models by criteria
 */
export function filterModels(
  models: ModelInfo[],
  filters: {
    freeOnly?: boolean;
    paidOnly?: boolean;
    visionOnly?: boolean;
    reasoningOnly?: boolean;
    codingOnly?: boolean;
    search?: string;
  }
): ModelInfo[] {
  return models.filter((model) => {
    if (filters.freeOnly && !model.isFree) return false;
    if (filters.paidOnly && model.isFree) return false;
    if (filters.visionOnly && !model.isVision) return false;
    if (filters.reasoningOnly && !model.isReasoning) return false;
    if (filters.codingOnly && !model.isCoding) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!model.name.toLowerCase().includes(searchLower) && 
          !model.id.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });
}
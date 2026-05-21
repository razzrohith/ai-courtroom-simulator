/**
 * Model Router — Routes requests to appropriate provider adapters
 * 
 * This is the central routing layer that selects provider based on agent config.
 * Currently routes to mock provider; expand for real APIs in future.
 */

import type { IModelProvider } from './modelProviderTypes';
import type { AgentModelConfig } from '../types/courtroom';
import { mockProvider } from './mockModelProvider';

// Registry of available providers
const providers: Map<string, IModelProvider> = new Map();

// Initialize with mock provider
providers.set('mock', mockProvider);

/**
 * Get a provider by ID
 */
export function getProvider(providerId: string): IModelProvider | undefined {
  return providers.get(providerId);
}

/**
 * Register a new provider
 */
export function registerProvider(provider: IModelProvider): void {
  providers.set(provider.id, provider);
}

/**
 * Route a generation request to the appropriate provider
 * 
 * @param prompt - Input prompt
 * @param config - Agent model configuration
 * @returns Generated response
 */
export async function routeGenerate(
  prompt: string,
  config: AgentModelConfig
): Promise<string> {
  const provider = getProvider(config.provider.id);
  
  if (!provider) {
    console.warn(`Provider ${config.provider.id} not found, falling back to mock`);
    return mockProvider.generate(prompt);
  }
  
  // Check mode - only mock is functional right now
  if (config.mode === 'mock') {
    return provider.generate(prompt);
  }
  
  // For other modes (local/api), show placeholder message
  if (config.mode === 'api') {
    console.log(`[Router] API mode requested for ${config.provider.name} - using mock fallback`);
    return mockProvider.generate(prompt);
  }
  
  if (config.mode === 'local') {
    console.log(`[Router] Local mode requested for ${config.provider.name} - using mock fallback`);
    return mockProvider.generate(prompt);
  }
  
  return provider.generate(prompt);
}

/**
 * Health check all providers
 */
export async function checkAllProviders(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const [id, provider] of providers.entries()) {
    try {
      results[id] = await provider.healthCheck();
    } catch {
      results[id] = false;
    }
  }
  
  return results;
}

/**
 * Initialize all registered providers
 */
export async function initializeProviders(): Promise<void> {
  for (const [, provider] of providers.entries()) {
    try {
      await provider.initialize();
    } catch (err) {
      console.error(`Failed to initialize provider ${provider.id}:`, err);
    }
  }
}

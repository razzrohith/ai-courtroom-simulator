/**
 * Mock Model Provider — Simulated AI responses for demo/testing
 * 
 * This implements the IModelProvider interface for mock mode.
 * Replace with real provider adapters in future phases.
 */

import type { IModelProvider } from './modelProviderTypes';
import type { AgentModelConfig } from '../types/courtroom';

/**
 * Mock provider implementation
 * Returns pre-scripted responses based on agent role
 */
export class MockModelProvider implements IModelProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider';
  readonly status: 'mock' | 'available' | 'planned' = 'mock';

  private initialized = false;

  async initialize(): Promise<void> {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.initialized = true;
    console.log('[MockProvider] Initialized');
  }

  async generate(_prompt: string, config: AgentModelConfig): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // In mock mode, the actual response is determined by the court flow controller
    // This method is primarily a scaffold for the provider interface
    return `[Mock Response for ${config.model}]`;
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }
}

// Singleton instance
export const mockProvider = new MockModelProvider();

/**
 * Model Provider Types — Foundation for multi-provider support
 * 
 * This file defines the provider architecture.
 * Actual API implementations will be added in future phases.
 */


/**
 * Model Provider Adapter Interface
 * All provider adapters must implement this interface
 */
export interface IModelProvider {
  /** Unique identifier for the provider */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Current availability status */
  readonly status: 'mock' | 'available' | 'planned';
  
  /**
   * Initialize the provider
   * Load API keys, validate credentials, etc.
   */
  initialize(): Promise<void>;
  
  /**
   * Generate a response using the model
   * @param prompt - The input prompt
   * @param config - Model configuration
   * @returns Generated text response
   */
  generate(prompt: string): Promise<string>;
  
  /**
   * Check if provider is healthy/available
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Configuration for model routing
 */
export interface ModelRoutingConfig {
  /** Agent role to provider mapping */
  agentProviderMap: Record<string, ProviderConfig>;
  
  /** Default fallback provider */
  fallbackProvider?: string;
}

/**
 * Individual provider configuration
 */
export interface ProviderConfig {
  providerId: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Pre-defined provider registry
 * These are scaffolds only—no real API calls implemented yet
 */
export const PROVIDER_REGISTRY: Record<string, ProviderInfo> = {
  mock: {
    id: 'mock',
    name: 'Mock Provider',
    description: 'Simulated responses for development and testing',
    status: 'mock',
    models: ['judge-reasoner-v1', 'prosecutor-advocate-v1', 'defense-strategist-v1'],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified API for 100+ LLMs (planned)',
    status: 'planned',
    models: [],
    setupNotes: 'Requires OPENROUTER_API_KEY in environment',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4 and GPT-4o models (planned)',
    status: 'planned',
    models: ['gpt-4o', 'gpt-4-turbo'],
    setupNotes: 'Requires OPENAI_API_KEY in environment',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet and Opus (planned)',
    status: 'planned',
    models: ['claude-sonnet-5', 'claude-opus-4-8', 'claude-haiku-4-5-20251001'],
    setupNotes: 'Requires ANTHROPIC_API_KEY in environment',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro and Ultra models (planned)',
    status: 'planned',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    setupNotes: 'Requires GOOGLE_API_KEY in environment',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Local Llama and Mistral models (planned)',
    status: 'planned',
    models: ['llama3.1', 'mistral', 'codellama'],
    setupNotes: 'Requires Ollama server running locally on port 11434',
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    description: 'Local models via LM Studio API (planned)',
    status: 'planned',
    models: [],
    setupNotes: 'Requires LM Studio server running locally on port 1234',
  },
};

/**
 * Provider metadata
 */
export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  status: 'mock' | 'available' | 'planned';
  models: string[];
  setupNotes?: string;
}

/**
 * Create a default mock config for an agent
 */
export function createMockConfig(role: "judge" | "prosecutor" | "defense"): any {
  return {
    providerId: "mock",
    model: role === "judge" ? "judge-reasoner-v1" :
           role === "prosecutor" ? "prosecutor-advocate-v1" :
           "defense-strategist-v1",
    mode: "mock",
  };
}

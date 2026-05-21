/**
 * Provider Types — Enhanced provider registry and configuration types
 * 
 * Phase 2: Provider configuration foundation
 */

// All supported provider IDs
export type ProviderId = 
  | 'mock'
  | 'openrouter'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'ollama'
  | 'lmstudio'
  | 'custom-openai';

// Provider mode classification
export type ProviderMode = 'mock' | 'api-placeholder' | 'local-placeholder';

// Connection status
export type ConnectionStatus = 'connected' | 'not-connected' | 'placeholder';

// Provider registry entry
export interface ProviderRegistryEntry {
  id: ProviderId;
  label: string;
  description: string;
  mode: ProviderMode;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  defaultModels: string[];
  icon: string;
}

// Complete provider registry
export const PROVIDER_REGISTRY: Record<ProviderId, ProviderRegistryEntry> = {
  mock: {
    id: 'mock',
    label: 'Mock Provider',
    description: 'Simulated responses for testing and demos',
    mode: 'mock',
    requiresApiKey: false,
    requiresBaseUrl: false,
    defaultModels: ['judge-reasoner-v1', 'prosecutor-advocate-v1', 'defense-strategist-v1'],
    icon: '🎭',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'Unified API for 100+ LLM models (future)',
    mode: 'api-placeholder',
    requiresApiKey: true,
    requiresBaseUrl: false,
    defaultModels: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro'],
    icon: '🌐',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4 and GPT-4o models (future)',
    mode: 'api-placeholder',
    requiresApiKey: true,
    requiresBaseUrl: false,
    defaultModels: ['gpt-4o', 'gpt-4-turbo'],
    icon: '🤖',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic Claude',
    description: 'Claude 3.5 Sonnet and Opus (future)',
    mode: 'api-placeholder',
    requiresApiKey: true,
    requiresBaseUrl: false,
    defaultModels: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    icon: '🧠',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    description: ' Gemini 1.5 Pro/Flash (future)',
    mode: 'api-placeholder',
    requiresApiKey: true,
    requiresBaseUrl: false,
    defaultModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    icon: '🔮',
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama (Local)',
    description: 'Run Llama, Mistral locally (future)',
    mode: 'local-placeholder',
    requiresApiKey: false,
    requiresBaseUrl: true,
    defaultModels: ['llama3.1', 'mistral', 'codellama'],
    icon: '💻',
  },
  lmstudio: {
    id: 'lmstudio',
    label: 'LM Studio (Local)',
    description: 'Local models via LM Studio API (future)',
    mode: 'local-placeholder',
    requiresApiKey: false,
    requiresBaseUrl: true,
    defaultModels: ['llama3.1', 'mixtral'],
    icon: '📦',
  },
  'custom-openai': {
    id: 'custom-openai',
    label: 'Custom OpenAI-Compatible',
    description: 'Any OpenAI-compatible endpoint (future)',
    mode: 'api-placeholder',
    requiresApiKey: true,
    requiresBaseUrl: true,
    defaultModels: ['gpt-4'],
    icon: '⚙️',
  },
};

// Get provider entry by ID
export function getProviderEntry(id: ProviderId): ProviderRegistryEntry {
  return PROVIDER_REGISTRY[id];
}

// Get all providers for a given mode
export function getProvidersByMode(mode: ProviderMode): ProviderRegistryEntry[] {
  return Object.values(PROVIDER_REGISTRY).filter(p => p.mode === mode);
}

// Is provider placeholer only
export function isProviderPlaceholder(id: ProviderId): boolean {
  const entry = PROVIDER_REGISTRY[id];
  return entry.mode !== 'mock';
}

// Per-agent model configuration
export interface AgentModelConfig {
  providerId: ProviderId;
  model: string;
  customBaseUrl?: string;
  mode: 'mock' | 'local-placeholder' | 'api-placeholder';
}

// Courtroom model configuration (all agents)
export interface CourtroomModelConfig {
  judge: AgentModelConfig;
  prosecutor: AgentModelConfig;
  defense: AgentModelConfig;
  version: number;
  savedAt: string;
}

// Storage key
export const STORAGE_KEY = 'judgebench.agentModelConfig.v1';

// Default configuration
export const DEFAULT_MODEL_CONFIG: CourtroomModelConfig = {
  judge: {
    providerId: 'mock',
    model: 'judge-reasoner-v1',
    mode: 'mock',
  },
  prosecutor: {
    providerId: 'mock',
    model: 'prosecutor-advocate-v1',
    mode: 'mock',
  },
  defense: {
    providerId: 'mock',
    model: 'defense-strategist-v1',
    mode: 'mock',
  },
  version: 1,
  savedAt: new Date().toISOString(),
};

// Persist to localStorage
export function saveCourtroomConfig(config: CourtroomModelConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save config:', e);
  }
}

// Load from localStorage
export function loadCourtroomConfig(): CourtroomModelConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === 1) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load config:', e);
  }
  return { ...DEFAULT_MODEL_CONFIG };
}

// Reset to defaults
export function resetCourtroomConfig(): CourtroomModelConfig {
  const config = { ...DEFAULT_MODEL_CONFIG, savedAt: new Date().toISOString() };
  saveCourtroomConfig(config);
  return config;
}

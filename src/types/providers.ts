/**
 * Provider Types — Enhanced provider registry and configuration types
 * 
 * Phase 13.5: Provider connection system and API key management
 */

import type { AgentRole } from './courtroom';

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

// Provider category for classification
export type ProviderCategory = 'mock' | 'aggregator' | 'direct-api' | 'local' | 'custom';

// Provider mode classification (backward compat)
export type ProviderMode = 'mock' | 'api' | 'local';

// Connection status
export type ConnectionStatus = 'connected' | 'not-connected' | 'error' | 'checking';

// Provider registry entry with enhanced metadata
export interface ProviderRegistryEntry {
  id: ProviderId;
  label: string;
  description: string;
  category: ProviderCategory;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  supportsModelCatalog: boolean;
  supportsFreeModels: boolean;
  defaultModels: string[];
  icon: string;
  status: string;
  docsUrl?: string;
}

// Complete provider registry
export const PROVIDER_REGISTRY: Record<ProviderId, ProviderRegistryEntry> = {
  mock: {
    id: 'mock',
    label: 'Mock Provider',
    description: 'Simulated responses for testing and demos. No API key required.',
    category: 'mock',
    requiresApiKey: false,
    requiresBaseUrl: false,
    supportsModelCatalog: false,
    supportsFreeModels: true,
    defaultModels: ['judge-reasoner-v1', 'prosecutor-advocate-v1', 'defense-strategist-v1'],
    icon: '',
    status: 'Mock mode active. No API key required.',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'Unified API for 100+ LLM models. Dynamic model catalog available.',
    category: 'aggregator',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsModelCatalog: true,
    supportsFreeModels: true,
    defaultModels: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro'],
    icon: '',
    status: 'Connected if API key is configured. Supports dynamic model catalog.',
    docsUrl: 'https://openrouter.ai/docs',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI API',
    description: 'Direct OpenAI API provider. Requires API key.',
    category: 'direct-api',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsModelCatalog: true,
    supportsFreeModels: false,
    defaultModels: ['gpt-4o', 'gpt-4-turbo'],
    icon: '',
    status: 'Direct OpenAI API provider. Requires API key.',
    docsUrl: 'https://platform.openai.com/docs',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic Claude API',
    description: 'Direct Claude API provider. Requires API key.',
    category: 'direct-api',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsModelCatalog: false,
    supportsFreeModels: false,
    defaultModels: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    icon: '',
    status: 'Direct Claude API provider. Requires API key.',
    docsUrl: 'https://docs.anthropic.com',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini API',
    description: 'Direct Gemini API provider. Requires API key.',
    category: 'direct-api',
    requiresApiKey: true,
    requiresBaseUrl: false,
    supportsModelCatalog: true,
    supportsFreeModels: true,
    defaultModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    icon: '',
    status: 'Direct Gemini API provider. Requires API key.',
    docsUrl: 'https://ai.google.dev/docs',
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama (Local)',
    description: 'Run Llama, Mistral locally. Requires Ollama running.',
    category: 'local',
    requiresApiKey: false,
    requiresBaseUrl: true,
    supportsModelCatalog: true,
    supportsFreeModels: true,
    defaultModels: ['llama3.1', 'mistral', 'codellama'],
    icon: '',
    status: 'Local provider. Requires Ollama running locally.',
    docsUrl: 'https://github.com/ollama/ollama',
  },
  lmstudio: {
    id: 'lmstudio',
    label: 'LM Studio (Local)',
    description: 'Local models via LM Studio API. OpenAI-compatible.',
    category: 'local',
    requiresApiKey: false,
    requiresBaseUrl: true,
    supportsModelCatalog: true,
    supportsFreeModels: true,
    defaultModels: ['llama3.1', 'mixtral'],
    icon: '',
    status: 'OpenAI-compatible local/custom endpoint.',
    docsUrl: 'https://lmstudio.ai',
  },
  'custom-openai': {
    id: 'custom-openai',
    label: 'Custom OpenAI-Compatible',
    description: 'Any OpenAI-compatible endpoint. Requires base URL.',
    category: 'custom',
    requiresApiKey: true,
    requiresBaseUrl: true,
    supportsModelCatalog: false,
    supportsFreeModels: false,
    defaultModels: ['gpt-4'],
    icon: '',
    status: 'OpenAI-compatible local/custom endpoint.',
  },
};

// Get provider entry by ID
export function getProviderEntry(id: ProviderId): ProviderRegistryEntry {
  return PROVIDER_REGISTRY[id];
}

// Get all providers for a given category
export function getProvidersByCategory(category: ProviderCategory): ProviderRegistryEntry[] {
  return Object.values(PROVIDER_REGISTRY).filter(p => p.category === category);
}

// Is provider placeholder only
export function isProviderPlaceholder(id: ProviderId): boolean {
  const entry = PROVIDER_REGISTRY[id];
  if (!entry) return false;
  return entry.category !== 'mock';
}

// Per-agent model configuration
export interface AgentModelConfig {
  providerId: ProviderId;
  model: string;
  customBaseUrl?: string;
  mode: 'mock' | 'local' | 'api';
  openRouterMode?: 'demo' | 'personal';
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

const hasProxy = !!import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;

// Default configuration
export const DEFAULT_MODEL_CONFIG: CourtroomModelConfig = {
  judge: hasProxy ? {
    providerId: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    mode: 'api',
  } : {
    providerId: 'mock',
    model: 'judge-reasoner-v1',
    mode: 'mock',
  },
  prosecutor: hasProxy ? {
    providerId: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    mode: 'api',
  } : {
    providerId: 'mock',
    model: 'prosecutor-advocate-v1',
    mode: 'mock',
  },
  defense: hasProxy ? {
    providerId: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    mode: 'api',
  } : {
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
      if (parsed && typeof parsed === 'object') {
        // Upgrade/migration path for old localStorage schemas
        const migrated = { ...parsed };
        const roles = ['judge', 'prosecutor', 'defense'] as const;
        let needsMigration = false;

        roles.forEach((role) => {
          if (migrated[role] && typeof migrated[role] === 'object') {
            const agentConfig = { ...migrated[role] };
            // Handle migration from old provider object to providerId
            if (!agentConfig.providerId && agentConfig.provider && typeof agentConfig.provider === 'object') {
              agentConfig.providerId = agentConfig.provider.id || 'mock';
              needsMigration = true;
            }
            // Ensure providerId exists
            if (!agentConfig.providerId) {
              agentConfig.providerId = 'mock';
              needsMigration = true;
            }
            // Ensure model exists
            if (!agentConfig.model) {
              agentConfig.model = DEFAULT_MODEL_CONFIG[role].model;
              needsMigration = true;
            }
            // Ensure mode exists
            if (!agentConfig.mode) {
              agentConfig.mode = DEFAULT_MODEL_CONFIG[role].mode;
              needsMigration = true;
            }
            // Ensure openRouterMode exists
            if (!agentConfig.openRouterMode) {
              agentConfig.openRouterMode = hasProxy ? 'demo' : 'personal';
              needsMigration = true;
            }
            migrated[role] = agentConfig;
          } else {
            // Missing agent config entirely
            migrated[role] = { ...DEFAULT_MODEL_CONFIG[role] };
            needsMigration = true;
          }
        });

        if (!migrated.version) {
          migrated.version = 1;
          needsMigration = true;
        }

        if (needsMigration) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          } catch (e) {
            console.warn('Failed to save migrated config:', e);
          }
        }
        return migrated as CourtroomModelConfig;
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

// =====================================================
// Phase 13.5: API Key Storage System
// =====================================================

// Storage keys for provider API keys
export const API_KEY_STORAGE_KEYS: Record<ProviderId, string> = {
  mock: '',
  openrouter: 'judgebench.openrouter.apiKey',
  openai: 'judgebench.openai.apiKey',
  anthropic: 'judgebench.anthropic.apiKey',
  gemini: 'judgebench.gemini.apiKey',
  ollama: 'judgebench.ollama.baseUrl',
  lmstudio: 'judgebench.lmstudio.baseUrl',
  'custom-openai': 'judgebench.custom.endpoint',
};

// Get masked API key for display (shows only first 4 and last 4 chars)
export function maskApiKey(key: string | null | undefined): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

// Save API key to sessionStorage (default) or localStorage (remember option)
export function saveApiKey(providerId: ProviderId, key: string, remember: boolean = false): void {
  const storageKey = API_KEY_STORAGE_KEYS[providerId];
  if (!storageKey) return;
  
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(storageKey, key);
}

// Load API key from sessionStorage or localStorage
// Note: To use environment variables, set VITE_* vars in .env file
export function loadApiKey(providerId: ProviderId): string | null {
  const storageKey = API_KEY_STORAGE_KEYS[providerId];
  if (!storageKey) return null;
  
  // Check sessionStorage first (more secure, session-only)
  const sessionVal = sessionStorage.getItem(storageKey);
  if (sessionVal) return sessionVal;
  
  // Check localStorage for persistent storage (less secure)
  const localVal = localStorage.getItem(storageKey);
  if (localVal) return localVal;
  
  return null;
}

// Clear API key from all storage
export function clearApiKey(providerId: ProviderId): void {
  const storageKey = API_KEY_STORAGE_KEYS[providerId];
  if (!storageKey) return;
  
  sessionStorage.removeItem(storageKey);
  localStorage.removeItem(storageKey);
}

// Check if API key exists
export function hasApiKey(providerId: ProviderId): boolean {
  return !!loadApiKey(providerId);
}

// Check if provider is configured
export function isProviderConfigured(providerId: ProviderId): boolean {
  const entry = PROVIDER_REGISTRY[providerId];
  if (!entry) return false;
  
  if (providerId === 'openrouter') {
    return hasApiKey('openrouter') || !!import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
  }
  if (entry.requiresApiKey) {
    return hasApiKey(providerId);
  }
  if (entry.requiresBaseUrl) {
    const url = loadApiKey(providerId);
    return !!(url && url.length > 0);
  }
  return true;
}

export type AgentConnectionStatus = 
  | 'mock'
  | 'missing-key'
  | 'not-tested'
  | 'testing'
  | 'connected'
  | 'fallback'
  | 'failed'
  | 'free-demo-ready'
  | 'free-demo-unavailable'
  | 'personal-api-ready';

export function getAgentConnectionStatus(
  role: AgentRole, 
  config?: AgentModelConfig
): AgentConnectionStatus {
  if (!config || !config.providerId || config.providerId === 'mock') {
    return 'mock';
  }
  
  if (config.providerId === 'openrouter') {
    const personalKeyExists = hasApiKey('openrouter');
    const hasProxy = !!import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
    const mode = config.openRouterMode || (hasProxy ? 'demo' : 'personal');

    if (mode === 'demo') {
      if (!hasProxy) {
        return 'free-demo-unavailable';
      }
      try {
        const key = `judgebench.status.${role}.${config.providerId}.${config.model}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          if (stored === 'connected') {
            return 'free-demo-ready';
          }
          if (stored.startsWith('failed:')) {
            return 'failed';
          }
          if (stored === 'testing' || stored === 'not-tested') {
            return stored as AgentConnectionStatus;
          }
        }
      } catch (e) {
        console.warn('Failed to load status:', e);
      }
      return 'free-demo-ready';
    } else {
      // personal mode
      if (!personalKeyExists) {
        return 'missing-key';
      }
      try {
        const key = `judgebench.status.${role}.${config.providerId}.${config.model}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          if (stored === 'connected') {
            return 'personal-api-ready';
          }
          if (stored.startsWith('failed:')) {
            return 'failed';
          }
          if (stored === 'testing' || stored === 'not-tested') {
            return stored as AgentConnectionStatus;
          }
        }
      } catch (e) {
        console.warn('Failed to load status:', e);
      }
      return 'personal-api-ready';
    }
  }
  
  if (!isProviderConfigured(config.providerId)) {
    return 'missing-key';
  }
  
  // Load from localStorage status cache
  try {
    const key = `judgebench.status.${role}.${config.providerId}.${config.model}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      if (stored === 'connected') {
        return 'personal-api-ready';
      }
      if (stored === 'fallback' || stored === 'testing' || stored === 'not-tested' || stored === 'failed') {
        return stored as AgentConnectionStatus;
      }
      if (stored.startsWith('failed:')) {
        return 'failed';
      }
    }
  } catch (e) {
    console.warn('Failed to load status:', e);
  }

  return 'personal-api-ready';
}

export function getAgentStatusError(
  role: AgentRole,
  config?: AgentModelConfig
): string | undefined {
  if (!config || !config.providerId || config.providerId === 'mock') {
    return undefined;
  }
  try {
    const key = `judgebench.status.${role}.${config.providerId}.${config.model}`;
    const stored = localStorage.getItem(key);
    if (stored && stored.startsWith('failed:')) {
      return stored.substring(7);
    }
  } catch (e) {
    console.warn('Failed to load status:', e);
  }
  return undefined;
}

export function setAgentConnectionStatus(
  role: AgentRole,
  providerId: ProviderId,
  model: string,
  status: 'connected' | 'fallback' | 'testing' | 'not-tested' | 'failed' | string
): void {
  try {
    const key = `judgebench.status.${role}.${providerId}.${model}`;
    localStorage.setItem(key, status);
    
    // Dispatch a storage event or a custom event to notify other components/windows
    window.dispatchEvent(new Event('judgebench-provider-status-changed'));
  } catch (e) {
    console.warn('Failed to save status:', e);
  }
}

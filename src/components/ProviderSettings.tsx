/**
 * ProviderSettings — Provider configuration with live model catalogs
 * Phase 14: Full provider runtime, dynamic model loading
 */

import { useState, useEffect, useCallback } from 'react';
import type { AgentRole } from '../types/courtroom';
import type { AgentModelConfig, CourtroomModelConfig, ProviderId, ProviderRegistryEntry } from '../types/providers';
import { 
  PROVIDER_REGISTRY, 
  DEFAULT_MODEL_CONFIG,
  saveCourtroomConfig, 
  loadCourtroomConfig,
  resetCourtroomConfig,
  getProviderEntry,
  saveApiKey,
  loadApiKey,
  clearApiKey,
  maskApiKey,
  isProviderConfigured,
} from '../types/providers';
import { 
  fetchOpenRouterModels, 
  fetchOllamaModels, 
  fetchOpenAIModels,
  fetchAnthropicModels,
  fetchGeminiModels,
  fetchCustomModels,
  getCachedModels,
  setCachedModels,
  filterModels,
  type ModelInfo 
} from '../providers/modelCatalog';

interface ProviderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AGENT_LABELS: Record<AgentRole, string> = {
  judge: 'Judge',
  prosecutor: 'Prosecutor',
  defense: 'Defense',
};

const STATUS_BADGES = {
  connected: { bg: 'bg-green-900/50', text: 'text-green-400', label: 'Connected' },
  missing: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Not configured' },
  loading: { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'Loading...' },
  error: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Error' },
};

// Default models per provider (fallback)
const DEFAULT_MODELS: Record<ProviderId, string[]> = {
  mock: ['judge-reasoner-v1', 'prosecutor-advocate-v1', 'defense-strategist-v1'],
  openrouter: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro'],
  openai: ['gpt-4o', 'gpt-4-turbo'],
  anthropic: ['claude-sonnet-3.5-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  ollama: ['llama3.1', 'mistral', 'codellama'],
  lmstudio: ['llama3.1', 'mixtral'],
  'custom-openai': ['gpt-4'],
};

export function ProviderSettings({ isOpen, onClose }: ProviderSettingsProps) {
  const [config, setConfig] = useState<CourtroomModelConfig>(DEFAULT_MODEL_CONFIG);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'api-keys'>('agents');
  const [keyInput, setKeyInput] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  
  // Model catalog state
  const [modelsLoading, setModelsLoading] = useState<Record<ProviderId, boolean>>({
    mock: false,
    openrouter: false,
    openai: false,
    anthropic: false,
    gemini: false,
    ollama: false,
    lmstudio: false,
    'custom-openai': false,
  });
  const [modelsError, setModelsError] = useState<Record<ProviderId, string>>({
    mock: '',
    openrouter: '',
    openai: '',
    anthropic: '',
    gemini: '',
    ollama: '',
    lmstudio: '',
    'custom-openai': '',
  });
  const [modelCache, setModelCache] = useState<Record<ProviderId, ModelInfo[]>>({
    mock: [],
    openrouter: [],
    openai: [],
    anthropic: [],
    gemini: [],
    ollama: [],
    lmstudio: [],
    'custom-openai': [],
  });
  
  // Filter state
  const [modelFilters, setModelFilters] = useState({
    freeOnly: false,
    paidOnly: false,
    visionOnly: false,
    search: '',
  });

  const [connectionStatus, setConnectionStatus] = useState<Record<ProviderId, 'connected' | 'missing'>>({
    mock: 'connected',
    openrouter: 'missing',
    openai: 'missing',
    anthropic: 'missing',
    gemini: 'missing',
    ollama: 'missing',
    lmstudio: 'missing',
    'custom-openai': 'missing',
  });

  useEffect(() => {
    if (!isOpen) return;
    const loaded = loadCourtroomConfig();
    setConfig(loaded);
    
    const newStatus: Record<ProviderId, 'connected' | 'missing'> = {} as typeof connectionStatus;
    (Object.keys(PROVIDER_REGISTRY) as ProviderId[]).forEach(pid => {
      newStatus[pid] = isProviderConfigured(pid) ? 'connected' : 'missing';
    });
    setConnectionStatus(newStatus);
  }, [isOpen]);

  const handleSave = useCallback(() => {
    const updated = { ...config, savedAt: new Date().toISOString() };
    saveCourtroomConfig(updated);
    setConfig(updated);
    setIsDirty(false);
  }, [config]);

  const handleReset = useCallback(() => {
    const reset = resetCourtroomConfig();
    setConfig(reset);
    setIsDirty(false);
  }, []);

  const handleSaveApiKey = useCallback((providerId: ProviderId) => {
    if (keyInput.trim()) {
      saveApiKey(providerId, keyInput.trim(), rememberKey);
      setConnectionStatus(prev => ({ ...prev, [providerId]: 'connected' }));
      setKeyInput('');
    }
  }, [keyInput, rememberKey]);

  const handleClearApiKey = useCallback((providerId: ProviderId) => {
    clearApiKey(providerId);
    setConnectionStatus(prev => ({ ...prev, [providerId]: 'missing' }));
  }, []);

  const getDisplayKey = useCallback((providerId: ProviderId): string => {
    const key = loadApiKey(providerId);
    return key ? maskApiKey(key) : '';
  }, []);

  const updateAgentConfig = useCallback((role: AgentRole, updates: Partial<AgentModelConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      (newConfig as Record<AgentRole, AgentModelConfig>)[role] = { 
        ...(prev[role] as AgentModelConfig), 
        ...updates 
      };
      return newConfig as CourtroomModelConfig;
    });
    setIsDirty(true);
  }, []);

  // Load models for a provider
  const loadModelsForProvider = useCallback(async (providerId: ProviderId) => {
    if (modelsLoading[providerId]) return;
    
    // Check cache first
    const cached = getCachedModels(providerId);
    if (cached) {
      setModelCache(prev => ({ ...prev, [providerId]: cached }));
      return;
    }

    setModelsLoading(prev => ({ ...prev, [providerId]: true }));
    setModelsError(prev => ({ ...prev, [providerId]: '' }));

    try {
      let models: ModelInfo[] = [];
      
      switch (providerId) {
        case 'openrouter': {
          models = await fetchOpenRouterModels();
          break;
        }
        case 'ollama': {
          const baseUrl = loadApiKey('ollama') || 'http://localhost:11434';
          models = await fetchOllamaModels(baseUrl);
          break;
        }
        case 'openai': {
          const apiKey = loadApiKey('openai');
          if (apiKey) {
            models = await fetchOpenAIModels(apiKey);
          }
          break;
        }
        case 'anthropic': {
          const apiKey = loadApiKey('anthropic');
          if (apiKey) {
            models = await fetchAnthropicModels(apiKey);
          }
          break;
        }
        case 'gemini': {
          const apiKey = loadApiKey('gemini');
          if (apiKey) {
            models = await fetchGeminiModels(apiKey);
          }
          break;
        }
        case 'lmstudio':
        case 'custom-openai': {
          const baseUrl = loadApiKey(providerId);
          const apiKey = providerId === 'custom-openai' ? loadApiKey('anthropic') : null; // Reuse key storage
          if (baseUrl) {
            models = await fetchCustomModels(baseUrl, apiKey);
          }
          break;
        }
      }
      
      if (models.length > 0) {
        setCachedModels(providerId, models);
        setModelCache(prev => ({ ...prev, [providerId]: models }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load models';
      setModelsError(prev => ({ ...prev, [providerId]: errorMsg }));
    } finally {
      setModelsLoading(prev => ({ ...prev, [providerId]: false }));
    }
  }, [modelsLoading]);

  // Get available models for an agent's provider
  const getAvailableModels = useCallback((providerId: ProviderId): ModelInfo[] => {
    const models = modelCache[providerId] || [];
    if (!modelFilters.freeOnly && !modelFilters.paidOnly && !modelFilters.visionOnly && !modelFilters.search) {
      return models;
    }
    return filterModels(models, {
      freeOnly: modelFilters.freeOnly,
      paidOnly: modelFilters.paidOnly,
      visionOnly: modelFilters.visionOnly,
      search: modelFilters.search,
    });
  }, [modelCache, modelFilters]);

  const getEntry = (providerId: ProviderId): ProviderRegistryEntry => getProviderEntry(providerId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-courtroom-card border border-gray-700 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-yellow-500">Provider Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">x</button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'agents' ? 'bg-gray-800 text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}
          >
            Agent Providers
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'api-keys' ? 'bg-gray-800 text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}
          >
            API Keys
          </button>
        </div>

        {/* Browser storage warning */}
        {activeTab === 'api-keys' && (
          <div className="bg-yellow-900/20 border-b border-yellow-800 p-2 text-xs text-yellow-200 px-4">
            Browser-stored keys are for local/personal testing. Production should use a backend proxy.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'agents' ? (
            /* Agent provider selection with model catalogs */
            <div className="space-y-4">
              <div className="mb-4 flex gap-2 flex-wrap">
                <label className="text-xs text-gray-400">Filter models:</label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={modelFilters.freeOnly} onChange={(e) => setModelFilters(f => ({ ...f, freeOnly: e.target.checked }))} className="rounded" />
                  Free
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={modelFilters.paidOnly} onChange={(e) => setModelFilters(f => ({ ...f, paidOnly: e.target.checked }))} className="rounded" />
                  Paid
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={modelFilters.visionOnly} onChange={(e) => setModelFilters(f => ({ ...f, visionOnly: e.target.checked }))} className="rounded" />
                  Vision
                </label>
                <input 
                  type="text" 
                  placeholder="Search models..."
                  value={modelFilters.search}
                  onChange={(e) => setModelFilters(f => ({ ...f, search: e.target.value }))}
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs w-32"
                />
              </div>

              {(Object.keys(AGENT_LABELS) as AgentRole[]).map((role) => {
                const agentConfig = (config as Record<AgentRole, AgentModelConfig>)[role];
                const entry = getEntry(agentConfig?.providerId || 'mock');
                const status = connectionStatus[agentConfig?.providerId || 'mock'];
                const statusBadge = STATUS_BADGES[status];
                const loading = modelsLoading[agentConfig?.providerId || 'mock'];
                const error = modelsError[agentConfig?.providerId || 'mock'];
                const availableModels = getAvailableModels(agentConfig?.providerId || 'mock');

                return (
                  <div key={role} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-medium text-white mb-3 capitalize">{AGENT_LABELS[role]}</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Provider</label>
                        <select
                          value={agentConfig?.providerId || 'mock'}
                          onChange={(e) => {
                            const newProviderId = e.target.value as ProviderId;
                            const newEntry = getProviderEntry(newProviderId);
                            const defaultModel = DEFAULT_MODELS[newProviderId]?.[0] || newEntry.defaultModels[0];
                            updateAgentConfig(role, {
                              providerId: newProviderId,
                              model: defaultModel,
                              mode: newEntry.category === 'mock' ? 'mock' : newEntry.category === 'local' ? 'local' : 'api',
                            });
                          }}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                        >
                          {Object.values(PROVIDER_REGISTRY).map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs text-gray-400 mb-1">Model</label>
                          {availableModels.length > 0 && (
                            <button 
                              onClick={() => loadModelsForProvider(agentConfig?.providerId || 'mock')}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              Refresh
                            </button>
                          )}
                        </div>
                        {loading ? (
                          <div className="text-xs text-blue-400">Loading models...</div>
                        ) : error ? (
                          <div className="text-xs text-red-400">{error}</div>
                        ) : availableModels.length > 0 ? (
                          <select
                            value={agentConfig?.model || ''}
                            onChange={(e) => updateAgentConfig(role, { model: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                          >
                            {availableModels.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} {m.isFree ? '(free)' : ''} {m.isVision ? '[vision]' : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={agentConfig?.model || ''}
                            onChange={(e) => updateAgentConfig(role, { model: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                            placeholder={entry.defaultModels[0]}
                          />
                        )}
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-xs text-gray-400">{entry.status}</span>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className={`px-4 py-2 rounded text-sm ${isDirty ? 'bg-yellow-700 hover:bg-yellow-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  Save Configuration
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded text-sm bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          ) : (
            /* API Key management */
            <div className="space-y-3">
              {(Object.values(PROVIDER_REGISTRY) as ProviderRegistryEntry[]).map((provider) => {
                if (!provider.requiresApiKey && !provider.requiresBaseUrl) return null;
                
                const status = connectionStatus[provider.id];
                const statusBadge = STATUS_BADGES[status];
                const displayKey = getDisplayKey(provider.id);
                const isBaseUrl = provider.requiresBaseUrl;

                return (
                  <div key={provider.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{provider.label}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      {displayKey && (
                        <button
                          onClick={() => handleClearApiKey(provider.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 mb-2">{provider.description}</div>
                    
                    {displayKey ? (
                      <div className="bg-gray-900 rounded px-3 py-2 text-sm text-gray-300 font-mono">
                        {displayKey}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type={isBaseUrl ? 'text' : 'password'}
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          placeholder={isBaseUrl ? 'http://localhost:11434' : `Enter ${provider.label} API key`}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs text-gray-400">
                            <input
                              type="checkbox"
                              checked={rememberKey}
                              onChange={(e) => setRememberKey(e.target.checked)}
                              className="rounded"
                            />
                            Remember on this browser
                          </label>
                          <button
                            onClick={() => handleSaveApiKey(provider.id)}
                            disabled={!keyInput.trim()}
                            className={`ml-auto px-3 py-1 rounded text-xs ${keyInput.trim() ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                          >
                            Save Key
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
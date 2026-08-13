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
  getAgentConnectionStatus,
  getAgentStatusError,
  API_KEY_STORAGE_KEYS,
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
  type ModelInfo,
  OPENROUTER_FREE_MODELS,
} from '../providers/modelCatalog';
import { LoadingSpinner } from './visuals/CourtroomVisuals';
import { testProviderAndModel } from '../providers/runtime';
import { useSpeechSynthesis, filterIndianVoices } from '../hooks/useSpeechSynthesis';

const hasProxy = !!import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;

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
  connected: { bg: 'bg-green-900/50', text: 'text-green-400', label: 'API Key Configured' },
  missing: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Missing API Key' },
  loading: { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'Loading...' },
  error: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Error' },
};

// Default models per provider (fallback)
const DEFAULT_MODELS: Record<ProviderId, string[]> = {
  mock: ['judge-reasoner-v1', 'prosecutor-advocate-v1', 'defense-strategist-v1'],
  openrouter: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro'],
  openai: ['gpt-4o', 'gpt-4-turbo'],
  anthropic: ['claude-sonnet-5', 'claude-opus-4-8', 'claude-haiku-4-5-20251001'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  ollama: ['llama3.1', 'mistral', 'codellama'],
  lmstudio: ['llama3.1', 'mixtral'],
  'custom-openai': ['gpt-4'],
};

export function ProviderSettings({ isOpen, onClose }: ProviderSettingsProps) {
  const [config, setConfig] = useState<CourtroomModelConfig>(DEFAULT_MODEL_CONFIG);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'api-keys' | 'voices'>('agents');
  const speech = useSpeechSynthesis();
  const [keyInputs, setKeyInputs] = useState<Partial<Record<ProviderId, string>>>({});
  const [rememberKeys, setRememberKeys] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [statusTrigger, setStatusTrigger] = useState(0);
  const [autoPickStatus, setAutoPickStatus] = useState<Record<AgentRole, {
    running: boolean;
    success?: boolean;
    message?: string;
  }>>({
    judge: { running: false },
    prosecutor: { running: false },
    defense: { running: false },
  });

  useEffect(() => {
    const handleStatusChange = () => {
      setStatusTrigger(prev => prev + 1);
    };
    window.addEventListener('judgebench-provider-status-changed', handleStatusChange);
    return () => {
      window.removeEventListener('judgebench-provider-status-changed', handleStatusChange);
    };
  }, []);
  
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
    const initialRemember: Partial<Record<ProviderId, boolean>> = {};

    (Object.keys(PROVIDER_REGISTRY) as ProviderId[]).forEach(pid => {
      newStatus[pid] = isProviderConfigured(pid) ? 'connected' : 'missing';
      const storageKey = API_KEY_STORAGE_KEYS[pid];
      if (storageKey) {
        initialRemember[pid] = localStorage.getItem(storageKey) !== null;
      }
    });
    setConnectionStatus(newStatus);
    setRememberKeys(initialRemember);
    
    // Pre-load models for all configured providers
    (Object.keys(AGENT_LABELS) as AgentRole[]).forEach((role) => {
      const agentConfig = (loaded as Record<AgentRole, AgentModelConfig>)[role];
      const providerId = agentConfig?.providerId || 'mock';
      if (providerId !== 'mock' && isProviderConfigured(providerId)) {
        loadModelsForProvider(providerId);
      }
    });
  }, [isOpen]);

  const handleSave = useCallback(() => {
    const updated = { ...config, savedAt: new Date().toISOString() };
    saveCourtroomConfig(updated);
    setConfig(updated);
    setIsDirty(false);
    window.dispatchEvent(new Event('judgebench-provider-status-changed'));

    // Automatically test selected non-mock provider/model for all active agents
    const roles: AgentRole[] = ['judge', 'prosecutor', 'defense'];
    roles.forEach(role => {
      const agentConfig = updated[role];
      if (agentConfig && agentConfig.providerId !== 'mock') {
        testProviderAndModel(role, agentConfig);
      }
    });
  }, [config]);

  const handleReset = useCallback(() => {
    const reset = resetCourtroomConfig();
    setConfig(reset);
    setIsDirty(false);
    window.dispatchEvent(new Event('judgebench-provider-status-changed'));
  }, []);

  const handleSaveApiKey = useCallback((providerId: ProviderId) => {
    const key = (keyInputs[providerId] || '').trim();
    const remember = rememberKeys[providerId] || false;
    if (key) {
      saveApiKey(providerId, key, remember);
      setConnectionStatus(prev => ({ ...prev, [providerId]: 'connected' }));
      // Load models for this provider after API key is saved
      loadModelsForProvider(providerId);
      // Clear only this provider's input
      setKeyInputs(prev => {
        const { [providerId]: _, ...rest } = prev;
        return rest;
      });
      setRememberKeys(prev => {
        const { [providerId]: _, ...rest } = prev;
        return rest;
      });
      window.dispatchEvent(new Event('judgebench-provider-status-changed'));
    }
  }, [keyInputs, rememberKeys, loadModelsForProvider]);

  const handleClearApiKey = useCallback((providerId: ProviderId) => {
    clearApiKey(providerId);
    setConnectionStatus(prev => ({ ...prev, [providerId]: 'missing' }));
    // Remove stored input and remember state for this provider
    setKeyInputs(prev => {
      const { [providerId]: _, ...rest } = prev;
      return rest;
    });
    setRememberKeys(prev => {
      const { [providerId]: _, ...rest } = prev;
      return rest;
    });
    window.dispatchEvent(new Event('judgebench-provider-status-changed'));
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
  async function loadModelsForProvider(providerId: ProviderId) {
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
          const apiKey = providerId === 'custom-openai' ? loadApiKey('custom-openai') : null;
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
  }

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

  // Sequential test loop for auto-picking free OpenRouter models
  const handleAutoPick = async (role: AgentRole) => {
    setAutoPickStatus(prev => ({
      ...prev,
      [role]: { running: true, message: 'Starting model test loop...' }
    }));

    const agentConfig = config[role];
    const personalKey = loadApiKey('openrouter');
    const proxyUrl = import.meta.env.VITE_OPENROUTER_FREE_PROXY_URL;
    const mode = agentConfig?.openRouterMode || (proxyUrl ? 'demo' : 'personal');

    let url = '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (mode === 'demo') {
      if (!proxyUrl) {
        setAutoPickStatus(prev => ({
          ...prev,
          [role]: { running: false, success: false, message: 'Error: Free demo gateway not configured.' }
        }));
        return;
      }
      url = proxyUrl;
    } else {
      if (!personalKey) {
        setAutoPickStatus(prev => ({
          ...prev,
          [role]: { running: false, success: false, message: 'Error: Personal API key is missing.' }
        }));
        return;
      }
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${personalKey}`;
      headers['HTTP-Referer'] = window.location.origin;
    }

    const testPrompt = 'say OK';
    let workingModel: string | null = null;
    let finalMessage = '';

    for (const modelInfo of OPENROUTER_FREE_MODELS) {
      setAutoPickStatus(prev => ({
        ...prev,
        [role]: { running: true, message: `Testing: ${modelInfo.name}...` }
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout limit

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelInfo.id,
            messages: [
              { role: 'user', content: testPrompt }
            ],
            max_tokens: 5,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const resData = await response.json();
          if (resData?.choices?.[0]?.message?.content) {
            workingModel = modelInfo.id;
            finalMessage = `Success: Selected ${modelInfo.name}!`;
            break;
          } else {
            throw new Error('Invalid response structure');
          }
        } else {
          const errText = await response.text();
          // Error classification
          if (response.status === 429) {
            throw new Error('Rate limit exceeded (429)');
          } else if (response.status === 401 || response.status === 403) {
            throw new Error('Authentication/Auth error');
          } else if (response.status === 503 || response.status === 504) {
            throw new Error('Model temporarily busy/unavailable');
          } else {
            throw new Error(`API error ${response.status}: ${errText.substring(0, 50)}`);
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        let errorType = 'Network or connection error';
        if (err.name === 'AbortError') {
          errorType = 'Timeout (took > 4s)';
        } else if (err instanceof Error) {
          errorType = err.message;
        }
        console.warn(`Auto-pick test failed for ${modelInfo.id}: ${errorType}`);
        finalMessage = `Failed ${modelInfo.name}: ${errorType}`;
      }
    }

    if (workingModel) {
      updateAgentConfig(role, { model: workingModel });
      setAutoPickStatus(prev => ({
        ...prev,
        [role]: { running: false, success: true, message: finalMessage }
      }));
      setConnectionStatus(prev => ({ ...prev, openrouter: 'connected' }));
    } else {
      setAutoPickStatus(prev => ({
        ...prev,
        [role]: { running: false, success: false, message: `Auto-pick failed: All tested free models are currently busy or rate-limited.` }
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" data-status-trigger={statusTrigger}>
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
          <button
            onClick={() => setActiveTab('voices')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'voices' ? 'bg-gray-800 text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}
          >
            Agent Voices
          </button>
        </div>

        {/* Browser storage warning */}
        {activeTab === 'api-keys' && (
          <div className="bg-yellow-900/20 border-b border-yellow-800 p-2 text-xs text-yellow-200 px-4">
            Browser-stored keys are for local/personal testing. Production should use a backend proxy.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeTab === 'agents' && (
            /* Agent provider selection with model catalogs */
            <div className="space-y-4">
              <div className="bg-blue-950/40 border border-blue-900/50 p-3 rounded-lg text-xs text-blue-200 leading-relaxed">
                ℹ️ <strong>Free Demo Connection Note:</strong> Free Demo uses the app's backend proxy and only supports free OpenRouter models. Paid models require your own OpenRouter API key.
              </div>
              <div className="mb-4 flex gap-2 flex-wrap items-center">
                <label className="text-xs text-gray-400">Filter models:</label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={modelFilters.freeOnly} onChange={(e) => setModelFilters(f => ({ ...f, freeOnly: e.target.checked, paidOnly: e.target.checked ? false : f.paidOnly }))} className="rounded" />
                  Free
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={modelFilters.paidOnly} onChange={(e) => setModelFilters(f => ({ ...f, paidOnly: e.target.checked, freeOnly: e.target.checked ? false : f.freeOnly }))} className="rounded" />
                  Paid
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={modelFilters.visionOnly} onChange={(e) => setModelFilters(f => ({ ...f, visionOnly: e.target.checked }))} className="rounded" />
                  Vision
                </label>
                <input 
                  type="text" 
                  placeholder="Search..."
                  value={modelFilters.search}
                  onChange={(e) => setModelFilters(f => ({ ...f, search: e.target.value }))}
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs w-28"
                />
                {/* Show count when any filter is active */}
                {Object.values(modelCache).some(m => m.length > 0) && (
                  <span className="text-xs text-blue-400 ml-2">
                    {Object.values(modelCache).reduce((sum, arr) => sum + arr.length, 0)} models
                  </span>
                )}
              </div>

              {(Object.keys(AGENT_LABELS) as AgentRole[]).map((role) => {
                const agentConfig = (config as Record<AgentRole, AgentModelConfig>)[role];
                const entry = getEntry(agentConfig?.providerId || 'mock');
                const agentStatus = getAgentConnectionStatus(role, agentConfig);
                const errorMsg = agentStatus === 'failed' ? getAgentStatusError(role, agentConfig) : undefined;
                
                let statusBadge = { bg: 'bg-gray-900/50', text: 'text-gray-400', label: 'Unknown' };
                switch (agentStatus) {
                  case 'mock':
                    statusBadge = { bg: 'bg-green-900/50', text: 'text-green-400', label: 'Mock Mode' };
                    break;
                  case 'fallback':
                    statusBadge = { bg: 'bg-amber-900/50', text: 'text-amber-400', label: 'Fallback Active — Mock Mode' };
                    break;
                  case 'free-demo-ready':
                    statusBadge = { bg: 'bg-emerald-900/50', text: 'text-emerald-400', label: 'Free Demo Ready' };
                    break;
                  case 'free-demo-unavailable':
                    statusBadge = { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Free Demo Unavailable — proxy not configured' };
                    break;
                  case 'personal-api-ready':
                    statusBadge = { bg: 'bg-emerald-900/50', text: 'text-emerald-400', label: 'Personal API Ready' };
                    break;
                  case 'missing-key':
                    statusBadge = { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Personal API Missing' };
                    break;
                  case 'testing':
                    statusBadge = { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'Testing...' };
                    break;
                  case 'not-tested':
                    statusBadge = { bg: 'bg-blue-900/50', text: 'text-blue-405', label: 'Not Tested' };
                    break;
                  case 'failed': {
                    const mode = agentConfig?.openRouterMode || (hasProxy ? 'demo' : 'personal');
                    let label = '';
                    let bg = 'bg-red-900/50';
                    let text = 'text-red-400';
                    
                    if (agentConfig?.providerId === 'openrouter' && mode === 'demo' && errorMsg && errorMsg.includes('trying another free model')) {
                      label = 'Free Demo busy — trying another free model…';
                      bg = 'bg-blue-900/50';
                      text = 'text-blue-400';
                    } else if (agentConfig?.providerId === 'openrouter' && mode === 'demo' && errorMsg && (errorMsg.includes('rate-limited') || errorMsg.includes('429') || errorMsg.includes('rate_limited'))) {
                      label = 'Free Demo rate-limited — try later or use your own OpenRouter key.';
                    } else if (agentConfig?.providerId === 'openrouter' && mode === 'demo' && errorMsg && errorMsg.includes('invalid proxy key')) {
                      label = 'Free Demo Failed — invalid proxy key';
                    } else if (agentConfig?.providerId === 'openrouter' && mode === 'demo' && errorMsg && errorMsg.includes('missing proxy secret')) {
                      label = 'Free Demo Failed — missing proxy secret';
                    } else {
                      const prefix = agentConfig?.providerId === 'openrouter'
                        ? (mode === 'demo' ? 'Free Demo Failed' : 'Personal API Failed')
                        : 'Failed';
                      label = `${prefix} — ${errorMsg ? errorMsg.replace(/^Failed\s*—\s*/, '') : 'Connection failed'}`;
                    }
                    statusBadge = { bg, text, label };
                    break;
                  }
                }
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
                            // Load models for the newly selected provider
                            loadModelsForProvider(newProviderId);
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
                        {loading ? ( <LoadingSpinner message="Loading models..." /> ) : error ? (
                          <div className="text-xs text-red-400">{error}</div>
                        ) : availableModels.length > 0 ? (
                           <select
                            value={agentConfig?.model || ''}
                            onChange={(e) => updateAgentConfig(role, { model: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                          >
                            {availableModels.map((m) => {
                              const isFreeModel = m.isFree || m.id.endsWith(':free');
                              const isDemoMode = agentConfig?.providerId === 'openrouter' && agentConfig.openRouterMode === 'demo';
                              const isDisabled = isDemoMode && !isFreeModel;
                              return (
                                <option key={m.id} value={m.id} disabled={isDisabled}>
                                  {m.name} {isFreeModel ? '(free)' : isDisabled ? '(Requires your own OpenRouter key)' : ''} {m.isVision ? '[vision]' : ''}
                                </option>
                              );
                            })}
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

                    {/* OpenRouter Mode Selector */}
                    {agentConfig?.providerId === 'openrouter' && (
                      <div className="mt-3 bg-gray-900/40 p-2.5 rounded-lg border border-gray-700/50 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-305 mb-2">OpenRouter Connection Type</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                              <input
                                type="radio"
                                name={`or-mode-${role}`}
                                checked={agentConfig.openRouterMode === 'demo' || (!agentConfig.openRouterMode && hasProxy)}
                                onChange={() => {
                                  const defaultFreeModel = 'google/gemma-4-31b-it:free';
                                  updateAgentConfig(role, { 
                                    openRouterMode: 'demo',
                                    model: defaultFreeModel 
                                  });
                                }}
                                className="text-yellow-500 focus:ring-yellow-500 bg-gray-950 border-gray-700"
                              />
                              <span>OpenRouter Free Demo</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                              <input
                                type="radio"
                                name={`or-mode-${role}`}
                                checked={agentConfig.openRouterMode === 'personal' || (!agentConfig.openRouterMode && !hasProxy)}
                                onChange={() => {
                                  updateAgentConfig(role, { openRouterMode: 'personal' });
                                }}
                                className="text-yellow-500 focus:ring-yellow-500 bg-gray-950 border-gray-700"
                              />
                              <span>Personal API Key</span>
                            </label>
                          </div>
                        </div>

                        {/* Auto-pick working free OpenRouter model */}
                        <div className="border-t border-gray-800 pt-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-300">
                              Auto-pick working free OpenRouter model
                            </span>
                            <button
                              onClick={() => handleAutoPick(role)}
                              disabled={autoPickStatus[role]?.running}
                              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                                autoPickStatus[role]?.running
                                  ? 'bg-blue-800 text-blue-300 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white'
                              }`}
                            >
                              {autoPickStatus[role]?.running ? '⏳ Testing...' : '⚡ Auto-Pick Now'}
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-400">
                            Sequentially tests free OpenRouter models (max 4s timeout) and selects a working one.
                            Uses your configured OpenRouter API key or proxy if available (free models do not always mean keyless access).
                          </p>
                          {autoPickStatus[role]?.message && (
                            <div className={`text-xs p-1.5 rounded ${
                              autoPickStatus[role]?.success 
                                ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' 
                                : 'bg-red-950/20 text-red-400 border border-red-900/30'
                            }`}>
                              {autoPickStatus[role]?.message}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status indicator and Test button */}
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-700/50 pt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {agentConfig?.providerId === 'openrouter' && agentConfig?.openRouterMode === 'demo'
                            ? 'Running on shared Free Demo Proxy gateway.'
                            : entry.status}
                        </span>
                      </div>
                      
                      {agentConfig?.providerId !== 'mock' && (
                        <button
                          onClick={async () => {
                            if (agentConfig) {
                              await testProviderAndModel(role, agentConfig);
                            }
                          }}
                          className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-2.5 py-1 rounded font-medium transition"
                        >
                          Test Selected Mode
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'api-keys' && (
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
                          value={keyInputs[provider.id] ?? ''}
                          onChange={(e) => setKeyInputs(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          placeholder={isBaseUrl ? 'http://localhost:11434' : `Enter ${provider.label} API key`}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs text-gray-400">
                            <input
                              type="checkbox"
                              checked={rememberKeys[provider.id] ?? false}
                              onChange={(e) => setRememberKeys(prev => ({ ...prev, [provider.id]: e.target.checked }))}
                              className="rounded"
                            />
                            Remember on this browser
                          </label>
                          <button
                            onClick={() => handleSaveApiKey(provider.id)}
                            disabled={!((keyInputs[provider.id] || '').trim())}
                            className={`ml-auto px-3 py-1 rounded text-xs ${((keyInputs[provider.id] || '').trim()) ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
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

          {activeTab === 'voices' && (
            <div className="space-y-4">
              <div className="bg-gray-800/40 border border-gray-700/60 rounded-lg p-3 text-xs text-gray-300">
                <span className="font-semibold text-yellow-500 block mb-1">Browser Voice Integration</span>
                Voice availability depends entirely on your local operating system and web browser.
                Indian English/Hindi/Telugu locale voices (e.g., Google or Microsoft Heera, Ravi, Neerja) will be auto-preferred if installed.
              </div>

              {!speech.supported ? (
                <div className="bg-red-955/20 border border-red-900/50 rounded-lg p-4 text-center text-sm text-red-400 font-medium">
                  Speech Synthesis is not supported in this browser.
                </div>
              ) : speech.voices.length === 0 ? (
                <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4 text-center text-sm text-gray-400">
                  Loading available browser voices...
                </div>
              ) : (
                <div className="space-y-4">
                  {(['judge', 'prosecutor', 'defense'] as AgentRole[]).map((role) => {
                    const sortedVoices = (() => {
                      const indian = filterIndianVoices(speech.voices);
                      const nonIndianEnglish = speech.voices.filter(v => 
                        v.lang.toLowerCase().startsWith('en') && !indian.some(iv => iv.name === v.name)
                      );
                      const others = speech.voices.filter(v => 
                        !v.lang.toLowerCase().startsWith('en') && !indian.some(iv => iv.name === v.name)
                      );
                      return [...indian, ...nonIndianEnglish, ...others];
                    })();

                    const currentVoiceName = speech.agentVoices[role];
                    const testMessage = role === 'judge' 
                      ? "Order in the court. I am the Judge, presiding over today's simulation."
                      : role === 'prosecutor'
                      ? "The prosecution is ready to present the case, Your Honor."
                      : "The defense stands ready to protect the rights of the accused.";

                    return (
                      <div key={role} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-white capitalize">{AGENT_LABELS[role]} Voice Settings</span>
                          <button
                            onClick={() => speech.speakText(testMessage, role)}
                            className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Test Voice
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Select Voice</label>
                          <select
                            value={currentVoiceName || ''}
                            onChange={(e) => speech.updateAgentVoice(role, e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200"
                          >
                            <option value="">-- System Default (Auto-prefer Indian) --</option>
                            {sortedVoices.map((v) => {
                              const isIndian = filterIndianVoices([v]).length > 0;
                              return (
                                <option key={v.name} value={v.name}>
                                  {v.name} ({v.lang}){isIndian ? ' 🇮🇳' : ''} {v.localService ? '(local)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky/Fixed Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2 rounded text-sm bg-gray-850 hover:bg-gray-750 text-gray-355 transition-colors duration-200"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`w-full sm:w-auto px-4 py-2 rounded text-sm transition-colors duration-200 ${
              isDirty 
                ? 'bg-yellow-600 hover:bg-yellow-555 text-white font-bold' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            Save Configuration
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded text-sm bg-gray-700 hover:bg-gray-650 text-white transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
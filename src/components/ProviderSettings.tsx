/**
 * ProviderSettings — Editable provider configuration panel
 */

import { useState, useEffect } from 'react';
import type { AgentRole } from '../types/courtroom';
import type { AgentModelConfig, CourtroomModelConfig, ProviderId, ProviderRegistryEntry } from '../types/providers';
import { 
  PROVIDER_REGISTRY, 
  DEFAULT_MODEL_CONFIG,
  saveCourtroomConfig, 
  loadCourtroomConfig,
  resetCourtroomConfig,
  getProviderEntry 
} from '../types/providers';

interface ProviderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AGENT_LABELS: Record<AgentRole, string> = {
  judge: 'Judge',
  prosecutor: 'Prosecutor',
  defense: 'Defense',
};

export function ProviderSettings({ isOpen, onClose }: ProviderSettingsProps) {
  const [config, setConfig] = useState<CourtroomModelConfig>(DEFAULT_MODEL_CONFIG);
  const [isDirty, setIsDirty] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    const loaded = loadCourtroomConfig();
    setConfig(loaded);
  }, []);

  const handleSave = () => {
    const updated = { ...config, savedAt: new Date().toISOString() };
    saveCourtroomConfig(updated);
    setConfig(updated);
    setIsDirty(false);
  };

  const handleReset = () => {
    const reset = resetCourtroomConfig();
    setConfig(reset);
    setIsDirty(false);
  };

  const updateAgentConfig = (role: AgentRole, updates: Partial<AgentModelConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      (newConfig as Record<AgentRole, AgentModelConfig>)[role] = { 
        ...(prev[role] as AgentModelConfig), 
        ...updates 
      };
      return newConfig as CourtroomModelConfig;
    });
    setIsDirty(true);
  };

  const getEntry = (providerId: ProviderId): ProviderRegistryEntry => {
    return getProviderEntry(providerId);
  };

  const isUsingMock = (role: AgentRole): boolean => {
    const cfg = (config as Record<AgentRole, AgentModelConfig>)[role];
    return cfg.providerId === 'mock';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-courtroom-card border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-yellow-500">
            ⚙️ Provider Configuration
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        {showWarning && (
          <div className="bg-yellow-900/30 border-b border-yellow-700 p-3">
            <div className="flex items-start gap-2">
              <span className="text-yellow-500">⚠️</span>
              <div className="text-xs text-yellow-200">
                <p className="font-medium mb-1">Note: Provider configured but not connected in this phase.</p>
                <p>Simulation continues in mock mode. Real API calls will be available in Phase 3.</p>
              </div>
              <button onClick={() => setShowWarning(false)} className="text-yellow-500 hover:text-yellow-300 ml-auto text-sm">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(Object.keys(AGENT_LABELS) as AgentRole[]).map((role) => {
            const agentConfig = (config as Record<AgentRole, AgentModelConfig>)[role];
            const entry = getEntry(agentConfig.providerId);
            const isMock = isUsingMock(role);
            
            return (
              <div key={role} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="font-medium text-white mb-3 capitalize">{AGENT_LABELS[role]}</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Provider</label>
                    <select
                      value={agentConfig.providerId}
                      onChange={(e) => {
                        const newProviderId = e.target.value as ProviderId;
                        const newEntry = getProviderEntry(newProviderId);
                        updateAgentConfig(role, {
                          providerId: newProviderId,
                          model: newEntry.defaultModels[0],
                          mode: newEntry.mode === 'mock' ? 'mock' : 
                               newEntry.mode === 'local-placeholder' ? 'local-placeholder' : 'api-placeholder',
                        });
                      }}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                    >
                      {Object.values(PROVIDER_REGISTRY).map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.icon} {provider.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Model</label>
                    <input
                      type="text"
                      value={agentConfig.model}
                      onChange={(e) => updateAgentConfig(role, { model: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                      placeholder="Enter model name"
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      isMock ? 'bg-green-700 text-green-200' : 'bg-yellow-700 text-yellow-200'
                    }`}>
                      {isMock ? '✓ Mock Active' : `${entry.label} (Placeholder)`}
                    </span>
                    
                    {entry.requiresApiKey && !isMock && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-800 text-red-200">Needs API Key</span>
                    )}
                    
                    {entry.requiresBaseUrl && !isMock && (
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-800 text-orange-200">Needs URL</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            Reset Defaults
          </button>
          
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`px-4 py-2 rounded text-sm ${
                isDirty ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

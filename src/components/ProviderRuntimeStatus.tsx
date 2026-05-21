/**
 * ProviderRuntimeStatus — Shows provider runtime connection status
 */

import { useState, useEffect } from 'react';
import { getProviderRuntimeStatus, ProviderRuntimeStatus } from '../providers/runtime';
import type { AgentModelConfig } from '../types/providers';

interface ProviderRuntimeStatusProps {
  configs: {
    judge: AgentModelConfig;
    prosecutor: AgentModelConfig;
    defense: AgentModelConfig;
  };
}

const STATUS_CONFIG: Record<ProviderRuntimeStatus, { label: string; color: string; bg: string }> = {
  mock: { label: '✓ Mock Active', color: 'text-green-400', bg: 'bg-green-900/30' },
  openrouter_ready: { label: '✓ OpenRouter Ready', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  openrouter_missing_key: { label: '⚠ OpenRouter Missing Key', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  ollama_ready: { label: '✓ Ollama Ready', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  ollama_unavailable: { label: '⚠ Ollama Unavailable', color: 'text-orange-400', bg: 'bg-orange-900/30' },
  error_fallback_mock: { label: '⚠ Fallback to Mock', color: 'text-red-400', bg: 'bg-red-900/30' },
};

export function ProviderRuntimeStatusPanel({ configs }: ProviderRuntimeStatusProps) {
  const [statuses, setStatuses] = useState<Record<string, ProviderRuntimeStatus>>({
    judge: 'mock',
    prosecutor: 'mock',
    defense: 'mock',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatuses() {
      const judgeStatus = await getProviderRuntimeStatus(configs.judge.providerId);
      const prosecutorStatus = await getProviderRuntimeStatus(configs.prosecutor.providerId);
      const defenseStatus = await getProviderRuntimeStatus(configs.defense.providerId);
      
      setStatuses({
        judge: judgeStatus,
        prosecutor: prosecutorStatus,
        defense: defenseStatus,
      });
      setLoading(false);
    }

    checkStatuses();
  }, [configs]);

  if (loading) {
    return (
      <div className="bg-courtroom-card rounded-lg border border-gray-700 p-3">
        <span className="text-xs text-gray-400">Checking provider status...</span>
      </div>
    );
  }

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          🔌 Provider Runtime Status
        </h3>
      </div>
      
      <div className="p-3 space-y-2">
        {Object.entries(statuses).map(([role, status]) => {
          const config = STATUS_CONFIG[status];
          return (
            <div key={role} className={`text-xs px-2 py-1 rounded ${config.bg}`}>
              <span className="capitalize mr-2">{role}:</span>
              <span className={config.color}>{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

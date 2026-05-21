/**
 * ProviderRuntimeStatus — Shows provider runtime connection status
 * Phase 6.5: Includes manual test buttons
 */

import { useState, useEffect, useCallback } from 'react';
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
  mock: { label: '✓ Mock Ready', color: 'text-green-400', bg: 'bg-green-900/30' },
  openrouter_ready: { label: '✓ OpenRouter Ready', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  openrouter_missing_key: { label: 'Missing OpenRouter Key', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  ollama_ready: { label: '✓ Ollama Ready', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  ollama_unavailable: { label: 'Ollama Unavailable', color: 'text-orange-400', bg: 'bg-orange-900/30' },
  error_fallback_mock: { label: '⚠ Fallback to Mock', color: 'text-red-400', bg: 'bg-red-900/30' },
};

export function ProviderRuntimeStatusPanel({ configs }: ProviderRuntimeStatusProps) {
  const [statuses, setStatuses] = useState<Record<string, ProviderRuntimeStatus>>({
    judge: 'mock',
    prosecutor: 'mock',
    defense: 'mock',
  });

  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  const checkSingleStatus = useCallback(async (role: string, config: AgentModelConfig) => {
    setTesting(role);
    try {
      const status = await getProviderRuntimeStatus(config.providerId);
      setStatuses(prev => ({ ...prev, [role]: status }));
    } finally {
      setTesting(null);
    }
  }, []);

  const checkAllStatuses = useCallback(async () => {
    setLoading(true);
    const judgeStatus = await getProviderRuntimeStatus(configs.judge.providerId);
    const prosecutorStatus = await getProviderRuntimeStatus(configs.prosecutor.providerId);
    const defenseStatus = await getProviderRuntimeStatus(configs.defense.providerId);

    setStatuses({
      judge: judgeStatus,
      prosecutor: prosecutorStatus,
      defense: defenseStatus,
    });
    setLoading(false);
  }, [configs]);

  useEffect(() => {
    checkAllStatuses();
  }, [checkAllStatuses]);

  const roles = [
    { key: 'judge', label: 'Judge', config: configs.judge },
    { key: 'prosecutor', label: 'Prosecutor', config: configs.prosecutor },
    { key: 'defense', label: 'Defense', config: configs.defense },
  ];

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          🔌 Provider Runtime
        </h3>
        <button
          onClick={checkAllStatuses}
          disabled={loading}
          className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50"
        >
          {loading ? '...' : '↻'}
        </button>
      </div>
      
      <div className="p-3 space-y-2">
        {roles.map(({ key, label, config }) => {
          const status = statuses[key];
          const statusLabel = STATUS_CONFIG[status]?.label || 'Unknown';
          const statusColor = STATUS_CONFIG[status]?.color || 'text-gray-400';
          const statusBg = STATUS_CONFIG[status]?.bg || 'bg-gray-800';

          return (
            <div key={key} className="space-y-1">
              <div className={`text-xs px-2 py-1 rounded ${statusBg}`}>
                <span className="capitalize mr-2">{label}:</span>
                <span className={statusColor}>{statusLabel}</span>
              </div>
              <button
                onClick={() => checkSingleStatus(key, config)}
                disabled={testing !== null}
                className="w-full text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
              >
                {testing === key ? 'Testing...' : `Test ${label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

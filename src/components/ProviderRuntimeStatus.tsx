/**
 * ProviderRuntimeStatus — Shows provider runtime connection status
 * Phase 17.5: Real provider test calls
 */

import { useState, useEffect, useCallback } from 'react';
import { getProviderRuntimeStatus, ProviderRuntimeStatus, generateResponse } from '../providers/runtime';
import type { AgentModelConfig } from '../types/providers';
import type { AgentRole, CourtPhase, TranscriptEntry, Evidence } from '../types/courtroom';

interface ProviderRuntimeStatusProps {
  configs: {
    judge: AgentModelConfig;
    prosecutor: AgentModelConfig;
    defense: AgentModelConfig;
  };
}

const STATUS_CONFIG: Record<ProviderRuntimeStatus, { label: string; color: string; bg: string }> = {
  mock: { label: '✓ Mock Ready', color: 'text-green-400', bg: 'bg-green-900/30' },
  openrouter_ready: { label: '✓ Provider Ready', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  openrouter_missing_key: { label: 'Missing API Key', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  ollama_ready: { label: '✓ Ollama Ready', color: 'text-purple-400', bg: 'bg-purple-900/30' },
  ollama_unavailable: { label: 'Ollama Unavailable', color: 'text-orange-400', bg: 'bg-orange-900/30' },
  error_fallback_mock: { label: '⚠ Fallback to Mock', color: 'text-red-400', bg: 'bg-red-900/30' },
};

/**
 * Test result display for a single agent
 */
function TestResultDisplay({ role, config }: { role: AgentRole; config: AgentModelConfig }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string; fallback: boolean} | null>(null);

  const runTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    let usedFallback = false;
    
    try {
      // Test with a simple prompt matching the role
      let prompt = '';
      switch (role) {
        case 'judge':
          prompt = 'State a brief procedurally correct ruling.';
          break;
        case 'prosecutor':
          prompt = 'Give your opening statement.';
          break;
        case 'defense':
          prompt = 'Present your defense opening.';
          break;
      }

      const response = await generateResponse({
        role,
        config,
        phase: 'court_opening' as CourtPhase,
        transcript: [] as TranscriptEntry[],
        evidence: [] as Evidence[],
        prompt,
      });

      // Check if we got mock fallback
      if (response.startsWith('[Mock') || response.startsWith('Mock')) {
        usedFallback = true;
      }

      const latency = Date.now() - startTime;
      const preview = response.substring(0, 50).replace(/\n/g, ' ');
      
      setTestResult({
        success: !usedFallback,
        message: `${config.providerId}/${config.model} - ${latency}ms - "${preview}..."`,
        fallback: usedFallback,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Test failed';
      
      setTestResult({
        success: false,
        message: `Error: ${errorMsg.substring(0, 40)}`,
        fallback: true, // If error, we'll fall back to mock
      });
    } finally {
      setTesting(false);
    }
  }, [role, config]);

  return (
    <button
      onClick={runTest}
      disabled={testing}
      className="w-full text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 text-left"
    >
      {testing ? 'Testing...' : testResult ? (
        <span className={testResult.success ? 'text-green-400' : testResult.fallback ? 'text-yellow-400' : 'text-red-400'}>
          {testResult.message}
        </span>
      ) : (
        <span className="text-gray-400">Test {role}</span>
      )}
    </button>
  );
}

export function ProviderRuntimeStatusPanel({ configs }: ProviderRuntimeStatusProps) {
  const [statuses, setStatuses] = useState<Record<string, ProviderRuntimeStatus>>({
    judge: 'mock',
    prosecutor: 'mock',
    defense: 'mock',
  });

  const [loading, setLoading] = useState(true);

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
      
      <div className="p-3 space-y-3">
        {roles.map(({ key, label, config }) => {
          const status = statuses[key];
          const statusLabel = STATUS_CONFIG[status]?.label || 'Unknown';
          const statusColor = STATUS_CONFIG[status]?.color || 'text-gray-400';
          const statusBg = STATUS_CONFIG[status]?.bg || 'bg-gray-800';
          const roleKey = key as AgentRole;

          return (
            <div key={key} className="space-y-2">
              <div className={`text-xs px-2 py-1 rounded ${statusBg}`}>
                <span className="capitalize mr-2">{label}:</span>
                <span className={statusColor}>{statusLabel}</span>
              </div>
              <TestResultDisplay role={roleKey} config={config} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

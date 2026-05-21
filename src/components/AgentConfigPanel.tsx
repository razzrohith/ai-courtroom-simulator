/**
 * AgentConfigPanel — Display agent model configurations from localStorage
 */

import { useState, useEffect } from 'react';
import type { AgentParticipant } from '../types/courtroom';
import { 
  CourtroomModelConfig, 
  loadCourtroomConfig, 
  isProviderPlaceholder,
  PROVIDER_REGISTRY,
  ProviderId 
} from '../types/providers';

interface AgentConfigPanelProps {
  participants: AgentParticipant[];
  currentSpeaker: string | null;
}

export function AgentConfigPanel({ participants, currentSpeaker }: AgentConfigPanelProps) {
  const [config, setConfig] = useState<CourtroomModelConfig | null>(null);

  // Load config on mount
  useEffect(() => {
    const loaded = loadCourtroomConfig();
    setConfig(loaded);
  }, []);

  // Get provider label
  const getProviderLabel = (providerId: ProviderId): string => {
    const entry = PROVIDER_REGISTRY[providerId];
    return entry ? `${entry.icon} ${entry.label}` : providerId;
  };

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          🤖 Agent Model Configuration
        </h3>
      </div>

      <div className="p-4 space-y-3">
        {participants.map((participant) => {
          const role = participant.role;
          const agentConfig = config ? config[role] : null;
          const isActive = currentSpeaker === participant.role;
          
          // Determine status
          const getStatus = () => {
            if (!agentConfig) return { label: 'Loading...', class: 'bg-gray-700' };
            
            if (agentConfig.providerId === 'mock') {
              return { label: '✓ Mock Active', class: 'bg-green-700' };
            }
            
            if (isProviderPlaceholder(agentConfig.providerId)) {
              return { label: '⚠ Placeholder', class: 'bg-yellow-700' };
            }
            
            return { label: 'Active', class: 'bg-blue-700' };
          };

          const status = getStatus();

          return (
            <div
              key={participant.id}
              className={`
                p-3 rounded-lg border
                ${isActive 
                  ? 'bg-yellow-900/20 border-yellow-500' 
                  : 'bg-gray-800/50 border-gray-700'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{participant.role}</span>
                {isActive && (
                  <span className="text-xs text-yellow-500 animate-pulse">
                    ● ACTIVE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Provider:</span>
                  <span className="ml-1 text-gray-300">
                    {agentConfig ? getProviderLabel(agentConfig.providerId) : '...'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Model:</span>
                  <span className="ml-1 text-gray-300">
                    {agentConfig?.model || '...'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Mode:</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded ${status.class}`}>
                    {status.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-1 text-green-400">✓ Saved</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

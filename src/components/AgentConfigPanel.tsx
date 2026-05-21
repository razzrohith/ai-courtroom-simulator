/**
 * AgentConfigPanel — Display agent model configurations
 */

import type { AgentParticipant } from '../types/courtroom';

interface AgentConfigPanelProps {
  participants: AgentParticipant[];
  currentSpeaker: string | null;
}

export function AgentConfigPanel({ participants, currentSpeaker }: AgentConfigPanelProps) {
  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          🤖 Agent Model Configuration Preview
        </h3>
      </div>

      <div className="p-4 space-y-3">
        {participants.map((participant) => {
          const isActive = currentSpeaker === participant.role;
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
                    {participant.modelConfig.provider.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Model:</span>
                  <span className="ml-1 text-gray-300">
                    {participant.modelConfig.model}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Mode:</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded ${
                    participant.modelConfig.mode === 'mock'
                      ? 'bg-gray-700'
                      : 'bg-blue-700'
                  }`}>
                    {participant.modelConfig.mode}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-1 text-green-400">✓ Ready</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

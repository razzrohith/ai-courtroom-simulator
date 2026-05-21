/**
 * AgentPanel — Individual agent display card
 */

import type { AgentRole, AgentParticipant } from '../types/courtroom';

interface AgentPanelProps {
  participant: AgentParticipant;
  isCurrentSpeaker: boolean;
  isActive: boolean;
}

const roleColors: Record<AgentRole, { bg: string; border: string; text: string }> = {
  judge: { bg: 'bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-400' },
  prosecutor: { bg: 'bg-emerald-900/40', border: 'border-emerald-500', text: 'text-emerald-400' },
  defense: { bg: 'bg-rose-900/40', border: 'border-rose-500', text: 'text-rose-400' },
};

const roleIcons: Record<AgentRole, string> = {
  judge: '⚖️',
  prosecutor: '⚔️',
  defense: '🛡️',
};

export function AgentPanel({ participant, isCurrentSpeaker, isActive }: AgentPanelProps) {
  const colors = roleColors[participant.role];
  const isSpeaking = isActive && isCurrentSpeaker;

  return (
    <div
      className={`
        ${colors.bg} rounded-lg border ${isSpeaking ? colors.border : 'border-gray-700'}
        p-4 transition-smooth ${isSpeaking ? 'ring-2 ring-yellow-500/50 animate-pulse-glow' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{roleIcons[participant.role]}</span>
          <span className={`text-xs uppercase tracking-wider ${colors.text}`}>
            {participant.role}
          </span>
        </div>
        {isSpeaking && (
          <span className="px-2 py-0.5 bg-yellow-600 rounded text-xs text-white animate-pulse">
            SPEAKING
          </span>
        )}
      </div>

      <h4 className="font-semibold text-lg mb-1">{participant.name}</h4>
      <p className="text-sm text-gray-400 mb-3">{participant.title}</p>

      {/* Model config preview */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Provider:</span>
          <span className="text-gray-400">{participant.modelConfig.provider.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Model:</span>
          <span className="text-gray-400">{participant.modelConfig.model}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Mode:</span>
          <span className={`px-1.5 py-0.5 rounded ${
            participant.modelConfig.mode === 'mock' 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-blue-700 text-blue-200'
          }`}>
            {participant.modelConfig.mode}
          </span>
        </div>
      </div>
    </div>
  );
}

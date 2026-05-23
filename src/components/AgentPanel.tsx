/**
 * AgentPanel — Individual agent display card
 * Phase 16: Integrated with courtroom avatar visuals
 */

import type { AgentRole, AgentParticipant } from '../types/courtroom';
import { useLanguage } from '../contexts/LanguageContext';
import { getRoleLabel } from '../utils/languageMode';
import { CourtroomAvatar } from './visuals/CourtroomVisuals';
import type { AgentConnectionStatus } from '../types/providers';
import { getAgentStatusError } from '../types/providers';

interface AgentModelInfo {
  providerId: string;
  model: string;
  mode: string;
  isPlaceholder: boolean;
  status: AgentConnectionStatus;
  openRouterMode?: 'demo' | 'personal';
}

interface AgentPanelProps {
  participant: AgentParticipant;
  isCurrentSpeaker: boolean;
  isActive: boolean;
  modelInfo?: AgentModelInfo | null;
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

const statusStyles: Record<AgentConnectionStatus, { label: string; class: string }> = {
  mock: { label: 'Mock Mode', class: 'bg-green-950/60 text-green-400 border border-green-900/50' },
  'missing-key': { label: 'Missing API Key', class: 'bg-red-950/60 text-red-400 border border-red-900/50' },
  'not-tested': { label: 'API key configured — not tested', class: 'bg-blue-950/60 text-blue-400 border border-blue-900/50' },
  testing: { label: 'Testing...', class: 'bg-blue-950/60 text-blue-400 border border-blue-900/50 animate-pulse' },
  connected: { label: 'Ready / Tested OK', class: 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' },
  fallback: { label: 'Fallback active — mock mode', class: 'bg-amber-950/60 text-amber-400 border border-amber-900/50' },
  failed: { label: 'Failed', class: 'bg-red-950/60 text-red-400 border border-red-900/50' },
  'free-demo-ready': { label: 'Free demo ready', class: 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' },
  'free-demo-unavailable': { label: 'Free demo unavailable', class: 'bg-red-950/60 text-red-400 border border-red-900/50' },
  'personal-api-ready': { label: 'Personal API ready', class: 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' },
};

export function AgentPanel({ participant, isCurrentSpeaker, isActive, modelInfo }: AgentPanelProps) {
  const { mode } = useLanguage();
  const colors = roleColors[participant.role];
  const isSpeaking = isActive && isCurrentSpeaker;

  const configToTest = modelInfo ? {
    providerId: modelInfo.providerId as any,
    model: modelInfo.model,
    mode: modelInfo.mode as any
  } : undefined;

  const errorMsg = modelInfo?.status === 'failed' ? getAgentStatusError(participant.role, configToTest) : undefined;

  // Build compact provider info string for avatar
  const providerInfo = modelInfo ? (
    modelInfo.isPlaceholder 
      ? `(mock)`
      : `${modelInfo.providerId}`
  ) : undefined;

  // Get mode badge style
  const getModeBadge = () => {
    if (!modelInfo) {
      return { label: 'Mock', class: 'bg-green-950 text-green-400 border border-green-800' };
    }
    
    if (modelInfo.status === 'fallback') {
      return { label: 'Fallback', class: 'bg-amber-950 text-amber-400 border border-amber-800' };
    }
    
    switch (modelInfo.mode) {
      case 'mock':
        return { label: 'Mock', class: 'bg-green-950 text-green-400 border border-green-800' };
      case 'local':
      case 'local-placeholder':
        return { label: 'Local', class: 'bg-orange-950 text-orange-400 border border-orange-800' };
      case 'api':
      case 'api-placeholder':
        return { label: 'API', class: 'bg-purple-950 text-purple-400 border border-purple-800' };
      default:
        return { label: 'Unknown', class: 'bg-gray-800 text-gray-300' };
    }
  };

  const modeBadge = getModeBadge();
  const statusInfo = statusStyles[modelInfo?.status || 'mock'];

  return (
    <div
      className={`
        ${colors.bg} rounded-lg border ${isSpeaking ? colors.border : 'border-gray-700'}
        p-3 transition-smooth ${isSpeaking ? 'ring-2 ring-yellow-500/50' : ''}
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{roleIcons[participant.role]}</span>
        <span className={`text-xs uppercase tracking-wider ${colors.text}`}>
          {getRoleLabel(participant.role as any, mode)}
        </span>
        {isSpeaking && (
          <span className="px-2 py-0.5 bg-yellow-600 rounded text-xs text-white animate-pulse">
            SPEAKING
          </span>
        )}
      </div>

      <div className="flex items-start gap-2">
        {/* Small Courtroom Avatar indicator */}
        <CourtroomAvatar
          role={participant.role}
          isSpeaking={isSpeaking}
          providerInfo={providerInfo}
          compact={true}
        />
        
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base mb-0.5">{participant.name}</h4>
          <p className="text-xs text-gray-400 mb-2">{participant.title}</p>
        </div>
      </div>

      {/* Model configuration display */}
      <div className="text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-700/50">
        <div className="flex items-center justify-between">
          <span>Provider:</span>
          <span className="text-gray-400 font-medium capitalize">
            {modelInfo?.providerId || participant?.modelConfig?.provider?.id || 'mock'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Model:</span>
          <span className="text-gray-400 truncate max-w-[150px] font-mono" title={modelInfo?.model || participant?.modelConfig?.model || 'unknown'}>
            {modelInfo?.model || participant?.modelConfig?.model || 'unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Mode:</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${modeBadge.class}`}>
            {modeBadge.label}
          </span>
        </div>
        <div className="flex flex-col pt-1.5 gap-1">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Status</span>
          <span className={`px-2 py-1 rounded text-xs text-center font-medium ${statusInfo.class}`}>
            {statusInfo.label}
          </span>
          {modelInfo?.status === 'failed' && (
            <span className="text-[10px] text-red-400 text-center font-medium mt-1 leading-tight whitespace-pre-wrap break-all" title={errorMsg}>
              {modelInfo?.providerId === 'openrouter'
                ? (modelInfo?.openRouterMode === 'demo' ? 'Free Demo Failed' : 'Personal API Failed')
                : 'Failed'} — {errorMsg ? errorMsg.replace(/^Failed\s*—\s*/, '') : 'Connection failed'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AgentPanel — Individual agent display card.
 * Gilded Verdict redesign: glass card, role-tinted glow, animated speaking state.
 */

import { motion } from 'framer-motion';
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

const roleTheme: Record<AgentRole, { text: string; border: string; glow: string; chip: string }> = {
  judge: {
    text: 'text-brass-300',
    border: 'border-brass-500/50',
    glow: 'shadow-[0_0_24px_rgba(201,162,39,0.25)]',
    chip: 'bg-brass-500/15 text-brass-200 border-brass-500/30',
  },
  prosecutor: {
    text: 'text-sky-400',
    border: 'border-sky-500/50',
    glow: 'shadow-[0_0_24px_rgba(56,189,248,0.2)]',
    chip: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  },
  defense: {
    text: 'text-rose-400',
    border: 'border-rose-500/50',
    glow: 'shadow-[0_0_24px_rgba(251,113,133,0.2)]',
    chip: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  },
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
  const theme = roleTheme[participant.role];
  const isSpeaking = isActive && isCurrentSpeaker;

  const configToTest = modelInfo ? {
    providerId: modelInfo.providerId as any,
    model: modelInfo.model,
    mode: modelInfo.mode as any
  } : undefined;

  const errorMsg = modelInfo?.status === 'failed' ? getAgentStatusError(participant.role, configToTest) : undefined;

  const providerInfo = modelInfo ? (
    modelInfo.isPlaceholder
      ? `(mock)`
      : `${modelInfo.providerId}`
  ) : undefined;

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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={`
        glass-panel !rounded-xl p-4 transition-all duration-300
        ${isSpeaking ? `${theme.border} ${theme.glow}` : ''}
      `}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <motion.span
          className="text-xl"
          animate={isSpeaking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={isSpeaking ? { repeat: Infinity, duration: 1.4 } : undefined}
        >
          {roleIcons[participant.role]}
        </motion.span>
        <span className={`text-[11px] font-bold uppercase tracking-widest ${theme.text}`}>
          {getRoleLabel(participant.role as any, mode)}
        </span>
        {isSpeaking && (
          <span className={`ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${theme.chip}`}>
            {/* mini audio-wave */}
            <span className="flex items-end gap-[2px] h-2.5">
              <span className="speak-bar w-[2px] h-full bg-current rounded-full" />
              <span className="speak-bar w-[2px] h-full bg-current rounded-full" />
              <span className="speak-bar w-[2px] h-full bg-current rounded-full" />
            </span>
            Speaking
          </span>
        )}
      </div>

      <div className="flex items-start gap-2.5">
        <CourtroomAvatar
          role={participant.role}
          isSpeaking={isSpeaking}
          providerInfo={providerInfo}
          compact={true}
        />

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm mb-0.5 text-white truncate">{participant.name}</h4>
          <p className="text-[11px] text-gray-400 mb-1">{participant.title}</p>
        </div>
      </div>

      {/* Model configuration display */}
      <div className="text-[11px] text-gray-500 space-y-1.5 pt-2.5 mt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span>Provider:</span>
          <span className="text-gray-400 font-semibold capitalize">
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
          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${modeBadge.class}`}>
            {modeBadge.label}
          </span>
        </div>
        <div className="flex flex-col pt-1.5 gap-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status</span>
          <span className={`px-2 py-1 rounded-lg text-[11px] text-center font-semibold ${statusInfo.class}`}>
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
    </motion.div>
  );
}

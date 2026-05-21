/**
 * CourtroomVisuals — Realistic courtroom visual components
 * Phase 15: Courtroom visual overhaul
 */

import type { AgentRole } from '../../types/courtroom';
import { PHASE_LABELS } from '../../types/courtroom';

/**
 * Get accent color for agent role
 */
function getAgentColor(role: AgentRole): string {
  switch (role) {
    case 'judge': return 'text-yellow-500 border-yellow-500';
    case 'prosecutor': return 'text-blue-500 border-blue-500';
    case 'defense': return 'text-green-500 border-green-500';
    default: return 'text-gray-400 border-gray-400';
  }
}

/**
 * Get accent background for agent role
 */
function getAgentBg(role: AgentRole): string {
  switch (role) {
    case 'judge': return 'bg-yellow-500/20';
    case 'prosecutor': return 'bg-blue-500/20';
    case 'defense': return 'bg-green-500/20';
    default: return 'bg-gray-500/20';
  }
}

/**
 * Get role display label
 */
function getRoleLabel(role: AgentRole): string {
  switch (role) {
    case 'judge': return 'Hon. Judge';
    case 'prosecutor': return 'Prosecutor';
    case 'defense': return 'Defense';
    default: return role;
  }
}

/**
 * CourtroomAvatar — Agent avatar with role visualization
 */
export function CourtroomAvatar({ 
  role, 
  isSpeaking = false, 
  providerInfo,
  compact = false 
}: { 
  role: AgentRole;
  isSpeaking?: boolean;
  providerInfo?: string;
  compact?: boolean;
}) {
  const colorClass = getAgentColor(role);
  const bgClass = getAgentBg(role);
  
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${bgClass} ${isSpeaking ? 'ring-2 ring-yellow-500 animate-pulse' : ''}`}>
        <CompactAvatarIcon role={role} className="w-4 h-4" />
        <span className="text-xs font-medium text-white">{getRoleLabel(role).split(' ')[0]}</span>
        {isSpeaking && <SpeakingDot className="w-2 h-2" />}
      </div>
    );
  }
  
  return (
    <div className={`relative flex flex-col items-center transition-all duration-300 ${isSpeaking ? 'scale-105' : 'opacity-80 hover:opacity-100'}`}>
      {/* Avatar circle */}
      <div className={`
        relative w-20 h-20 rounded-full flex items-center justify-center
        ${bgClass} ${isSpeaking ? '' : colorClass.split(' ')[0]}
        ${isSpeaking ? 'ring-4 ring-yellow-500 shadow-lg shadow-yellow-500/30' : 'border-2 border-gray-600'}
        transition-all duration-300
      `}>
        <AvatarIcon role={role} className="w-10 h-10" />
        
        {/* Speaking pulse */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-50 bg-yellow-500/30" />
        )}
        
        {/* Role badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-900 border border-gray-600 flex items-center justify-center">
          <MiniBadgeIcon role={role} className="w-3 h-3" />
        </div>
      </div>
      
      {/* Role label */}
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold text-white">{getRoleLabel(role)}</div>
        {providerInfo && (
          <div className="text-xs text-gray-400 truncate max-w-[100px]">{providerInfo}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact avatar icon
 */
function CompactAvatarIcon({ role, className }: { role: AgentRole; className?: string }) {
  const fill = role === 'judge' ? '#FFD700' : role === 'prosecutor' ? '#60A5FA' : '#4ADE80';
  return (
    <svg className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" fill={fill} />
      <path d="M12 14v6m-4-3v3m8-3v3" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Full avatar icon
 */
function AvatarIcon({ role, className }: { role: AgentRole; className?: string }) {
  const color = role === 'judge' ? '#FFD700' : role === 'prosecutor' ? '#60A5FA' : '#4ADE80';
  
  switch (role) {
    case 'judge':
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path d="M12 2L8 6v2l-4 4v8h4v-4h8v4h4v-8l-4-4V6l-4-4z" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M10 4h4l-2 2z" fill={color} />
          <rect x="10" y="10" width="4" height="1" rx="0.5" fill={color} />
          <rect x="11" y="9" width="1" height="3" rx="0.5" fill={color} />
        </svg>
      );
    case 'prosecutor':
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path d="M12 3L9 6v2l-3 3v7h3v-3h6v3h3v-7l-3-3V6l-3-3z" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M12 7v3l-1 2h2v-3z" fill={color} />
          <rect x="9" y="15" width="6" height="4" rx="1" fill="none" stroke={color} strokeWidth="1" />
        </svg>
      );
    case 'defense':
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path d="M12 3L9 6v2l-3 3v7h3v-3h6v3h3v-7l-3-3V6l-3-3z" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M12 7v3l-1 2h2v-3z" fill={color} />
          <path d="M12 14l-2 3-2-1-1-3h3v3l1 2 1-2v-3h3l-1 3-2 1z" fill={color} />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" fill={color} />
          <path d="M12 14v6m-4-3v3m8-3v3" stroke={color} strokeWidth="2" />
        </svg>
      );
  }
}

/**
 * Mini badge icon
 */
function MiniBadgeIcon({ role, className }: { role: AgentRole; className?: string }) {
  if (role === 'judge') {
    return (
      <svg className={className} viewBox="0 0 16 16">
        <rect x="6" y="2" width="4" height="2" fill="#FFD700" />
        <path d="M8 4v8" stroke="#FFD700" strokeWidth="1.5" />
      </svg>
    );
  }
  if (role === 'prosecutor') {
    return (
      <svg className={className} viewBox="0 0 16 16">
        <rect x="4" y="6" width="8" height="2" fill="#60A5FA" />
        <path d="M4 10h8" stroke="#60A5FA" strokeWidth="1.5" />
      </svg>
    );
  }
  if (role === 'defense') {
    return (
      <svg className={className} viewBox="0 0 16 16">
        <path d="M8 3l-4 4v5h3v-3h2v3h3v-5l-4-4z" fill="#4ADE80" />
      </svg>
    );
  }
  return <circle cx="8" cy="8" r="4" fill="currentColor" className={className} />;
}

/**
 * Speaking dot indicator
 */
function SpeakingDot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="4" fill="currentColor">
        <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/**
 * JudgeBenchIcon — Visual representation of judge bench
 */
export function JudgeBenchSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 48" fill="none">
      {/* Bench top */}
      <rect x="4" y="8" width="56" height="8" rx="2" fill="#8B7355" />
      {/* Bench front */}
      <rect x="8" y="16" width="48" height="24" rx="2" fill="#6B5344" />
      {/* Wood grain lines */}
      <line x1="16" y1="24" x2="48" y2="24" stroke="#5B4334" strokeWidth="1" />
      <line x1="16" y1="32" x2="48" y2="32" stroke="#5B4334" strokeWidth="1" />
    </svg>
  );
}

/**
 * AttorneyTableSVG — Visual for lawyer tables
 */
export function AttorneyTableSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect x="4" y="8" width="40" height="20" rx="2" fill="#5D4E37" />
      <rect x="12" y="12" width="10" height="12" rx="1" fill="#F5F5DC" />
      <rect x="26" y="14" width="10" height="10" rx="1" fill="#F5F5DC" />
    </svg>
  );
}

/**
 * WitnessStandSVG — Visual for witness stand
 */
export function WitnessStandSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="40" width="32" height="4" rx="1" fill="#6B5344" />
      <rect x="20" y="20" width="8" height="20" fill="#5D4E37" />
      <rect x="12" y="24" width="24" height="16" rx="2" fill="#6B5344" />
      <rect x="22" y="26" width="4" height="8" fill="#D4AF37" />
      <rect x="20" y="28" width="8" height="4" fill="#D4AF37" />
    </svg>
  );
}

/**
 * PhaseBanner — Display current phase prominently
 */
export function PhaseBanner({ phase }: { phase: string }) {
  const label = PHASE_LABELS[phase as keyof typeof PHASE_LABELS] || phase;
  
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-yellow-600/50">
      {/* Court emblem */}
      <div className="w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-yellow-600">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      
      {/* Phase */}
      <div className="text-center">
        <div className="text-xs text-yellow-500 uppercase tracking-wider">Current Phase</div>
        <div className="text-lg font-serif font-bold text-white">{label}</div>
      </div>
      
      {/* Court emblem mirror */}
      <div className="w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-yellow-600">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

/**
 * SpeakingIndicator — Show who's speaking
 */
export function SpeakingIndicator({ role }: { role: AgentRole | null }) {
  if (!role) return null;
  
  const colorClass = role === 'judge' ? 'text-yellow-400' : role === 'prosecutor' ? 'text-blue-400' : 'text-green-400';
  
  return (
    <div className={`flex items-center gap-2 ${colorClass} animate-pulse`}>
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2">
          <animate attributeName="r" values="8;12;8" dur="1s" repeatCount="indefinite" />
        </circle>
        <path d="M10 10v4m4-4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-medium">{getRoleLabel(role)}</span>
      <span className="text-sm opacity-75">is speaking...</span>
    </div>
  );
}

/**
 * ObjectionAlert — Show objection notification
 */
export function ObjectionAlert({ active }: { active: boolean }) {
  if (!active) return null;
  
  return (
    <div className="fixed top-20 right-4 z-50 animate-bounce">
      <div className="bg-red-600 border-2 border-red-400 rounded-lg px-4 py-2 shadow-lg shadow-red-500/30">
        <div className="flex items-center gap-2 text-white font-bold">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" fill="currentColor" />
            <rect x="11" y="10" width="2" height="6" fill="white" />
            <circle cx="12" cy="18" r="1.5" fill="white" />
          </svg>
          OBJECTION!
        </div>
      </div>
    </div>
  );
}

/**
 * ExhibitSeal — Visual seal for restricted exhibits
 */
export function ExhibitSeal({ sealed, type = 'confidential' }: { sealed: boolean; type?: 'confidential' | 'sealed' | 'classified' }) {
  if (!sealed) return null;
  
  const colors: Record<string, string> = {
    confidential: 'bg-red-900 border-red-600 text-red-300',
    sealed: 'bg-gray-800 border-gray-500 text-gray-300',
    classified: 'bg-yellow-900 border-yellow-600 text-yellow-300',
  };
  
  return (
    <div className={`absolute top-2 right-2 px-2 py-1 rounded border ${colors[type]} text-xs font-bold uppercase tracking-wider`}>
      {type}
    </div>
  );
}

/**
 * EvidenceCard — Interactive evidence card with visual effects
 */
export function EvidenceCard({ children, highlighted, onClick }: { 
  children: React.ReactNode; 
  highlighted?: boolean;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`
        transition-all duration-200 cursor-pointer rounded-lg p-3
        hover:shadow-lg hover:shadow-yellow-500/20
        hover:-translate-y-0.5
        ${highlighted ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : 'bg-gray-800 border border-gray-700'}
      `}
    >
      {children}
    </div>
  );
}

/**
 * TranscriptMessageEntry — Animated transcript entry
 */
export function TranscriptEntryAnim({ children, isNew }: { children: React.ReactNode; isNew?: boolean }) {
  return (
    <div className={`
      transition-all duration-300 ease-out
      ${isNew ? 'translate-x-2 opacity-0' : 'translate-x-0 opacity-100'}
    `}>
      {children}
    </div>
  );
}

/**
 * VerdictSealAnimation — Show verdict reveal
 */
export function VerdictReveal({ show }: { show: boolean }) {
  if (!show) return null;
  
  return (
    <div className="animate-scale-in">
      <svg viewBox="0 0 24 24" className="w-16 h-16 text-yellow-500">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <animate attributeName="strokeDashoffset" values="63;0" dur="1s" fill="freeze" />
        </circle>
        <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <animate attributeName="strokeDashoffset" values="22;0" dur="0.5s" begin="0.5s" fill="freeze" />
        </path>
      </svg>
    </div>
  );
}

/**
 * CourtroomEmblem — Court coat of arms placeholder
 */
export function CourtroomEmblem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48">
      {/* Outer circle */}
      <circle cx="24" cy="24" r="22" fill="none" stroke="#D4AF37" strokeWidth="2" />
      {/* Inner circle */}
      <circle cx="24" cy="24" r="16" fill="none" stroke="#D4AF37" strokeWidth="1" />
      {/* Scales of justice */}
      <path d="M24 12v24m-4-4v4m8-4v4" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 20c0-4 3-6 6-6s6 2 6 6" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ============================================
// Phase 19: Enhanced Visual Components
// ============================================

/**
 * CourtroomBackdrop — Layered courtroom background effect
 */
export function CourtroomBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-lg">
      {/* Wood floor pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 48px,
          rgba(139,90,43,0.3) 48px,
          rgba(139,90,43,0.3) 50px
        )`
      }} />
      {/* Ambient light beams */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-b from-yellow-500/20 via-transparent to-transparent" />
      {/* Depth overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * JudgeBenchIllustration — Rich judge bench SVG
 */
export function JudgeBenchIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 60">
      {/* Bench base */}
      <rect x="10" y="35" width="100" height="20" rx="2" fill="#4a3728" />
      {/* Bench top surface */}
      <rect x="5" y="30" width="110" height="8" rx="2" fill="#6b4423" />
      {/* Wood grain lines */}
      <path d="M15 40h90" stroke="#5a4738" strokeWidth="0.5" opacity="0.5" />
      <path d="M15 45h90" stroke="#5a4738" strokeWidth="0.5" opacity="0.5" />
      {/* Judge seat behind bench */}
      <rect x="45" y="5" width="30" height="25" rx="3" fill="#2a2320" />
      {/* Judge chair back */}
      <rect x="50" y="8" width="20" height="20" rx="2" fill="#3a3330" stroke="#D4AF37" strokeWidth="1" />
      {/* Flag placeholder left */}
      <rect x="8" y="15" width="3" height="20" fill="#D4AF37" opacity="0.7" />
      {/* Flag placeholder right */}
      <rect x="109" y="15" width="3" height="20" fill="#D4AF37" opacity="0.7" />
    </svg>
  );
}

/**
 * AttorneyTableIllustration — Lawyer table SVG
 */
export function AttorneyTableIllustration({ className }: { className?: string; side?: 'left' | 'right' }) {
  return (
    <svg className={className} viewBox="0 0 40 30">
      {/* Table surface */}
      <rect x="2" y="12" width="36" height="14" rx="2" fill="#5a4a3a" stroke="#8a7a6a" strokeWidth="1" />
      {/* Table edge highlight */}
      <rect x="4" y="14" width="32" height="3" fill="#6a5a4a" />
      {/* Papers */}
      <rect x="8" y="8" width="8" height="6" fill="#e8e4dc" rx="0.5" />
      <rect x="18" y="6" width="10" height="8" fill="#e8e4dc" rx="0.5" />
      {/* Name plate */}
      <rect x="12" y="20" width="16" height="3" fill="#3a332a" />
    </svg>
  );
}

/**
 * WitnessStandIllustration — Witness stand SVG
 */
export function WitnessStandIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 50">
      {/* Stand base */}
      <rect x="5" y="35" width="30" height="12" fill="#4a3a2a" />
      {/* Podium */}
      <rect x="8" y="20" width="24" height="18" fill="#5a4a3a" stroke="#6a5a4a" strokeWidth="1" />
      {/* Microphone */}
      <circle cx="20" cy="15" r="3" fill="#2a2a2a" stroke="#4a4a4a" strokeWidth="1" />
      <rect x="19" y="18" width="2" height="5" fill="#3a3a3a" />
      {/* Light indicator */}
      <circle cx="20" cy="10" r="2" fill="#22c55e" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/**
 * EvidenceFolderIllustration — Evidence folder visual
 */
export function EvidenceFolderIllustration({ className, status = 'normal' }: { className?: string; status?: 'normal' | 'admitted' | 'disputed' | 'excluded' | 'sealed' }) {
  const statusColors: Record<string, string> = {
    normal: '#64748b',
    admitted: '#22c55e',
    disputed: '#f59e0b',
    excluded: '#ef4444',
    sealed: '#7c3aed',
  };
  const color = statusColors[status] || statusColors.normal;
  
  return (
    <svg className={className} viewBox="0 0 24 24">
      {/* Folder back */}
      <path d="M2 6a2 2 0 012-2h6l2 2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="#e8e4dc" />
      {/* Tab */}
      <path d="M2 4h6l2 2h-8z" fill="#d4d0c4" />
      {/* Paper edges */}
      <path d="M5 10h14M5 14h14M5 18h10" stroke="#94a3b8" strokeWidth="0.5" />
      {/* Status badge */}
      <circle cx="19" cy="19" r="4" fill={color} />
    </svg>
  );
}

/**
 * SealedEnvelopeIllustration — Sealed evidence envelope
 */
export function SealedEnvelopeIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      {/* Envelope body */}
      <rect x="2" y="6" width="20" height="14" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
      {/* Flap */}
      <path d="M2 6l10 8L22 6" fill="#fcd34d" stroke="#d97706" strokeWidth="0.5" />
      {/* Seal wax */}
      <circle cx="12" cy="14" r="3" fill="#dc2626" opacity="0.9" />
      <circle cx="12" cy="14" r="2" fill="none" stroke="#991b1b" strokeWidth="0.5" />
    </svg>
  );
}

/**
 * SpeakingPulseRing — Active speaker animation
 */
export function SpeakingPulseRing({ active, role }: { active: boolean; role: AgentRole }) {
  if (!active) return null;
  
  const colors: Record<AgentRole, string> = {
    judge: 'rgba(234, 179, 8, 0.4)',
    prosecutor: 'rgba(59, 130, 246, 0.4)',
    defense: 'rgba(34, 197, 94, 0.4)',
  };
  const color = colors[role] || colors.judge;
  
  return (
    <span className="relative inline-flex">
      <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: color.replace('0.4', '0.6') }} />
    </span>
  );
}

/**
 * RulingStampVisual — Sustained/Overruled stamp effect
 */
export function RulingStampVisual({ ruling }: { ruling: 'sustained' | 'overruled' | 'granted' | 'denied' }) {
  const isPositive = ruling === 'sustained' || ruling === 'granted';
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded border-2 font-bold uppercase tracking-wider ${
      isPositive 
        ? 'bg-green-900/50 border-green-500 text-green-400' 
        : 'bg-red-900/50 border-red-500 text-red-400'
    }`}>
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        {isPositive ? (
          <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </svg>
      {ruling}
    </div>
  );
}

/**
 * CourtReporterDesk — Court reporter station
 */
export function CourtReporterDeskIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 30">
      {/* Desk surface */}
      <rect x="2" y="15" width="36" height="12" fill="#4a4035" stroke="#6a6050" strokeWidth="1" />
      {/* Keyboard area */}
      <rect x="5" y="12" width="30" height="4" fill="#2a2520" />
      {/* Typewriter keys */}
      <rect x="8" y="10" width="3" height="2" fill="#3a3530" />
      <rect x="13" y="10" width="3" height="2" fill="#3a3530" />
      <rect x="18" y="10" width="3" height="2" fill="#3a3530" />
      <rect x="23" y="10" width="3" height="2" fill="#3a3530" />
      <rect x="28" y="10" width="3" height="2" fill="#3a3530" />
      {/* Monitor/screen */}
      <rect x="8" y="2" width="24" height="6" fill="#1a1815" stroke="#3a3530" strokeWidth="1" />
      <rect x="10" y="4" width="20" height="3" fill="#22c55e" opacity="0.6" />
      {/* Lamp */}
      <path d="M32 2v8M32 10L30 12M32 10L34 12" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/**
 * VerdictStampAnimation — Final verdict reveal animation
 */
export function VerdictStampAnimation({ show, verdict }: { show: boolean; verdict?: string }) {
  if (!show) return null;
  
  return (
    <div className="animate-scale-in">
      <div className="bg-yellow-600/20 border-4 border-yellow-500 rounded-lg p-4 rotate-[-5deg]">
        <div className="text-yellow-500 font-bold text-2xl uppercase tracking-widest text-center">
          {verdict || 'VERDICT'}
        </div>
        <div className="text-yellow-400/60 text-sm text-center mt-1">
          Court of JudgeBench
        </div>
      </div>
    </div>
  );
}

/**
 * EmptyStatePlaceholder — Consistent empty state visual
 */
export function EmptyStatePlaceholder({ 
  icon = '📋', 
  title, 
  message 
}: { 
  icon?: string; 
  title: string; 
  message: string 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-4xl mb-3 opacity-50">{icon}</div>
      <div className="text-gray-400 font-medium mb-1">{title}</div>
      <div className="text-gray-500 text-sm max-w-xs">{message}</div>
    </div>
  );
}

/**
 * LoadingSpinner — Polished loading animation
 */
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
      <div className="text-gray-400 text-sm mt-2">{message}</div>
    </div>
  );
}

/**
 * EvidenceChipImproved — Better evidence chip with status
 */
export function EvidenceChipImproved({ 
  exhibitNumber, 
  title, 
  type, 
  status = 'pending',
  side
}: { 
  exhibitNumber: string; 
  title: string; 
  type: string;
  status?: 'pending' | 'offered' | 'admitted' | 'disputed' | 'excluded' | 'sealed';
  side: 'plaintiff' | 'defense';
}) {
  const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
    pending: { bg: 'bg-gray-700', text: 'text-gray-400', icon: '⏳' },
    offered: { bg: 'bg-blue-900/40', text: 'text-blue-400', icon: '📤' },
    admitted: { bg: 'bg-green-900/40', text: 'text-green-400', icon: '✅' },
    disputed: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', icon: '⚠️' },
    excluded: { bg: 'bg-red-900/40', text: 'text-red-400', icon: '❌' },
    sealed: { bg: 'bg-purple-900/40', text: 'text-purple-400', icon: '🔒' },
  };
  const config = statusConfig[status] || statusConfig.pending;
  const sideColor = side === 'plaintiff' ? 'border-l-blue-400' : 'border-l-green-400';
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded border-l-3 ${config.bg} ${config.text} ${sideColor} border-l-2`}>
      <span className="font-bold text-sm">{exhibitNumber}</span>
      <span className="text-xs opacity-75">{type}</span>
      <span className="text-xs truncate flex-1">{title}</span>
      <span className="text-xs">{config.icon}</span>
    </div>
  );
}
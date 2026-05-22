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
    <div className={`relative flex flex-col items-center transition-all duration-300 ${isSpeaking ? 'scale-105' : 'opacity-85 hover:opacity-100'}`}>
      {/* Avatar circle */}
      <div className={`
        relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden
        ${bgClass} ${isSpeaking ? '' : colorClass.split(' ')[0]}
        ${isSpeaking ? (
          role === 'judge' ? 'ring-4 ring-yellow-500 shadow-lg shadow-yellow-500/50' :
          role === 'prosecutor' ? 'ring-4 ring-blue-500 shadow-lg shadow-blue-500/50' :
          'ring-4 ring-green-500 shadow-lg shadow-green-500/50'
        ) : 'border border-gray-700'}
        transition-all duration-300
      `}>
        <AvatarIcon role={role} isSpeaking={isSpeaking} className="w-full h-full" />
        
        {/* Speaking pulse */}
        {isSpeaking && (
          <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
            role === 'judge' ? 'bg-yellow-500' :
            role === 'prosecutor' ? 'bg-blue-500' :
            'bg-green-500'
          }`} />
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
          <div className="text-xs text-gray-400 truncate max-w-[110px] font-mono">{providerInfo}</div>
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
 * Full avatar icon - Realistic human illustrations for judge, prosecutor, and defense
 */
function AvatarIcon({ role, isSpeaking = false, className }: { role: AgentRole; isSpeaking?: boolean; className?: string }) {
  switch (role) {
    case 'judge':
      return (
        <svg className={className} viewBox="0 0 80 80" fill="none">
          <defs>
            <radialGradient id="judgeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#111827" />
            </radialGradient>
          </defs>
          <circle cx="40" cy="40" r="38" fill="url(#judgeGrad)" />
          
          {/* Hair Back */}
          <path d="M22,35 C18,20 62,20 58,35 C56,22 24,22 22,35 Z" fill="#9CA3AF" />
          
          {/* Neck */}
          <rect x="36" y="42" width="8" height="12" fill="#E0A96D" rx="2" />
          
          {/* Face */}
          <ellipse cx="40" cy="36" rx="13" ry="15" fill="#F3C590" />
          
          {/* Hair Side/Front */}
          <path d="M25,28 C25,23 30,21 34,22 C30,22 27,24 27,28 C27,33 26,38 27,42 C28,42 28,40 28,38 C28,33 26,32 25,28 Z" fill="#D1D5DB" />
          <path d="M55,28 C55,23 50,21 46,22 C50,22 53,24 53,28 C53,33 54,38 53,42 C52,42 52,40 52,38 C52,33 54,32 55,28 Z" fill="#D1D5DB" />
          <path d="M32,22 C36,18 44,18 48,22 C44,19 36,19 32,22 Z" fill="#D1D5DB" />
          
          {/* Eyes */}
          <circle cx="34" cy="34" r="1.5" fill="#1F2937" />
          <circle cx="46" cy="34" r="1.5" fill="#1F2937" />
          
          {/* Eyebrows */}
          <path d="M30,31 Q34,29 37,32" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M50,31 Q46,29 43,32" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          
          {/* Glasses */}
          <circle cx="34" cy="34" r="4.5" stroke="#F59E0B" strokeWidth="1" fill="none" />
          <circle cx="46" cy="34" r="4.5" stroke="#F59E0B" strokeWidth="1" fill="none" />
          <line x1="38.5" y1="34" x2="41.5" y2="34" stroke="#F59E0B" strokeWidth="1" />
          
          {/* Nose */}
          <path d="M40,32 L40,37 L38.5,37" stroke="#C28659" strokeWidth="1" strokeLinecap="round" fill="none" />
          
          {/* Mouth (Speech Animation) */}
          {isSpeaking ? (
            <ellipse cx="40" cy="44" rx="3.5" ry="2.2" fill="#4B1A0E" />
          ) : (
            <path d="M36,44 Q40,46 44,44" stroke="#4B1A0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          )}
          
          {/* Robe / Shoulders */}
          <path d="M15,68 C15,54 28,51 40,51 C52,51 65,54 65,68 L67,80 L13,80 Z" fill="#1F2937" />
          
          {/* Judicial collar tabs */}
          <path d="M33,51 L47,51 L45,57 L35,57 Z" fill="#F9FAFB" />
          <path d="M37,51 L43,51 L43,63 L37,63 Z" fill="#E5E7EB" />
          <line x1="40" y1="51" x2="40" y2="63" stroke="#9CA3AF" strokeWidth="0.8" />
        </svg>
      );
    case 'prosecutor':
      return (
        <svg className={className} viewBox="0 0 80 80" fill="none">
          <defs>
            <radialGradient id="prosGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#111827" />
            </radialGradient>
          </defs>
          <circle cx="40" cy="40" r="38" fill="url(#prosGrad)" />
          
          {/* Neck */}
          <rect x="36" y="42" width="8" height="12" fill="#E0A96D" rx="2" />
          
          {/* Face */}
          <ellipse cx="40" cy="35" rx="12" ry="14" fill="#F3C590" />
          
          {/* Hair */}
          <path d="M26,30 C25,21 32,17 40,17 C48,17 55,21 54,30 C51,19 29,19 26,30 Z" fill="#111827" />
          <path d="M26,30 L28,33 L29,29 Z" fill="#111827" />
          <path d="M54,30 L52,33 L51,29 Z" fill="#111827" />
          
          {/* Eyes */}
          <circle cx="34" cy="33" r="1.5" fill="#111827" />
          <circle cx="46" cy="33" r="1.5" fill="#111827" />
          
          {/* Eyebrows */}
          <path d="M30,29 Q34,28 37,30" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M50,29 Q46,28 43,30" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          
          {/* Nose */}
          <path d="M40,31 L40,36 L38.5,36" stroke="#C28659" strokeWidth="1" strokeLinecap="round" fill="none" />
          
          {/* Mouth (Speech Animation) */}
          {isSpeaking ? (
            <ellipse cx="40" cy="43" rx="4" ry="2.5" fill="#4B1A0E" />
          ) : (
            <path d="M36,43 Q40,44 44,43" stroke="#4B1A0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          )}
          
          {/* Suit / Shoulders */}
          <path d="M15,68 C15,54 28,50 40,50 C52,50 65,54 65,68 L67,80 L13,80 Z" fill="#2563EB" />
          
          {/* Shirt collar */}
          <path d="M32,50 L48,50 L40,58 Z" fill="#F9FAFB" />
          
          {/* Tie */}
          <path d="M38,52 L42,52 L44,75 L36,75 Z" fill="#DC2626" />
          <path d="M37,51 L43,51 L40,55 Z" fill="#B91C1C" />
        </svg>
      );
    case 'defense':
      return (
        <svg className={className} viewBox="0 0 80 80" fill="none">
          <defs>
            <radialGradient id="defGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#111827" />
            </radialGradient>
          </defs>
          <circle cx="40" cy="40" r="38" fill="url(#defGrad)" />
          
          {/* Hair Back */}
          <path d="M23,30 C20,18 60,18 57,30 C57,38 58,45 56,48 C55,42 55,30 23,30 Z" fill="#582F0E" />
          
          {/* Neck */}
          <rect x="36" y="42" width="8" height="12" fill="#E0A96D" rx="2" />
          
          {/* Face */}
          <ellipse cx="40" cy="35" rx="11.5" ry="13.5" fill="#F3C590" />
          
          {/* Hair Front */}
          <path d="M26,26 Q35,21 44,25 Q35,23 29,29 C27,32 26,36 26,40" stroke="#582F0E" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M54,26 Q45,21 36,25 Q45,23 51,29 C53,32 54,36 54,40" stroke="#582F0E" strokeWidth="3" strokeLinecap="round" fill="none" />
          
          {/* Eyes */}
          <circle cx="34" cy="33" r="1.5" fill="#111827" />
          <circle cx="46" cy="33" r="1.5" fill="#111827" />
          
          {/* Eyebrows */}
          <path d="M30,29.5 Q34,28.5 37,30.5" stroke="#331A00" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M50,29.5 Q46,28.5 43,30.5" stroke="#331A00" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          
          {/* Glasses */}
          <rect x="29" y="30" width="8.5" height="6.5" rx="1.5" stroke="#B45309" strokeWidth="1" fill="none" />
          <rect x="42.5" y="30" width="8.5" height="6.5" rx="1.5" stroke="#B45309" strokeWidth="1" fill="none" />
          <line x1="37.5" y1="33" x2="42.5" y2="33" stroke="#B45309" strokeWidth="1" />
          
          {/* Nose */}
          <path d="M40,32 L40,37 L38.5,37" stroke="#C28659" strokeWidth="1" strokeLinecap="round" fill="none" />
          
          {/* Mouth (Speech Animation) */}
          {isSpeaking ? (
            <ellipse cx="40" cy="43" rx="3.5" ry="2.2" fill="#4B1A0E" />
          ) : (
            <path d="M36,43 Q40,45 44,43" stroke="#4B1A0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          )}
          
          {/* Suit / Shoulders */}
          <path d="M15,68 C15,54 28,50 40,50 C52,50 65,54 65,68 L67,80 L13,80 Z" fill="#4B5563" />
          
          {/* Blouse V-Neck */}
          <path d="M31,50 L49,50 L40,59 Z" fill="#F9FAFB" />
          
          {/* Necklace */}
          <path d="M35,52 Q40,56 45,52" stroke="#D4AF37" strokeWidth="1" fill="none" />
          <circle cx="40" cy="55.5" r="1.5" fill="#D4AF37" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" fill="#9CA3AF" />
          <path d="M12 14v6m-4-3v3m8-3v3" stroke="#9CA3AF" strokeWidth="2" />
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
 * CourtroomBackdrop — Layered Indian courtroom background effect
 */
export function CourtroomBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-[#1e1510] border border-amber-950/60 rounded-xl shadow-inner min-h-[380px]">
      {/* Indian Courtroom Wall Background */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        {/* Top wall: Warm Beige/Sand color */}
        <div className="h-2/5 bg-gradient-to-b from-[#e5d3be] to-[#d6bd9f] relative border-b-8 border-[#5c4033] shadow-md">
          {/* Court Wall Framing / Molding lines */}
          <div className="absolute inset-x-8 inset-y-4 border-2 border-[#8b5a2b]/30 rounded opacity-60" />
          
          {/* Columns / Pilasters */}
          <div className="absolute left-10 top-0 bottom-0 w-8 bg-gradient-to-r from-[#d6bd9f] via-[#f2e3d3] to-[#c7ad8f] shadow-inner opacity-70" />
          <div className="absolute right-10 top-0 bottom-0 w-8 bg-gradient-to-r from-[#c7ad8f] via-[#f2e3d3] to-[#d6bd9f] shadow-inner opacity-70" />

          {/* Central Ashoka/Dharma Chakra Inspired Golden Law Wheel */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <svg className="w-24 h-24 text-amber-700/40 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="50" r="4" />
              {/* 24 spokes of the law wheel */}
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + 35 * Math.cos((i * 15 * Math.PI) / 180)}
                  y2={50 + 35 * Math.sin((i * 15 * Math.PI) / 180)}
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>
        </div>
        
        {/* Bottom wall: Teak/Mahogany Wood paneling */}
        <div className="flex-1 bg-gradient-to-b from-[#3d2b1f] to-[#1c120c] relative">
          {/* Wood panel lines */}
          <div className="absolute inset-0 opacity-15" style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 78px,
              rgba(0,0,0,0.8) 78px,
              rgba(0,0,0,0.8) 80px
            )`
          }} />
          {/* Horizon shadow/depth */}
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent" />
        </div>
      </div>
      
      {/* Light highlights */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-black/30 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">{children}</div>
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

export function EvidenceChipImproved({ 
  exhibitNumber, 
  title, 
  type, 
  status = 'pending',
  side,
  compact = false
}: { 
  exhibitNumber: string; 
  title: string; 
  type: string;
  status?: 'pending' | 'offered' | 'admitted' | 'disputed' | 'excluded' | 'sealed';
  side: 'plaintiff' | 'defense';
  compact?: boolean;
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
  
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border-l-2 ${config.bg} ${config.text} ${sideColor} text-[11px] max-w-[160px]`}>
        <span className="font-bold">{exhibitNumber}</span>
        <span className="opacity-75 truncate max-w-[90px]">{title}</span>
        <span>{config.icon}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded border-l-3 ${config.bg} ${config.text} ${sideColor} border-l-2`}>
      <span className="font-bold text-sm">{exhibitNumber}</span>
      <span className="text-xs opacity-75">{type}</span>
      <span className="text-xs truncate flex-1">{title}</span>
      <span className="text-xs">{config.icon}</span>
    </div>
  );
}

/**
 * CourtroomLiveAvatar — Detailed, animated full/half-body courtroom SVGs for Indian theme
 */
export function CourtroomLiveAvatar({ role, isSpeaking }: { role: AgentRole; isSpeaking: boolean }) {
  if (role === 'judge') {
    return (
      <svg className="w-24 h-28" viewBox="0 0 100 110" fill="none">
        {/* Breathing Base Group */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,1; 0,0"
            dur="4s"
            repeatCount="indefinite"
          />
          
          {/* Robe/Shoulders */}
          <path d="M 20 85 C 20 62, 35 55, 50 55 C 65 55, 80 62, 80 85 L 85 110 L 15 110 Z" fill="#18181b" />
          {/* Robe folds */}
          <path d="M 35 58 Q 50 75 65 58" stroke="#27272a" strokeWidth="2" fill="none" />
          <path d="M 25 80 Q 50 90 75 80" stroke="#27272a" strokeWidth="1.5" fill="none" />
          
          {/* White shirt collar */}
          <path d="M 42 55 L 58 55 L 50 63 Z" fill="#ffffff" />
          
          {/* Advocate Bands (Judicial Neckband) */}
          <rect x="44" y="55" width="5" height="18" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" rx="0.5" />
          <rect x="51" y="55" width="5" height="18" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" rx="0.5" />
          <line x1="44" y1="58" x2="49" y2="58" stroke="#cbd5e1" strokeWidth="0.5" />
          <line x1="51" y1="58" x2="56" y2="58" stroke="#cbd5e1" strokeWidth="0.5" />

          {/* Neck */}
          <rect x="45" y="44" width="10" height="12" fill="#d59c63" rx="1" />
          
          {/* Head & Face Group */}
          <g>
            {isSpeaking && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-1 50 35; 1 50 35; -1 50 35"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
            
            {/* Hair back */}
            <path d="M 32 35 C 26 22, 74 22, 68 35 C 68 18, 32 18, 32 35 Z" fill="#94a3b8" />
            
            {/* Face */}
            <ellipse cx="50" cy="33" rx="13" ry="15" fill="#e8be91" />
            
            {/* Dignified Hair Side/Front */}
            <path d="M 33 28 C 33 22, 39 20, 44 21 C 39 21, 35 23, 35 28 C 35 32, 34 36, 35 40 Z" fill="#cbd5e1" />
            <path d="M 67 28 C 67 22, 61 20, 56 21 C 61 21, 65 23, 65 28 C 65 32, 66 36, 65 40 Z" fill="#cbd5e1" />
            
            {/* Eyes */}
            <circle cx="45" cy="30" r="1.5" fill="#0f172a" />
            <circle cx="55" cy="30" r="1.5" fill="#0f172a" />
            
            {/* Eyebrows */}
            <path d="M 41 27 Q 45 25 48 28" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 59 27 Q 55 25 52 28" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            
            {/* Gold spectacles */}
            <circle cx="45" cy="30" r="4" stroke="#d97706" strokeWidth="0.8" fill="none" />
            <circle cx="55" cy="30" r="4" stroke="#d97706" strokeWidth="0.8" fill="none" />
            <line x1="49" y1="30" x2="51" y2="30" stroke="#d97706" strokeWidth="0.8" />
            
            {/* Nose */}
            <path d="M 50 29 L 50 34 L 48.5 34" stroke="#b45309" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            
            {/* Mouth */}
            {isSpeaking ? (
              <ellipse cx="50" cy="40" rx="3" ry="1.5" fill="#450a0a">
                <animate
                  attributeName="ry"
                  values="1.5; 3.5; 1.5"
                  dur="0.25s"
                  repeatCount="indefinite"
                />
              </ellipse>
            ) : (
              <path d="M 46 39 Q 50 41 54 39" stroke="#450a0a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            )}
          </g>
        </g>
      </svg>
    );
  }
  
  if (role === 'prosecutor') {
    return (
      <svg className="w-24 h-28" viewBox="0 0 100 110" fill="none">
        {/* Breathing Group */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,1.2; 0,0"
            dur="3.8s"
            repeatCount="indefinite"
          />
          
          {/* Gesturing Arm (behind body or to side) */}
          <g>
            {isSpeaking ? (
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 25 80; -8 25 80; 0 25 80"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
                {/* Arm raised */}
                <path d="M 24 75 C 20 75, 12 55, 10 45 C 8 40, 13 38, 15 42 C 18 48, 22 65, 26 75 Z" fill="#0f172a" />
                {/* Hand pointing */}
                <circle cx="10" cy="42" r="3.5" fill="#e8be91" />
                <path d="M 10 40 L 7 34" stroke="#e8be91" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            ) : (
              /* Idle arm */
              <path d="M 22 75 C 20 75, 16 90, 16 100 L 22 100 Z" fill="#0f172a" />
            )}
          </g>
          
          {/* Suit Torso */}
          <path d="M 25 80 C 25 62, 35 54, 50 54 C 65 54, 75 62, 75 80 L 80 110 L 20 110 Z" fill="#0f172a" />
          
          {/* V-neck opening for shirt */}
          <path d="M 43 54 L 57 54 L 50 68 Z" fill="#ffffff" />
          
          {/* Dual advocate bands */}
          <rect x="45" y="55" width="4.5" height="15" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="0.5" />
          <rect x="50.5" y="55" width="4.5" height="15" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="0.5" />
          
          {/* Black coat lapels */}
          <path d="M 33 54 L 43 72 L 40 100" stroke="#1e293b" strokeWidth="2.5" fill="none" />
          <path d="M 67 54 L 57 72 L 60 100" stroke="#1e293b" strokeWidth="2.5" fill="none" />
          
          {/* Neck */}
          <rect x="46" y="44" width="8" height="10" fill="#e8be91" rx="1" />
          
          {/* Head & Face Group */}
          <g>
            {isSpeaking && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-1.5 50 35; 1.5 50 35; -1.5 50 35"
                dur="1.3s"
                repeatCount="indefinite"
              />
            )}
            
            {/* Face */}
            <ellipse cx="50" cy="33" rx="12" ry="14" fill="#e8be91" />
            
            {/* Neat Black Hair */}
            <path d="M 36 28 C 34 20, 66 20, 64 28 C 64 16, 36 16, 36 28 Z" fill="#020617" />
            
            {/* Eyes */}
            <circle cx="46" cy="31" r="1.2" fill="#020617" />
            <circle cx="54" cy="31" r="1.2" fill="#020617" />
            
            {/* Eyebrows */}
            <path d="M 42 28.5 Q 46 27 48 29.5" stroke="#020617" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M 58 28.5 Q 54 27 52 29.5" stroke="#020617" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            
            {/* Nose */}
            <path d="M 50 30 L 50 34 L 49 34" stroke="#a16207" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            
            {/* Mouth */}
            {isSpeaking ? (
              <ellipse cx="50" cy="39" rx="2.5" ry="1.2" fill="#450a0a">
                <animate
                  attributeName="ry"
                  values="1.2; 2.5; 1.2"
                  dur="0.22s"
                  repeatCount="indefinite"
                />
              </ellipse>
            ) : (
              <path d="M 47 39 Q 50 40.5 53 39" stroke="#450a0a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            )}
          </g>
        </g>
      </svg>
    );
  }
  
  if (role === 'defense') {
    return (
      <svg className="w-24 h-28" viewBox="0 0 100 110" fill="none">
        {/* Breathing Group */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,1.2; 0,0"
            dur="4.2s"
            repeatCount="indefinite"
          />
          
          {/* Gesturing Arm */}
          <g>
            {isSpeaking ? (
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 75 80; 8 75 80; 0 75 80"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
                {/* Arm raised holding document */}
                <path d="M 76 75 C 80 75, 88 55, 90 45 C 92 40, 87 38, 85 42 C 82 48, 78 65, 74 75 Z" fill="#18181b" />
                {/* Hand */}
                <circle cx="90" cy="42" r="3.5" fill="#e8be91" />
                {/* Document Paper */}
                <rect x="88" y="22" width="10" height="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="0.5" transform="rotate(10 90 22)" />
                <line x1="91" y1="26" x2="96" y2="27" stroke="#94a3b8" strokeWidth="0.5" />
                <line x1="90" y1="30" x2="95" y2="31" stroke="#94a3b8" strokeWidth="0.5" />
              </g>
            ) : (
              /* Idle arm */
              <path d="M 78 75 C 80 75, 84 90, 84 100 L 78 100 Z" fill="#18181b" />
            )}
          </g>
          
          {/* Suit Torso */}
          <path d="M 25 80 C 25 62, 35 54, 50 54 C 65 54, 75 62, 75 80 L 80 110 L 20 110 Z" fill="#18181b" />
          
          {/* V-neck opening for shirt */}
          <path d="M 43 54 L 57 54 L 50 68 Z" fill="#ffffff" />
          
          {/* Dual advocate bands */}
          <rect x="45" y="55" width="4.5" height="15" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="0.5" />
          <rect x="50.5" y="55" width="4.5" height="15" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="0.5" />
          
          {/* Black coat lapels */}
          <path d="M 33 54 L 43 72 L 40 100" stroke="#27272a" strokeWidth="2.5" fill="none" />
          <path d="M 67 54 L 57 72 L 60 100" stroke="#27272a" strokeWidth="2.5" fill="none" />
          
          {/* Neck */}
          <rect x="46" y="44" width="8" height="10" fill="#e8be91" rx="1" />
          
          {/* Head & Face Group */}
          <g>
            {isSpeaking && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-1.5 50 35; 1.5 50 35; -1.5 50 35"
                dur="1.4s"
                repeatCount="indefinite"
              />
            )}
            
            {/* Face */}
            <ellipse cx="50" cy="33" rx="11.5" ry="13.5" fill="#e8be91" />
            
            {/* Female Hair Tied Back */}
            <circle cx="50" cy="18" r="4.5" fill="#3b2314" />
            <path d="M 36 28 C 34 20, 66 20, 64 28 C 64 16, 36 16, 36 28 Z" fill="#3b2314" />
            
            {/* Eyes */}
            <circle cx="46" cy="31" r="1.2" fill="#0f172a" />
            <circle cx="54" cy="31" r="1.2" fill="#0f172a" />
            
            {/* Eyebrows */}
            <path d="M 42 28.5 Q 46 27.5 48 29.5" stroke="#3b2314" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M 58 28.5 Q 54 27.5 52 29.5" stroke="#3b2314" strokeWidth="1" strokeLinecap="round" fill="none" />
            
            {/* Nose */}
            <path d="M 50 30 L 50 34 L 49 34" stroke="#a16207" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            
            {/* Mouth */}
            {isSpeaking ? (
              <ellipse cx="50" cy="39" rx="2.5" ry="1.2" fill="#450a0a">
                <animate
                  attributeName="ry"
                  values="1.2; 2.5; 1.2"
                  dur="0.24s"
                  repeatCount="indefinite"
                />
              </ellipse>
            ) : (
              <path d="M 47 39 Q 50 40.5 53 39" stroke="#450a0a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            )}
          </g>
        </g>
      </svg>
    );
  }

  return null;
}
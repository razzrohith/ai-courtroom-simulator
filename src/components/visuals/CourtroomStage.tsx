/**
 * CourtroomStage — Full cinematic courtroom stage layout
 * Phase 16: Full courtroom stage integration
 */

import type { AgentRole, AgentParticipant, CourtPhase, Evidence, Verdict, TranscriptEntry } from '../../types/courtroom';
import { PHASE_LABELS } from '../../types/courtroom';
import { 
  CourtroomBackdrop,
  PhaseBanner, 
  SpeakingIndicator, 
  ObjectionAlert,
  VerdictReveal,
  WitnessStandSVG,
  CourtroomEmblem,
  EvidenceCard,
  SpeakingPulseRing,
  CourtReporterDeskIllustration,
  EvidenceFolderIllustration,
  EvidenceChipImproved,
  CourtroomLiveAvatar
} from './CourtroomVisuals';

/**
 * Model info interface - duplicated from CourtroomLayout to avoid circular deps
 */
interface AgentModelInfo {
  providerId: string;
  model: string;
  mode: string;
  isPlaceholder: boolean;
}

interface StageParticipant extends AgentParticipant {
  modelInfo?: AgentModelInfo | null;
}

interface CourtroomStageProps {
  // Participants
  judge: StageParticipant | null;
  prosecutor: StageParticipant | null;
  defense: StageParticipant | null;
  // Current speaker state
  currentSpeaker: AgentRole | null;
  isSpeaking: boolean;
  // Case state
  currentPhase: CourtPhase;
  isActive: boolean;
  // Evidence
  evidence: Evidence[];
  // Objection state - any for ObjectionEvent
  activeObjection?: {
    status: string;
  } | null;
  // Verdict state
  showVerdict?: boolean;
  verdict?: Verdict | null;
  // Layout options
  compact?: boolean;
  latestEntry?: TranscriptEntry | null;
  isStageTyping?: boolean;
  simulationSpeaker?: AgentRole | null;
  isGenerating?: boolean;
}

export function AudioVisualizerWave({ role }: { role: AgentRole }) {
  const barColor = role === 'judge' ? '#EAB308' : role === 'prosecutor' ? '#3B82F6' : '#22C55E';
  
  return (
    <div className="flex items-end justify-center gap-[2px] h-3 px-1 py-0.5 bg-gray-950/80 rounded-full border border-gray-800">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes courtroomWave {
          0% { transform: scaleY(0.25); }
          100% { transform: scaleY(1); }
        }
      `}} />
      {[0.1, 0.3, 0.2, 0.4, 0.15].map((delay, i) => (
        <div
          key={i}
          className="w-[1.5px] h-2.5 rounded-full origin-bottom"
          style={{
            backgroundColor: barColor,
            animation: `courtroomWave 0.6s ease-in-out ${delay}s infinite alternate`
          }}
        />
      ))}
    </div>
  );
}

/**
 * Get background class for role
 */
function getRoleBg(role: AgentRole): string {
  switch (role) {
    case 'judge': return 'bg-yellow-500/20';
    case 'prosecutor': return 'bg-blue-500/20';
    case 'defense': return 'bg-green-500/20';
    default: return 'bg-gray-500/20';
  }
}

/**
 * Format provider info for compact display
 */
function formatProviderInfo(modelInfo?: AgentModelInfo | null): string {
  if (!modelInfo) return '';
  if (modelInfo.isPlaceholder) return `${modelInfo.providerId} (mock)`;
  return `${modelInfo.providerId}/${modelInfo.model}`;
}

/**
 * CourtroomStage — Full courtroom visualization
 */
export function CourtroomStage({
  judge,
  prosecutor,
  defense,
  currentSpeaker,
  isSpeaking,
  currentPhase,
  isActive,
  evidence,
  activeObjection,
  showVerdict = false,
  verdict,
  compact = false,
  latestEntry,
  isStageTyping,
  simulationSpeaker,
  isGenerating,
}: CourtroomStageProps) {
  // Check if there's an active objection
  const hasObjection = !!activeObjection;
  
  // Count admitted evidence
  const admittedEvidence = evidence.filter(e => e.status === 'admitted');
  
  if (compact) {
    return (
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <CourtReporterDeskIllustration className="w-40 h-10 mx-auto mb-4" />
        {/* Court backdrop pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 49px,
              #D4AF37 49px,
              #D4AF37 50px
            )`
          }} />
        </div>
        
        <div className="relative p-3 flex items-center justify-between">
          {/* Judge bench */}
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleBg('judge')} border-2 ${currentSpeaker === 'judge' ? 'ring-2 ring-yellow-500 animate-pulse' : 'border-gray-600'}`}>
              <span className="text-lg">⚖️</span>
            </div>
            <div className="text-xs">
              <div className="text-yellow-400 font-medium">Judge</div>
              <div className="text-gray-500 truncate max-w-[80px]">{judge?.name}</div>
            </div>
          </div>
          
          {/* Center emblem */}
          <div className="text-yellow-500">
            <CourtroomEmblem className="w-8 h-8" />
          </div>
          
          {/* Prosecutor */}
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleBg('prosecutor')} border-2 ${currentSpeaker === 'prosecutor' ? 'ring-2 ring-blue-500 animate-pulse' : 'border-gray-600'}`}>
              <span className="text-lg">⚔️</span>
            </div>
            <div className="text-xs">
              <div className="text-blue-400 font-medium">Prosecutor</div>
              <div className="text-gray-500 truncate max-w-[80px]">{prosecutor?.name}</div>
            </div>
          </div>
          
          {/* Defense */}
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleBg('defense')} border-2 ${currentSpeaker === 'defense' ? 'ring-2 ring-green-500 animate-pulse' : 'border-gray-600'}`}>
              <span className="text-lg">🛡️</span>
            </div>
            <div className="text-xs">
              <div className="text-green-400 font-medium">Defense</div>
              <div className="text-gray-500 truncate max-w-[80px]">{defense?.name}</div>
            </div>
          </div>
        </div>
        
        {/* Active speaker indicator */}
        {currentSpeaker && isActive && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <SpeakingIndicator role={currentSpeaker} />
          </div>
        )}
      </div>
    );
  }
  
  // Full cinematic stage
  return (
    <CourtroomBackdrop>
      {/* Court backdrop pattern - wood floor effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              #8B7355 39px,
              #8B7355 40px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 99px,
              #D4AF37 99px,
              #D4AF37 100px
            )
          `
        }} />
      </div>
      
      {/* Phase Banner - top of stage */}
      <PhaseBanner phase={currentPhase} />
      
      {/* Objection Alert - floating overlay */}
      {hasObjection && (
        <ObjectionAlert active={true} />
      )}
      
      {/* Verdict Reveal Animation */}
      {showVerdict && verdict && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <VerdictReveal show={true} />
        </div>
      )}
      
      {/* Main stage area */}
      <div className="relative p-4 md:p-6 min-h-[280px] flex flex-col">
        {/* Row 1: Judge Bench at top center */}
        <div className="flex justify-center mb-4">
          <JudgeStation 
            judge={judge} 
            currentSpeaker={currentSpeaker}
            isSpeaking={isSpeaking} 
            latestEntry={latestEntry}
            isStageTyping={isStageTyping}
            simulationSpeaker={simulationSpeaker}
            isGenerating={isGenerating}
          />
        </div>
        
        {/* Live Discussion panel/bubble in the middle of the stage */}
        {isActive && latestEntry && (
          <div className="my-3 mx-auto max-w-xl w-full bg-gray-950/85 backdrop-blur-md border border-gray-700/80 rounded-xl p-3.5 shadow-2xl text-left transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${
                  latestEntry.speakerRole === 'judge' ? 'bg-yellow-600' :
                  latestEntry.speakerRole === 'prosecutor' ? 'bg-blue-600' :
                  'bg-green-600'
                }`}>
                  {latestEntry.speakerRole === 'judge' ? 'Hon. Judge' : latestEntry.speakerRole === 'prosecutor' ? 'Prosecutor' : 'Defense'}
                </span>
                <span className="text-xs font-bold text-gray-250">
                  {latestEntry.speakerName}
                </span>
                {isStageTyping && (
                  <span className="text-[10px] text-yellow-500 animate-pulse font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></span>
                    Speaking...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {latestEntry.providerUsed && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
                    {latestEntry.providerUsed}
                  </span>
                )}
                <span className="text-[10px] text-gray-500 font-mono">
                  {PHASE_LABELS[currentPhase as keyof typeof PHASE_LABELS] || currentPhase}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-205 leading-relaxed font-serif min-h-[36px] max-h-[100px] overflow-y-auto pr-1 select-text">
              {latestEntry.message}
              {isStageTyping && <span className="animate-pulse text-yellow-500"> ▋</span>}
            </p>
            {latestEntry.evidenceRef && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-900 flex items-center gap-2">
                <span className="text-[9px] text-gray-500 font-medium">Evidence Cited:</span>
                <span className="text-[9px] text-yellow-450 bg-yellow-950/20 border border-yellow-900/30 px-1 py-0.5 rounded font-mono">
                  {latestEntry.evidenceRef}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Row 2: Attorney stations - sides */}
        <div className="flex justify-between items-start flex-1 -mt-2">
          {/* Left side: Prosecutor */}
          <AttorneyStation 
            participant={prosecutor}
            role="prosecutor"
            currentSpeaker={currentSpeaker}
            isSpeaking={isSpeaking}
            position="left"
            latestEntry={latestEntry}
            isStageTyping={isStageTyping}
            simulationSpeaker={simulationSpeaker}
            isGenerating={isGenerating}
          />
          
          {/* Right side: Defense */}
          <AttorneyStation 
            participant={defense}
            role="defense"
            currentSpeaker={currentSpeaker}
            isSpeaking={isSpeaking}
            position="right"
            latestEntry={latestEntry}
            isStageTyping={isStageTyping}
            simulationSpeaker={simulationSpeaker}
            isGenerating={isGenerating}
          />
        </div>
        
        {/* Row 3: Witness stand and evidence */}
        <div className="flex justify-center mt-2">
          <WitnessAndEvidenceArea 
            evidence={evidence}
            admittedCount={admittedEvidence.length}
          />
        </div>
        
        {/* Active speaker indicator - bottom center */}
        <div className="flex justify-center mt-3">
          {isActive && currentSpeaker && (
            <SpeakingIndicator role={currentSpeaker} />
          )}
        </div>
      </div>
      
      {/* Court emblem watermark */}
      <div className="absolute bottom-2 right-2 opacity-10 pointer-events-none">
        <CourtroomEmblem className="w-12 h-12" />
      </div>
    </CourtroomBackdrop>
  );
}

/**
 * SpeakerSpotlight — Radial light cone spotlight for active speaker
 */
function SpeakerSpotlight({ role, active }: { role: AgentRole; active: boolean }) {
  if (!active) return null;
  const colors = {
    judge: 'bg-yellow-500/20',
    prosecutor: 'bg-blue-500/20',
    defense: 'bg-green-500/20'
  };
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
      {/* Spotlight beam */}
      <svg className="absolute -top-[160px] -left-20 -right-20 h-[380px] w-[calc(100%+160px)] opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`spotlight-cone-${role}`} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
            <stop offset="25%" stopColor={role === 'judge' ? 'rgba(234,179,8,0.22)' : role === 'prosecutor' ? 'rgba(59,130,246,0.22)' : 'rgba(34,197,94,0.22)'} />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </linearGradient>
        </defs>
        <polygon points="42,0 58,0 100,100 0,100" fill={`url(#spotlight-cone-${role})`} />
      </svg>
      {/* Floor glow */}
      <div className={`absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-48 h-10 rounded-full blur-xl opacity-75 animate-pulse ${colors[role]}`} />
    </div>
  );
}

/**
 * Judge Station - elevated bench area
 */
function JudgeStation({ 
  judge, 
  currentSpeaker,
  isSpeaking, 
  latestEntry,
  isStageTyping,
  simulationSpeaker,
  isGenerating
}: { 
  judge: StageParticipant | null; 
  currentSpeaker: AgentRole | null;
  isSpeaking: boolean;
  latestEntry?: TranscriptEntry | null;
  isStageTyping?: boolean;
  simulationSpeaker?: AgentRole | null;
  isGenerating?: boolean;
}) {
  const role = 'judge';
  const isActive = (currentSpeaker === role && isSpeaking) || (simulationSpeaker === role && !!isGenerating);
  const hasActive = (currentSpeaker !== null && isSpeaking) || (simulationSpeaker !== null && isGenerating);
  const isDimmed = hasActive && !isActive;

  return (
    <div className="relative flex flex-col items-center transition-all duration-500">
      {/* Spotlight */}
      <SpeakerSpotlight role="judge" active={isActive} />

      {/* Elevated Dais/Bench card container */}
      <div className={`
        relative w-48 h-56 bg-gradient-to-b from-[#2d1b10] to-[#1c120c] border border-amber-950/80 rounded-xl overflow-hidden flex flex-col justify-end items-center shadow-lg
        ${isActive ? 'ring-2 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] z-20 scale-[1.03]' : ''}
        ${isDimmed ? 'opacity-40 blur-[0.5px] scale-95 saturate-[0.7]' : 'opacity-100 scale-100'}
        transition-all duration-500 ease-in-out
      `}>
        {/* Background / Arch / Wall behind the judge chair */}
        <div className="absolute top-2 w-40 h-28 bg-[#5c4033]/25 rounded-t-full border-t border-x border-[#8b5a2b]/35 -z-10" />

        {/* Judge Chair Back */}
        <div className="absolute bottom-14 w-24 h-28 bg-gradient-to-b from-[#18181b] to-[#09090b] border-2 border-yellow-600/40 rounded-t-2xl shadow-md z-0 flex flex-col justify-start pt-2 items-center">
          <div className="w-16 h-1 bg-yellow-600/30 rounded" />
        </div>

        {/* Judge Live Avatar (middle layer) */}
        <div className="z-10 mb-8 transition-transform duration-300">
          <CourtroomLiveAvatar role="judge" isSpeaking={currentSpeaker === 'judge' && isSpeaking} />
        </div>

        {/* Judge elevated bench overlay (front layer, absolute bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#3a2512] to-[#5a3b1f] border-t-4 border-[#d97706]/70 z-20 flex flex-col justify-center items-center shadow-[0_-5px_10px_rgba(0,0,0,0.6)]">
          <div className="absolute top-1 bottom-1 left-2 right-2 border border-[#8b5a2b]/30 rounded flex items-center justify-center">
            <span className="text-[10px] text-yellow-500/30 font-bold tracking-widest font-serif">COURT OF INDIA</span>
          </div>
          {/* Gavels/Papers on bench */}
          <div className="absolute -top-1.5 left-4 w-6 h-3 bg-[#e2e8f0] border border-gray-400 rounded-sm shadow-sm" style={{ transform: 'rotate(-5deg)' }} />
          <div className="absolute -top-1 left-12 w-4 h-2 bg-[#d97706] rounded-sm" />
        </div>
      </div>

      {/* Floating live context near speaker (statement persists until next turns ready) */}
      {latestEntry && latestEntry.speakerRole === 'judge' && (
        <div className="absolute bottom-[240px] left-1/2 -translate-x-1/2 w-64 bg-gray-950/95 border border-yellow-500 rounded-xl p-3 shadow-2xl z-30 transition-all duration-300 animate-scale-in text-left">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1">
            <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">🎙️ Hon. Judge</span>
            {latestEntry.providerUsed && (
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-gray-900 border border-gray-800 text-gray-400">
                {latestEntry.providerUsed}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-250 leading-relaxed italic select-text">
            "{latestEntry.message}"
            {isStageTyping && <span className="animate-pulse text-yellow-500"> ▋</span>}
          </p>
          {latestEntry.evidenceRef && (
            <div className="mt-1 pt-1 border-t border-gray-900 flex items-center gap-1.5">
              <span className="text-[8px] text-gray-500">Cited:</span>
              <span className="text-[8px] text-yellow-500 bg-yellow-950/40 px-1 rounded font-mono">
                {latestEntry.evidenceRef}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Generating/Thinking indicator near speaker */}
      {simulationSpeaker === 'judge' && isGenerating && (
        <div className="absolute bottom-[240px] left-1/2 -translate-x-1/2 w-64 bg-gray-950/95 border border-dashed border-yellow-500/50 rounded-xl p-3 shadow-2xl z-30 transition-all duration-300 animate-pulse text-left">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1">
            <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">⏳ Hon. Judge</span>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-yellow-950/40 text-yellow-550 border border-yellow-900/35">
              Generating
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed italic flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping"></span>
            Reviewing arguments and formulating response...
          </p>
        </div>
      )}

      {/* Speaking Indicator and Visualizer */}
      <div className="absolute -top-6 h-5 flex items-center gap-1.5">
        {isActive && <SpeakingPulseRing active={true} role="judge" />}
        {isActive && <AudioVisualizerWave role="judge" />}
      </div>

      {/* Name and Model label below the station card */}
      <div className="mt-2 text-center">
        <div className="text-xs font-bold text-white">{judge?.name || 'Hon. Judge'}</div>
        <div className="text-[9px] text-yellow-500/80 font-mono tracking-wider">JUDGE</div>
        {judge?.modelInfo && (
          <div className="text-[9px] text-gray-400 font-mono truncate max-w-[140px] mt-0.5">
            {formatProviderInfo(judge.modelInfo)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Attorney Station - prosecutor or defense table
 */
function AttorneyStation({ 
  participant, 
  role,
  currentSpeaker,
  isSpeaking,
  position,
  latestEntry,
  isStageTyping,
  simulationSpeaker,
  isGenerating
}: { 
  participant: StageParticipant | null; 
  role: AgentRole;
  currentSpeaker: AgentRole | null;
  isSpeaking: boolean;
  position: 'left' | 'right';
  latestEntry?: TranscriptEntry | null;
  isStageTyping?: boolean;
  simulationSpeaker?: AgentRole | null;
  isGenerating?: boolean;
}) {
  const roleColor = role === 'prosecutor' ? 'blue' : 'green';
  const roleLabel = role === 'prosecutor' ? 'Prosecution' : 'Defense';
  const accentColor = role === 'prosecutor' ? '#3B82F6' : '#22C55E';
  
  const isActive = (currentSpeaker === role && isSpeaking) || (simulationSpeaker === role && !!isGenerating);
  const hasActive = (currentSpeaker !== null && isSpeaking) || (simulationSpeaker !== null && isGenerating);
  const isDimmed = hasActive && !isActive;
  
  return (
    <div className="relative flex flex-col items-center transition-all duration-500">
      {/* Spotlight */}
      <SpeakerSpotlight role={role} active={isActive} />

      {/* Station card container */}
      <div className={`
        relative w-40 h-52 bg-gradient-to-b from-[#2d1b10] to-[#1c120c] border border-amber-950/80 rounded-xl overflow-hidden flex flex-col justify-end items-center shadow-lg
        ${isActive ? `ring-2 ring-${roleColor}-500 shadow-[0_0_20px_rgba(${role === 'prosecutor' ? '59,130,246' : '34,197,94'},0.4)] z-20 scale-[1.03]` : ''}
        ${isDimmed ? 'opacity-40 blur-[0.5px] scale-95 saturate-[0.7]' : 'opacity-100 scale-100'}
        transition-all duration-500 ease-in-out
      `}>
        {/* Office Chair Back (behind lawyer) */}
        <div className="absolute bottom-10 w-16 h-20 bg-zinc-900 border border-zinc-800 rounded-t-lg shadow-sm -z-10" />

        {/* Lawyer Live Avatar (middle layer) */}
        <div className={`
          z-10 transition-all duration-500 ease-out transform
          ${isActive ? 'translate-y-[-24px] scale-[1.08]' : 'translate-y-[8px] scale-[0.95]'}
          mb-4
        `}>
          <CourtroomLiveAvatar role={role} isSpeaking={currentSpeaker === role && isSpeaking} />
        </div>

        {/* Lawyer table overlay (front layer, absolute bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#2c1a0e] to-[#462d19] border-t-2 border-[#8b5a2b]/70 z-20 flex justify-center items-center shadow-[0_-3px_8px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0.5 bottom-0.5 left-1.5 right-1.5 border border-[#8b5a2b]/25 rounded flex items-center justify-center">
            <span className="text-[8px] text-gray-450/40 uppercase tracking-wider font-semibold">
              {roleLabel} Table
            </span>
          </div>
          {/* Papers and nameplate on table */}
          <div className="absolute -top-1 left-2 w-5 h-3 bg-white/90 border border-gray-400 rounded-sm shadow-sm" style={{ transform: 'rotate(15deg)' }} />
          <div className="absolute -top-1.5 right-4 w-6 h-3 bg-white/90 border border-gray-400 rounded-sm shadow-sm" style={{ transform: 'rotate(-5deg)' }} />
        </div>
      </div>

      {/* Floating live context near speaker (statement persists until next turns ready) */}
      {latestEntry && latestEntry.speakerRole === role && (
        <div className={`
          absolute bottom-[230px] w-64 bg-gray-950/95 border rounded-xl p-3 shadow-2xl z-30 transition-all duration-300 animate-scale-in text-left
          ${position === 'left' ? 'left-0' : 'right-0'}
        `}
        style={{ borderColor: accentColor }}
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>🎙️ {roleLabel}</span>
            {latestEntry.providerUsed && (
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-gray-900 border border-gray-800 text-gray-400">
                {latestEntry.providerUsed}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-250 leading-relaxed italic select-text">
            "{latestEntry.message}"
            {isStageTyping && <span className="animate-pulse text-yellow-500"> ▋</span>}
          </p>
          {latestEntry.evidenceRef && (
            <div className="mt-1 pt-1 border-t border-gray-900 flex items-center gap-1.5">
              <span className="text-[8px] text-gray-500">Cited:</span>
              <span className="text-[8px] text-yellow-500 bg-yellow-950/40 px-1 rounded font-mono">
                {latestEntry.evidenceRef}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Generating/Thinking indicator near speaker */}
      {simulationSpeaker === role && isGenerating && (
        <div className={`
          absolute bottom-[230px] w-64 bg-gray-950/95 border border-dashed rounded-xl p-3 shadow-2xl z-30 transition-all duration-300 animate-pulse text-left
          ${position === 'left' ? 'left-0' : 'right-0'}
        `}
        style={{ borderColor: `${accentColor}80` }}
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>⏳ {roleLabel}</span>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-gray-900 border border-gray-800 text-gray-400">
              Generating
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed italic flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }}></span>
            Preparing court statement...
          </p>
        </div>
      )}

      {/* Speaking Indicator and Visualizer */}
      <div className="absolute -top-6 h-5 flex items-center gap-1.5">
        {isActive && <SpeakingPulseRing active={true} role={role} />}
        {isActive && <AudioVisualizerWave role={role} />}
      </div>

      {/* Name and Model label below the station card */}
      <div className="mt-2 text-center">
        <div className="text-xs font-bold text-white">{participant?.name || roleLabel}</div>
        <div className="text-[9px] uppercase tracking-wider font-mono" style={{ color: accentColor }}>{roleLabel}</div>
        {participant?.modelInfo && (
          <div className="text-[9px] text-gray-450 font-mono truncate max-w-[140px] mt-0.5">
            {formatProviderInfo(participant.modelInfo)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Witness Stand and Evidence Area
 */
function WitnessAndEvidenceArea({ 
  evidence,
  admittedCount 
}: { 
  evidence: Evidence[];
  admittedCount: number;
}) {
  // Get most recent admitted evidence
  const latestEvidence = evidence
    .filter(e => e.status === 'admitted')
    .slice(-1)[0];
  
  return (
    <div className="flex items-center gap-4">
      {/* Witness stand */}
      <div className="flex flex-col items-center p-2 bg-gray-800/60 rounded-lg">
        <WitnessStandSVG className="w-16 h-16 mb-1" />
        <div className="text-xs text-yellow-500/70 font-medium">Witness Stand</div>
      </div>
      
      {/* Divider */}
      <div className="h-px w-8 bg-gray-600" />
      
      {/* Evidence display */}
      <div className="flex flex-col items-center min-w-[120px]">
        <div className="text-xs text-gray-400 mb-1">Evidence Filed</div>
        <div className="text-2xl font-bold text-yellow-500">{admittedCount}</div>
        
        {/* Latest evidence card */}
        {latestEvidence && (
          <div className="mt-2 max-w-[100px]">
            <EvidenceCard highlighted={false}>
              <EvidenceFolderIllustration status={['admitted','disputed','excluded','sealed'].includes(latestEvidence.status) ? latestEvidence.status as any : undefined} className="w-5 h-5 inline-block mr-2" />
              <div className="text-xs text-gray-300 truncate">
                {latestEvidence.exhibitNumber || latestEvidence.id}
              </div>
              <div className="text-[10px] text-gray-500 truncate">
                {latestEvidence.title}
              </div>
              <EvidenceChipImproved
                exhibitNumber={latestEvidence.exhibitNumber || latestEvidence.id}
                title={latestEvidence.title}
                type="evidence"
                status="pending"
                side="plaintiff"
              />
            </EvidenceCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourtroomStage;
/**
 * CourtroomStage — Full cinematic courtroom stage layout
 * Phase 16: Full courtroom stage integration
 */

import type { AgentRole, AgentParticipant, CourtPhase, Evidence, Verdict } from '../../types/courtroom';
import { PHASE_LABELS } from '../../types/courtroom';
import { 
  CourtroomAvatar, 
  PhaseBanner, 
  SpeakingIndicator, 
  ObjectionAlert,
  VerdictReveal,
  JudgeBenchSVG,
  AttorneyTableSVG,
  WitnessStandSVG,
  CourtroomEmblem,
  EvidenceCard
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
}: CourtroomStageProps) {
  // Check if there's an active objection
  const hasObjection = !!activeObjection;
  
  // Count admitted evidence
  const admittedEvidence = evidence.filter(e => e.status === 'admitted');
  
  if (compact) {
    return (
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden border border-gray-700">
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
    <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-lg overflow-hidden border-2 border-yellow-600/30 shadow-lg">
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
            isSpeaking={currentSpeaker === 'judge' && isSpeaking} 
            currentPhase={currentPhase}
          />
        </div>
        
        {/* Row 2: Attorney stations - sides */}
        <div className="flex justify-between items-start flex-1 -mt-2">
          {/* Left side: Prosecutor */}
          <AttorneyStation 
            participant={prosecutor}
            role="prosecutor"
            isSpeaking={currentSpeaker === 'prosecutor' && isSpeaking}
            position="left"
          />
          
          {/* Right side: Defense */}
          <AttorneyStation 
            participant={defense}
            role="defense"
            isSpeaking={currentSpeaker === 'defense' && isSpeaking}
            position="right"
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
    </div>
  );
}

/**
 * Judge Station - elevated bench area
 */
function JudgeStation({ 
  judge, 
  isSpeaking, 
  currentPhase 
}: { 
  judge: StageParticipant | null; 
  isSpeaking: boolean;
  currentPhase: CourtPhase;
}) {
  return (
    <div className={`
      flex flex-col items-center p-3 rounded-lg
      ${isSpeaking ? 'bg-yellow-500/20 ring-2 ring-yellow-500' : 'bg-gray-800/60'}
      transition-all duration-300
    `}>
      {/* Judge Bench SVG */}
      <JudgeBenchSVG className="w-32 h-16 mb-1" />
      
      {/* Judge Avatar */}
      <CourtroomAvatar 
        role="judge"
        isSpeaking={isSpeaking}
        providerInfo={formatProviderInfo(judge?.modelInfo)}
      />
      
      {/* Current phase indicator */}
      <div className="text-xs text-gray-400 mt-1">
        {PHASE_LABELS[currentPhase]}
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
  isSpeaking,
  position: _position 
}: { 
  participant: StageParticipant | null; 
  role: AgentRole;
  isSpeaking: boolean;
  position: 'left' | 'right';
}) {
  const roleColor = role === 'prosecutor' ? 'blue' : 'green';
  const roleLabel = role === 'prosecutor' ? 'Prosecution' : 'Defense';
  
  return (
    <div className={`
      flex flex-col items-center p-2 rounded-lg w-[140px]
      ${isSpeaking ? `bg-${roleColor}-500/20 ring-2 ring-${roleColor}-500` : 'bg-gray-800/60'}
      transition-all duration-300
    `}>
      {/* Table SVG */}
      <AttorneyTableSVG className="w-20 h-12 mb-1" />
      
      {/* Attorney Avatar */}
      <CourtroomAvatar 
        role={role}
        isSpeaking={isSpeaking}
        providerInfo={formatProviderInfo(participant?.modelInfo)}
      />
      
      {/* Table label */}
      <div className={`text-xs text-${roleColor}-400 mt-1 font-medium`}>
        {roleLabel} Table
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
              <div className="text-xs text-gray-300 truncate">
                {latestEvidence.exhibitNumber || latestEvidence.id}
              </div>
              <div className="text-[10px] text-gray-500 truncate">
                {latestEvidence.title}
              </div>
            </EvidenceCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourtroomStage;
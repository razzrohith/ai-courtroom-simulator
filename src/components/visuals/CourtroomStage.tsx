/**
 * CourtroomStage — Full cinematic courtroom stage layout
 * Phase 16: Full courtroom stage integration
 */

import type { AgentRole, AgentParticipant, CourtPhase, Evidence, Verdict, TranscriptEntry } from '../../types/courtroom';
import { PHASE_LABELS } from '../../types/courtroom';
import { 
  CourtroomBackdrop,
  CourtroomAvatar, 
  PhaseBanner, 
  SpeakingIndicator, 
  ObjectionAlert,
  VerdictReveal,
  JudgeBenchSVG,
  AttorneyTableSVG,
  WitnessStandSVG,
  CourtroomEmblem,
  EvidenceCard,
  SpeakingPulseRing,
  CourtReporterDeskIllustration,
  EvidenceFolderIllustration,
  EvidenceChipImproved
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
            isSpeaking={currentSpeaker === 'judge' && isSpeaking} 
            currentPhase={currentPhase}
            latestEntry={latestEntry}
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
                {latestEntry.isComplete === false && (
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
              {latestEntry.isComplete === false && <span className="animate-pulse text-yellow-500"> ▋</span>}
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
            isSpeaking={currentSpeaker === 'prosecutor' && isSpeaking}
            position="left"
            latestEntry={latestEntry}
          />
          
          {/* Right side: Defense */}
          <AttorneyStation 
            participant={defense}
            role="defense"
            isSpeaking={currentSpeaker === 'defense' && isSpeaking}
            position="right"
            latestEntry={latestEntry}
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
 * Judge Station - elevated bench area
 */
function JudgeStation({ 
  judge, 
  isSpeaking, 
  currentPhase,
  latestEntry
}: { 
  judge: StageParticipant | null; 
  isSpeaking: boolean;
  currentPhase: CourtPhase;
  latestEntry?: TranscriptEntry | null;
}) {
  return (
    <div className={`
      flex flex-col items-center p-3 rounded-lg w-[170px]
      ${isSpeaking ? 'bg-yellow-500/20 ring-2 ring-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-800/60'}
      transition-all duration-300
    `}>
      {/* Judge Bench SVG */}
      <JudgeBenchSVG className="w-32 h-16 mb-1" />
      
      {/* Speaking Indicator and Visualizer */}
      <div className="flex items-center gap-1.5 mb-1.5 h-4">
        {isSpeaking && <SpeakingPulseRing active={true} role="judge" />}
        {isSpeaking && <AudioVisualizerWave role="judge" />}
      </div>
      
      {/* Judge Avatar */}
      <CourtroomAvatar 
        role="judge"
        isSpeaking={isSpeaking}
        providerInfo={formatProviderInfo(judge?.modelInfo)}
      />

      {/* Live context near speaker */}
      {isSpeaking && latestEntry && (
        <div className="mt-2 bg-gray-950/95 border border-yellow-500/40 rounded-lg p-1.5 w-full text-center shadow-lg animate-pulse">
          <span className="text-[9px] text-yellow-450 font-bold uppercase tracking-wide block">🎙️ Speaking</span>
          <p className="text-[9px] text-gray-300 line-clamp-2 mt-0.5 leading-tight italic">
            "{latestEntry.message || '...'}"
          </p>
          {latestEntry.evidenceRef && (
            <span className="inline-block mt-1 text-[8px] bg-yellow-950/40 text-yellow-450 border border-yellow-900/40 px-1 rounded font-mono">
              📁 {latestEntry.evidenceRef}
            </span>
          )}
        </div>
      )}
      
      {/* Current phase indicator */}
      <div className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
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
  position: _position,
  latestEntry
}: { 
  participant: StageParticipant | null; 
  role: AgentRole;
  isSpeaking: boolean;
  position: 'left' | 'right';
  latestEntry?: TranscriptEntry | null;
}) {
  const roleColor = role === 'prosecutor' ? 'blue' : 'green';
  const roleLabel = role === 'prosecutor' ? 'Prosecution' : 'Defense';
  const accentColor = role === 'prosecutor' ? '#3B82F6' : '#22C55E';
  
  return (
    <div className={`
      flex flex-col items-center p-3 rounded-lg w-[150px]
      ${isSpeaking ? `bg-${roleColor}-500/20 ring-2 ring-${roleColor}-500 shadow-[0_0_15px_rgba(${role === 'prosecutor' ? '59,130,246' : '34,197,94'},0.3)]` : 'bg-gray-800/60'}
      transition-all duration-300
    `}>
      {/* Table SVG */}
      <AttorneyTableSVG className="w-20 h-12 mb-1" />
      
      {/* Speaking Indicator and Visualizer */}
      <div className="flex items-center gap-1.5 mb-1.5 h-4">
        {isSpeaking && <SpeakingPulseRing active={true} role={role} />}
        {isSpeaking && <AudioVisualizerWave role={role} />}
      </div>
      
      {/* Attorney Avatar */}
      <CourtroomAvatar 
        role={role}
        isSpeaking={isSpeaking}
        providerInfo={formatProviderInfo(participant?.modelInfo)}
      />

      {/* Live context near speaker */}
      {isSpeaking && latestEntry && (
        <div className="mt-2 bg-gray-950/95 border border-gray-700/80 rounded-lg p-1.5 w-full text-center shadow-lg">
          <span className="text-[9px] font-bold uppercase tracking-wide block" style={{ color: accentColor }}>🎙️ Speaking</span>
          <p className="text-[9px] text-gray-300 line-clamp-2 mt-0.5 leading-tight italic">
            "{latestEntry.message || '...'}"
          </p>
          {latestEntry.evidenceRef && (
            <span className="inline-block mt-1 text-[8px] bg-yellow-950/40 text-yellow-450 border border-yellow-900/40 px-1 rounded font-mono">
              📁 {latestEntry.evidenceRef}
            </span>
          )}
        </div>
      )}
      
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
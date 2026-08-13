import { useState, lazy, Suspense, Component } from 'react';
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
import StageEvidencePresenter from './StageEvidencePresenter';

import WebGLFallback from './WebGLFallback';
import { useLanguage } from '../../contexts/LanguageContext';
import { getRoleLabel } from '../../utils/languageMode';
import { summarizeCourtroomUtterance } from '../../utils/sanitizeAgentResponse';

// Lazy load the 3D stage component to split the large Three.js bundles
const Courtroom3DStage = lazy(() => import('./Courtroom3DStage'));

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class Courtroom3DErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("3D Courtroom failed to load or render:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

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
  const barColor = role === 'judge' ? '#C9A227' : role === 'prosecutor' ? '#38BDF8' : '#FB7185';
  
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
    case 'judge': return 'bg-brass-500/20';
    case 'prosecutor': return 'bg-sky-500/20';
    case 'defense': return 'bg-rose-500/20';
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

  const [webglAvailable] = useState(() => isWebGLAvailable());
  const [experimental3D, setExperimental3D] = useState(() => {
    return localStorage.getItem('judgebench.experimental3D') === 'true';
  });
  const [failed3D, setFailed3D] = useState(() => {
    return sessionStorage.getItem('3dFailed') === 'true';
  });
  const [errorKey, setErrorKey] = useState(0);

  const attempt3D = experimental3D && webglAvailable && !failed3D;


  const { mode: languageMode } = useLanguage();

  // Check if there's an active objection
  const hasObjection = !!activeObjection;
  
  // Count admitted evidence
  const admittedEvidence = evidence.filter(e => e.status === 'admitted');

  // Dynamic objection, ruling, and verdict states
  const isObjectionActive = !!activeObjection || (latestEntry?.id?.startsWith('trans-objection-') ?? false);
  const isRulingActive = (currentPhase === 'objection_ruling') || (latestEntry?.id?.startsWith('trans-ruling-') ?? false);
  const isSustained = latestEntry?.message?.toLowerCase().includes('sustained') ?? false;
  const isOverruled = latestEntry?.message?.toLowerCase().includes('overruled') ?? false;
  const isVerdictActive = showVerdict || (currentPhase === 'verdict') || !!verdict;

  let hudEvent = 'Idle 💤';
  if (isGenerating) {
    hudEvent = 'Thinking... ⏳';
  } else if (isObjectionActive) {
    hudEvent = 'Objection Raised ⚠️';
  } else if (isRulingActive) {
    hudEvent = 'Ruling Phase ⚖️';
  } else if (latestEntry?.evidenceRef) {
    hudEvent = 'Evidence Cited 📄';
  } else if (isSpeaking || isStageTyping) {
    hudEvent = 'Speaking 🎙️';
  }

  const getSpeakerHUDLabel = (role: AgentRole | null): string => {
    if (!role) return 'None';
    switch (role) {
      case 'judge': return 'Judge ⚖️';
      case 'prosecutor': return 'Prosecutor ⚔️';
      case 'defense': return 'Defense 🛡️';
      default: return role;
    }
  };

  let backdropFlashClass = '';
  if (isObjectionActive) {
    backdropFlashClass = 'red-border-flash';
  } else if (isRulingActive && isSustained) {
    backdropFlashClass = 'gold-border-flash';
  }
  
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
              <div className="text-yellow-400 font-medium">{getRoleLabel('judge', languageMode)}</div>
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
              <div className="text-blue-400 font-medium">{getRoleLabel('prosecutor', languageMode)}</div>
              <div className="text-gray-500 truncate max-w-[80px]">{prosecutor?.name}</div>
            </div>
          </div>
          
          {/* Defense */}
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleBg('defense')} border-2 ${currentSpeaker === 'defense' ? 'ring-2 ring-green-500 animate-pulse' : 'border-gray-600'}`}>
              <span className="text-lg">🛡️</span>
            </div>
            <div className="text-xs">
              <div className="text-green-400 font-medium">{getRoleLabel('defense', languageMode)}</div>
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
  
  return (
    <CourtroomBackdrop className={backdropFlashClass}>
      {/* Dynamic keyframe animations stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes objectionStampIn {
          0% { transform: scale(3.5) rotate(-25deg); opacity: 0; filter: blur(4px); }
          60% { transform: scale(0.9) rotate(-10deg); opacity: 1; filter: blur(0); }
          80% { transform: scale(1.05) rotate(-13deg); }
          100% { transform: scale(1) rotate(-12deg); opacity: 1; }
        }
        @keyframes rulingStampIn {
          0% { transform: scale(3) rotate(15deg); opacity: 0; filter: blur(3px); }
          60% { transform: scale(0.95) rotate(-3deg); opacity: 1; filter: blur(0); }
          85% { transform: scale(1.03) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes redBorderFlash {
          0%, 100% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
          50% { border-color: rgba(239, 68, 68, 0.85); box-shadow: 0 0 16px rgba(239, 68, 68, 0.45); }
        }
        @keyframes goldBorderFlash {
          0%, 100% { border-color: rgba(234, 179, 8, 0.2); box-shadow: 0 0 0 rgba(234, 179, 8, 0); }
          50% { border-color: rgba(234, 179, 8, 0.85); box-shadow: 0 0 16px rgba(234, 179, 8, 0.45); }
        }
        @keyframes verdictStampIn {
          0% { transform: scale(4) rotate(0deg); opacity: 0; }
          60% { transform: scale(0.9) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes goldParticleFloat {
          0% { transform: translateY(0px) scale(0.5); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
        }
        .red-border-flash {
          animation: redBorderFlash 1.5s ease-in-out infinite !important;
        }
        .gold-border-flash {
          animation: goldBorderFlash 1.5s ease-in-out infinite !important;
        }
      `}} />

      {/* Experimental 3D Toggle */}
      {webglAvailable && (
        <div className="absolute top-12 right-4 z-30 flex items-center gap-2 bg-gray-950/80 border border-gray-850 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-300 backdrop-blur-sm shadow-md transition-all select-none">
          <label htmlFor="experimental-3d-toggle" className="cursor-pointer">
            Experimental 3D
          </label>
          <input
            id="experimental-3d-toggle"
            type="checkbox"
            checked={experimental3D}
            onChange={(e) => {
              const val = e.target.checked;
              setExperimental3D(val);
              localStorage.setItem('judgebench.experimental3D', String(val));
              if (val) {
                sessionStorage.removeItem('3dFailed');
                setFailed3D(false);
                setErrorKey(prev => prev + 1);
              }
            }}
            className="w-3.5 h-3.5 text-yellow-600 bg-gray-900 border-gray-700 rounded focus:ring-0 cursor-pointer"
          />
        </div>
      )}

      {/* Live Director HUD - Top-Left */}
      <div className="absolute top-12 left-4 z-20 bg-gray-950/90 border border-gray-800 backdrop-blur-md px-3 py-2 rounded-xl text-left text-[9px] text-gray-400 font-mono shadow-md w-40 pointer-events-none select-none">
        <div className="text-[8px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-gray-900 pb-1 mb-1 flex items-center justify-between">
          <span>Director HUD</span>
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
        </div>
        <div className="space-y-0.5">
          <div className="truncate"><span className="text-gray-600 font-bold">PHASE:</span> {PHASE_LABELS[currentPhase] || currentPhase}</div>
          <div className="truncate"><span className="text-gray-600 font-bold">SPEAK:</span> {getSpeakerHUDLabel(simulationSpeaker || currentSpeaker)}</div>
          <div className="truncate"><span className="text-gray-600 font-bold">EVENT:</span> {hudEvent}</div>
        </div>
      </div>

      {/* Cited Exhibit Stage Badge - Top-Center */}
      {isActive && latestEntry?.evidenceRef && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-cyan-950/90 border border-cyan-800 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-scale-in pointer-events-none max-w-[90%] md:max-w-md">
          <span className="text-cyan-400 text-xs">📖</span>
          <span className="text-[10px] font-extrabold text-cyan-200 tracking-wider uppercase font-mono truncate">
            Active Exhibit: {latestEntry.evidenceRef}
          </span>
        </div>
      )}

      {/* Objection Stamp Overlay */}
      {isObjectionActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden bg-red-900/5">
          <div 
            className="px-8 py-4 border-8 border-red-500 text-red-500 font-black text-4xl md:text-5xl uppercase tracking-widest bg-gray-950/95 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center animate-scale-in"
            style={{
              fontFamily: 'Impact, sans-serif',
              animation: 'objectionStampIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              transform: 'rotate(-12deg)',
            }}
          >
            <span>OBJECTION!</span>
            <span className="text-[10px] tracking-normal font-sans font-extrabold text-red-400 mt-1 opacity-80">
              Objection raised by counsel
            </span>
          </div>
        </div>
      )}

      {/* Ruling Stamp Overlay */}
      {isRulingActive && (isSustained || isOverruled) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden bg-amber-950/5">
          <div 
            className={`px-8 py-4 border-8 font-black text-3xl md:text-4xl uppercase tracking-widest bg-gray-950/95 rounded-2xl flex flex-col items-center justify-center animate-scale-in ${
              isSustained 
                ? 'border-yellow-500 text-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.5)]' 
                : 'border-blue-500 text-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)]'
            }`}
            style={{
              fontFamily: 'Impact, sans-serif',
              animation: 'rulingStampIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            }}
          >
            <span>{isSustained ? 'SUSTAINED' : 'OVERRULED'}</span>
            <span className={`text-[9px] tracking-normal font-sans font-extrabold mt-1 opacity-80 ${isSustained ? 'text-yellow-400' : 'text-blue-400'}`}>
              {isSustained ? 'The objection is accepted by the Court' : 'The objection is dismissed by the Court'}
            </span>
          </div>
        </div>
      )}

      {/* Verdict Ceremony Overlay */}
      {showVerdict && verdict && (
        <div className="absolute inset-0 z-35 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-md pointer-events-none p-4 text-center">
          {/* Floating gold particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-yellow-500/60 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: `0%`,
                  animation: `goldParticleFloat ${2 + Math.random() * 3}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          {/* Golden Seal Stamp */}
          <div 
            className="w-24 h-24 md:w-28 md:h-28 text-yellow-500 bg-yellow-950/20 border-4 border-yellow-500 rounded-full flex items-center justify-center p-3 shadow-[0_0_40px_rgba(234,179,8,0.4)] mb-4"
            style={{
              animation: 'verdictStampIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
            }}
          >
            <CourtroomEmblem className="w-full h-full text-yellow-500" />
          </div>

          {/* Prevailing Side Banner */}
          <div className="animate-scale-in max-w-lg">
            <h2 className="text-xl md:text-2xl font-black text-yellow-450 tracking-wider uppercase font-serif">
              {verdict.decision === 'plaintiff_wins' ? 'PROSECUTION PREVAILS' : 
               verdict.decision === 'defense_wins' ? 'DEFENSE PREVAILS' : 
               verdict.decision === 'partial_verdict' ? 'PARTIAL VERDICT RENDERED' : 'CASE DISMISSED'}
            </h2>
            <div className="h-0.5 w-32 bg-yellow-500 mx-auto my-2" />
            <p className="text-xs text-gray-300 leading-relaxed font-sans max-w-sm mx-auto">
              {verdict.ruling || verdict.reasoningSummary}
            </p>
          </div>
        </div>
      )}

      {/* Court backdrop pattern - wood floor effect (only for 2D) */}
      {!attempt3D && (
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
      )}
      
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
        {experimental3D && failed3D && (
          <div className="mb-4">
            <WebGLFallback setShow3D={(show) => setFailed3D(!show)} />
          </div>
        )}

        {attempt3D ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-855 shadow-inner mb-4 bg-gray-950 min-h-[320px] sm:min-h-[400px]">
            <Courtroom3DErrorBoundary key={errorKey} fallback={<WebGLFallback setShow3D={(show) => setFailed3D(!show)} />}>
              <Suspense
                fallback={
                  <div className="w-full h-[320px] sm:h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-gray-955 to-gray-900 border border-gray-900/55 rounded-xl relative overflow-hidden">
                    <div className="w-8 h-8 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-3"></div>
                    <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest animate-pulse">
                      Entering Courtroom...
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1">Initializing 3D Graphics Engine</div>
                  </div>
                }
              >
                <Courtroom3DStage
                  currentSpeaker={simulationSpeaker || null}
                  isSpeaking={isStageTyping || false}
                  isActive={isActive}
                  judgeName={judge?.name}
                  prosecutorName={prosecutor?.name}
                  defenseName={defense?.name}
                  admittedEvidenceCount={admittedEvidence.length}
                  evidenceRef={latestEntry?.evidenceRef}
                  isRuling={isRulingActive}
                  isVerdictActive={isVerdictActive}
                  verdictDecision={verdict?.decision}
                />
              </Suspense>
            </Courtroom3DErrorBoundary>
            
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
          </div>
        ) : (
          /* Stable 2D Courtroom default experience */
          <div className="relative rounded-xl overflow-hidden border border-gray-800 shadow-inner p-6 bg-gradient-to-b from-[#0f172a] via-[#0b1329] to-[#040817] min-h-[350px] flex flex-col justify-between gap-6 mb-4">
            {/* Wood floor pattern background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 39px, #8B7355 39px, #8B7355 40px),
                repeating-linear-gradient(90deg, transparent, transparent 99px, #D4AF37 99px, #D4AF37 100px)
              `
            }} />
            
            {/* Top row: Judge Station */}
            <div className="flex justify-center z-10">
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

            {/* Middle row: Attorney Stations */}
            <div className="flex justify-between items-start gap-4 z-10 max-w-4xl mx-auto w-full px-4">
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

            {/* Bottom row: Witness stand and evidence */}
            <div className="flex justify-center z-10">
              <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl px-6 py-3 shadow-lg flex justify-center backdrop-blur-sm">
                <WitnessAndEvidenceArea 
                  evidence={evidence}
                  admittedCount={admittedEvidence.length}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Live Discussion panel/bubble in the middle of the stage */}
        {isActive && latestEntry && (
          <div className="my-3 mx-auto max-w-xl w-full bg-gray-950/85 backdrop-blur-md border border-gray-700/80 rounded-xl p-3.5 shadow-2xl text-left transition-all duration-300">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${
                  latestEntry.speakerRole === 'judge' ? 'bg-brass-600' :
                  latestEntry.speakerRole === 'prosecutor' ? 'bg-sky-600' :
                  'bg-rose-600'
                }`}>
                  {getRoleLabel(latestEntry.speakerRole as AgentRole, languageMode)}
                </span>
                <span className="text-xs font-bold text-gray-200">
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
              {summarizeCourtroomUtterance(latestEntry.message, latestEntry.speakerRole, currentPhase)}
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
        
        {/* Stage Evidence Presenter */}
        <StageEvidencePresenter evidence={evidence[evidence.length - 1]} />
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
    judge: 'bg-brass-500/20',
    prosecutor: 'bg-sky-500/20',
    defense: 'bg-rose-500/20'
  };
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
      {/* Spotlight beam */}
      <svg className="absolute -top-[160px] -left-20 -right-20 h-[380px] w-[calc(100%+160px)] opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`spotlight-cone-${role}`} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
            <stop offset="25%" stopColor={role === 'judge' ? 'rgba(201,162,39,0.22)' : role === 'prosecutor' ? 'rgba(56,189,248,0.22)' : 'rgba(251,113,133,0.22)'} />
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
          <p className="text-[11px] text-gray-200 leading-relaxed italic select-text">
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
  const { mode: languageMode } = useLanguage();
  const roleLabel = getRoleLabel(role, languageMode);
  const accentColor = role === 'prosecutor' ? '#38BDF8' : '#FB7185';
  const activeRingClass = role === 'prosecutor'
    ? 'ring-2 ring-sky-500 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
    : 'ring-2 ring-rose-500 shadow-[0_0_20px_rgba(251,113,133,0.4)]';
  
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
        ${isActive ? `${activeRingClass} z-20 scale-[1.03]` : ''}
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
          <p className="text-[11px] text-gray-200 leading-relaxed italic select-text">
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
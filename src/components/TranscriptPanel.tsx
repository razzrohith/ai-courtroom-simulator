/**
 * TranscriptPanel — Live transcript display with court reporter styling
 * Phase 18: Streaming typewriter and token usage display
 */

import { useState, useEffect, useRef } from 'react';
import type { TranscriptEntry, AgentRole } from '../types/courtroom';
import { EmptyStatePlaceholder, CourtReporterDeskIllustration, EvidenceChipImproved, LoadingSpinner } from './visuals/CourtroomVisuals';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

// Typewriter hook - tracks completion per entry ID
const typewriterState = new Map<string, { complete: boolean }>();

function useTypewriter(fullText: string, entryId: string) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const stateRef = useRef(typewriterState.get(entryId));

  useEffect(() => {
    // Check if we've seen this entry before
    if (stateRef.current?.complete) {
      setDisplayedText(fullText);
      setIsComplete(true);
      return;
    }
    
    // First time seeing this entry - animate it
    typewriterState.set(entryId, { complete: false });
    stateRef.current = { complete: false };
    setDisplayedText('');
    setIsComplete(false);
    
    if (!fullText) {
      setDisplayedText(fullText);
      setIsComplete(true);
      typewriterState.set(entryId, { complete: true });
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        index += 4; // Snappier typewriter speedup (4 characters per tick)
        setDisplayedText(fullText.slice(0, index));
      } else {
        setDisplayedText(fullText);
        setIsComplete(true);
        typewriterState.set(entryId, { complete: true });
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [fullText, entryId]);

  return { displayedText, isComplete };
}

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  currentPhase: string;
  speech: ReturnType<typeof useSpeechSynthesis>;
  activeStageEntryId?: string;
}

const speakerStyles: Record<AgentRole, { bg: string; border: string; icon: string; label: string }> = {
  judge: { bg: 'bg-yellow-900/20', border: 'border-l-yellow-500', icon: '', label: 'Hon. Judge' },
  prosecutor: { bg: 'bg-blue-900/20', border: 'border-l-blue-500', icon: '', label: 'Prosecutor' },
  defense: { bg: 'bg-green-900/20', border: 'border-l-green-500', icon: '', label: 'Defense' },
};

const speakerBadges: Record<AgentRole, string> = {
  judge: 'bg-yellow-600',
  prosecutor: 'bg-blue-600',
  defense: 'bg-green-600',
};

interface TranscriptEntryItemProps {
  entry: TranscriptEntry;
  isLatest: boolean;
}

function TranscriptEntryItem({ entry, isLatest }: TranscriptEntryItemProps) {
  const style = speakerStyles[entry.speakerRole] || {
    bg: 'bg-gray-900/20',
    border: 'border-l-gray-500',
    icon: '',
    label: entry.speakerRole ? entry.speakerRole.toUpperCase() : 'System',
  };
  const badge = speakerBadges[entry.speakerRole] || 'bg-gray-600';
  
  // Auto-animate each entry on first render
  const { displayedText, isComplete } = useTypewriter(entry.message || '', entry.id);

  return (
    <div className={`transcript-entry ${style.bg} border-l-4 ${style.border} rounded-r-md p-3 mb-2 transition-all duration-300 ${
      isLatest ? 'ring-2 ring-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-[1.01]' : ''
    }`}>
      <div className="flex items-center gap-2 mb-1">
        {/* Speaker badge */}
        <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${badge}`}>
          {style.label}
        </span>
        <span className="text-sm font-medium text-gray-200">
          {entry.speakerName || 'Unknown'}
        </span>
        {isLatest && (
          <span className="animate-pulse bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2">
            Latest Turn
          </span>
        )}
        <span className="text-xs text-gray-500 ml-auto font-mono">
          #{entry.sequenceNumber || 0}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-300">
        {displayedText}
        {!isComplete && <span className="animate-pulse">▊</span>}
      </p>
      
      {/* Evidence references */}
      {entry.evidenceRef && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.evidenceRef.split(',').map(ref => (
            <EvidenceChipImproved
              key={ref}
              exhibitNumber={ref.trim()}
              title={ref.trim()}
              type="evidence"
              status="pending"
              side={entry.speakerRole === 'defense' ? 'defense' : 'plaintiff'}
              compact={true}
            />
          ))}
        </div>
      )}
      {(entry.providerUsed || entry.isComplete !== undefined) && (
        <div className="mt-2 pt-2 border-t border-gray-700/30 flex flex-wrap gap-1">
          {/* Streaming/complete status */}
          {entry.isComplete === false && (
            <LoadingSpinner message="Generating..." />
          )}
          {entry.providerUsed && (
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${
              entry.responseSource === 'real' ? 'bg-green-900/40 text-green-400' :
              entry.responseSource === 'fallback' ? 'bg-orange-900/40 text-orange-400' :
              'bg-gray-700 text-gray-400'
            }`}>
              {entry.providerUsed}
            </span>
          )}
          {entry.responseSource === 'fallback' && (
            <span className="text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-400">
              Fallback
            </span>
          )}
          {entry.isComplete && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-500">
              ✓ Done
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function TranscriptPanel({ transcript, currentPhase, speech, activeStageEntryId }: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { supported, voices, speaking, settings, updateSetting, speak, stopSpeaking } = speech;
  
  // Auto-read logic
  const lastSpokenIdRef = useRef<string | null>(null);
  const lastTranscriptLengthRef = useRef<number>(0);

  useEffect(() => {
    if (transcript.length === 0) {
      lastSpokenIdRef.current = null;
      lastTranscriptLengthRef.current = 0;
      return;
    }

    const latestEntry = transcript[transcript.length - 1];

    // If a new turn starts, stop any ongoing speech immediately
    if (transcript.length > lastTranscriptLengthRef.current) {
      stopSpeaking();
      lastTranscriptLengthRef.current = transcript.length;
    }

    // Only speak completed agent turns that we haven't spoken yet
    if (latestEntry && latestEntry.isComplete && latestEntry.id !== lastSpokenIdRef.current) {
      if (settings.enabled && settings.autoRead) {
        speak(latestEntry);
      }
      lastSpokenIdRef.current = latestEntry.id;
    }
  }, [transcript, settings.enabled, settings.autoRead, speak, stopSpeaking]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript.length]);

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
        <CourtReporterDeskIllustration className="w-12 h-12 mb-2" />
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-yellow-500 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Court Transcript
          </h3>
          <span className="text-xs text-gray-500">{currentPhase}</span>
        </div>
      </div>

      {/* Voice Warning if not supported */}
      {!supported && (
        <div className="text-red-400 text-[11px] font-semibold px-3 py-1.5 bg-red-950/20 border-b border-red-900/30">
          ⚠️ Voice playback is not available in this browser.
        </div>
      )}

      {/* Voice Playback Toolbar */}
      {supported && (
        <div className="px-3 py-2 bg-gray-900/60 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Enable/Disable button */}
            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all duration-200 ${
                settings.enabled
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40'
                  : 'bg-gray-800 text-gray-400 border border-gray-700/60 hover:bg-gray-750'
              }`}
            >
              {settings.enabled ? '🔊 Voice On' : '🔇 Voice Off'}
            </button>

            {settings.enabled && (
              <>
                {/* Auto-read Toggle */}
                <button
                  onClick={() => updateSetting('autoRead', !settings.autoRead)}
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all duration-200 ${
                    settings.autoRead
                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40'
                      : 'bg-gray-800 text-gray-500 border border-gray-700/60 hover:bg-gray-750'
                  }`}
                  title="Speak new completed turns automatically"
                >
                  {settings.autoRead ? '🤖 Auto-read On' : '🤖 Auto-read Off'}
                </button>

                {/* Play Latest Button */}
                <button
                  onClick={() => {
                    if (transcript.length > 0) {
                      const latest = transcript[transcript.length - 1];
                      if (latest && latest.isComplete) {
                        speak(latest);
                      }
                    }
                  }}
                  disabled={transcript.length === 0}
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all duration-200 ${
                    transcript.length > 0
                      ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-600/30 active:scale-95'
                      : 'bg-gray-800/40 text-gray-600 border border-gray-800 cursor-not-allowed'
                  }`}
                >
                  ▶️ Play Latest
                </button>

                {/* Stop Button */}
                {speaking && (
                  <button
                    onClick={stopSpeaking}
                    className="px-2.5 py-1 rounded font-medium flex items-center gap-1 bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/30 active:scale-95"
                  >
                    ⏹️ Stop
                  </button>
                )}
              </>
            )}
          </div>

          {settings.enabled && (
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {/* Voice select */}
              {voices.length > 0 && (
                <select
                  value={settings.voiceName}
                  onChange={(e) => updateSetting('voiceName', e.target.value)}
                  className="bg-gray-850 border border-gray-750 text-gray-300 rounded px-1.5 py-0.5 max-w-[130px] truncate focus:outline-none focus:border-yellow-500"
                  title="Select Default Voice"
                >
                  <option value="">Auto (Distinct Voices)</option>
                  {voices.filter(v => v.lang.toLowerCase().startsWith('en')).map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              )}

              {/* Speed select */}
              <select
                value={settings.speed}
                onChange={(e) => updateSetting('speed', e.target.value as 'slow' | 'normal' | 'fast')}
                className="bg-gray-850 border border-gray-750 text-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-yellow-500"
                title="Select Speed"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          )}
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {transcript.length === 0 ? (
          <EmptyStatePlaceholder 
            icon="📜" 
            title="Awaiting Trial Transcript" 
            message="The court reporter will record proceedings as they unfold." 
          />
        ) : (
          transcript
          .filter(entry => entry.id !== activeStageEntryId)
          .map((entry, index) => (
            <TranscriptEntryItem 
              key={entry.id} 
              entry={entry} 
              isLatest={index === transcript.length - 1} 
            />
          ))
        )}
      </div>
    </div>
  );
}

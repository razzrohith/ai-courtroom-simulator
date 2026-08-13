/**
 * TranscriptPanel — Live transcript display with court reporter styling.
 * Gilded Verdict redesign: motion-animated entries, glass chrome,
 * role-tinted speaker rails. Speech-synthesis toolbar preserved.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TranscriptEntry, AgentRole } from '../types/courtroom';
import { EmptyStatePlaceholder, EvidenceChipImproved, LoadingSpinner } from './visuals/CourtroomVisuals';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

// Typewriter hook - tracks completion per entry ID
const typewriterState = new Map<string, { complete: boolean }>();

function useTypewriter(fullText: string, entryId: string) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const stateRef = useRef(typewriterState.get(entryId));

  useEffect(() => {
    if (stateRef.current?.complete) {
      setDisplayedText(fullText);
      setIsComplete(true);
      return;
    }

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
        index += 4;
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

const speakerStyles: Record<AgentRole, { rail: string; badge: string; label: string; nameColor: string }> = {
  judge: {
    rail: 'border-l-brass-500 bg-brass-500/[0.06]',
    badge: 'bg-brass-500/20 text-brass-200 border border-brass-500/40',
    label: 'Hon. Judge',
    nameColor: 'text-brass-200',
  },
  prosecutor: {
    rail: 'border-l-sky-500 bg-sky-500/[0.05]',
    badge: 'bg-sky-500/15 text-sky-300 border border-sky-500/40',
    label: 'Prosecutor',
    nameColor: 'text-sky-200',
  },
  defense: {
    rail: 'border-l-rose-500 bg-rose-500/[0.05]',
    badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/40',
    label: 'Defense',
    nameColor: 'text-rose-200',
  },
};

interface TranscriptEntryItemProps {
  entry: TranscriptEntry;
  isLatest: boolean;
}

function TranscriptEntryItem({ entry, isLatest }: TranscriptEntryItemProps) {
  const style = speakerStyles[entry.speakerRole] || {
    rail: 'border-l-gray-500 bg-gray-500/[0.05]',
    badge: 'bg-gray-700 text-gray-300 border border-gray-600',
    label: entry.speakerRole ? entry.speakerRole.toUpperCase() : 'System',
    nameColor: 'text-gray-200',
  };

  const { displayedText, isComplete } = useTypewriter(entry.message || '', entry.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`border-l-[3px] ${style.rail} rounded-r-xl p-3.5 transition-shadow duration-300 ${
        isLatest ? 'ring-1 ring-brass-500/40 shadow-glow-brass' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${style.badge}`}>
          {style.label}
        </span>
        <span className={`text-xs font-bold ${style.nameColor}`}>
          {entry.speakerName || 'Unknown'}
        </span>
        {isLatest && (
          <span className="animate-pulse bg-brass-500/15 text-brass-300 border border-brass-500/30 text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ml-1 tracking-wider">
            Latest
          </span>
        )}
        <span className="text-[10px] text-gray-600 ml-auto font-mono tabular-nums">
          #{entry.sequenceNumber || 0}
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-gray-300">
        {displayedText}
        {!isComplete && <span className="typewriter-caret text-brass-300">▊</span>}
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
        <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-1 items-center">
          {entry.isComplete === false && <LoadingSpinner message="Generating..." />}
          {entry.providerUsed && (
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
              entry.responseSource === 'real' ? 'bg-emerald-950/50 text-emerald-400' :
              entry.responseSource === 'fallback' ? 'bg-orange-950/50 text-orange-400' :
              'bg-white/5 text-gray-500'
            }`}>
              {entry.providerUsed}
            </span>
          )}
          {entry.responseSource === 'fallback' && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-950/50 text-red-400">
              Fallback
            </span>
          )}
          {entry.isComplete && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-500">
              ✓ Done
            </span>
          )}
          {entry.argumentScore && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold tabular-nums ${
                entry.argumentScore.total >= 24
                  ? 'bg-emerald-950/50 text-emerald-300'
                  : entry.argumentScore.total >= 14
                  ? 'bg-brass-500/15 text-brass-300'
                  : 'bg-white/5 text-gray-500'
              }`}
              title={`Argument score — relevance ${entry.argumentScore.relevance}/10, evidence ${entry.argumentScore.evidenceUse}/10, rebuttal ${entry.argumentScore.rebuttal}/10, persuasion ${entry.argumentScore.persuasion}/10${entry.argumentScore.rationale ? ` — ${entry.argumentScore.rationale}` : ''}`}
            >
              ⚖ {entry.argumentScore.total}/40
            </span>
          )}
        </div>
      )}
    </motion.div>
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

    if (transcript.length > lastTranscriptLengthRef.current) {
      stopSpeaking();
      lastTranscriptLengthRef.current = transcript.length;
    }

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
    <div className="flex flex-col h-full">
      <div className="p-3.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-brass-300 uppercase tracking-widest flex items-center gap-2">
            <span className="text-base">📜</span>
            Court Transcript
          </h3>
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{currentPhase}</span>
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
        <div className="px-3 py-2 bg-white/[0.015] border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                settings.enabled
                  ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/35'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {settings.enabled ? '🔊 Voice On' : '🔇 Voice Off'}
            </button>

            {settings.enabled && (
              <>
                <button
                  onClick={() => updateSetting('autoRead', !settings.autoRead)}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                    settings.autoRead
                      ? 'bg-sky-600/25 text-sky-300 border border-sky-500/30 hover:bg-sky-600/35'
                      : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                  }`}
                  title="Speak new completed turns automatically"
                >
                  {settings.autoRead ? '🤖 Auto-read On' : '🤖 Auto-read Off'}
                </button>

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
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all duration-200 ${
                    transcript.length > 0
                      ? 'bg-brass-500/15 text-brass-300 border border-brass-500/30 hover:bg-brass-500/25 active:scale-95'
                      : 'bg-white/[0.02] text-gray-600 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  ▶️ Play Latest
                </button>

                {speaking && (
                  <button
                    onClick={stopSpeaking}
                    className="px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 active:scale-95"
                  >
                    ⏹️ Stop
                  </button>
                )}
              </>
            )}
          </div>

          {settings.enabled && (
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {voices.length > 0 && (
                <select
                  value={settings.voiceName}
                  onChange={(e) => updateSetting('voiceName', e.target.value)}
                  className="bg-ink-800 border border-white/10 text-gray-300 rounded-lg px-1.5 py-0.5 max-w-[130px] truncate focus:outline-none focus:border-brass-500"
                  title="Select Default Voice"
                >
                  <option value="">Auto (Distinct Voices)</option>
                  {voices.filter(v => v.lang.toLowerCase().startsWith('en')).map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              )}

              <select
                value={settings.speed}
                onChange={(e) => updateSetting('speed', e.target.value as 'slow' | 'normal' | 'fast')}
                className="bg-ink-800 border border-white/10 text-gray-300 rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-brass-500"
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

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {transcript.length === 0 ? (
          <EmptyStatePlaceholder
            icon="📜"
            title="Awaiting Trial Transcript"
            message="The court reporter will record proceedings as they unfold."
          />
        ) : (
          <AnimatePresence initial={false}>
            {transcript
              .filter(entry => entry.id !== activeStageEntryId)
              .map((entry, index, arr) => (
                <TranscriptEntryItem
                  key={entry.id}
                  entry={entry}
                  isLatest={index === arr.length - 1}
                />
              ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

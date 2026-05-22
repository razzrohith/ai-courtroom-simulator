/**
 * TranscriptPanel — Live transcript display with court reporter styling
 * Phase 18: Streaming typewriter and token usage display
 */

import { useState, useEffect, useRef } from 'react';
import type { TranscriptEntry, AgentRole } from '../types/courtroom';
import { EmptyStatePlaceholder, CourtReporterDeskIllustration, EvidenceChipImproved, LoadingSpinner } from './visuals/CourtroomVisuals';

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
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
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
}

function TranscriptEntryItem({ entry }: TranscriptEntryItemProps) {
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
    <div className={`transcript-entry ${style.bg} border-l-4 ${style.border} rounded-r-md p-3 mb-2`}>
      <div className="flex items-center gap-2 mb-1">
        {/* Speaker badge */}
        <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${badge}`}>
          {style.label}
        </span>
        <span className="text-sm font-medium text-gray-200">
          {entry.speakerName || 'Unknown'}
        </span>
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
              side="plaintiff"
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

export function TranscriptPanel({ transcript, currentPhase }: TranscriptPanelProps) {
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

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {transcript.length === 0 ? (
          <EmptyStatePlaceholder 
            icon="📜" 
            title="Awaiting Trial Transcript" 
            message="The court reporter will record proceedings as they unfold." 
          />
        ) : (
          transcript.map((entry) => (
            <TranscriptEntryItem key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

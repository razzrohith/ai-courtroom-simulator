/**
 * TranscriptPanel — Live transcript display
 */

import type { TranscriptEntry, AgentRole } from '../types/courtroom';

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  currentPhase: string;
}

const speakerStyles: Record<AgentRole, { bg: string; border: string; icon: string }> = {
  judge: { bg: 'bg-blue-900/30', border: 'border-l-blue-500', icon: '⚖️' },
  prosecutor: { bg: 'bg-emerald-900/30', border: 'border-l-emerald-500', icon: '⚔️' },
  defense: { bg: 'bg-rose-900/30', border: 'border-l-rose-500', icon: '🛡️' },
};

export function TranscriptPanel({ transcript, currentPhase }: TranscriptPanelProps) {
  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          📝 Live Transcript
        </h3>
        <p className="text-xs text-gray-500 mt-1">Phase: {currentPhase}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {transcript.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Waiting for transcript to begin...
          </p>
        ) : (
          transcript.map((entry) => {
            const style = speakerStyles[entry.speakerRole];
            return (
              <div
                key={entry.id}
                className={`transcript-entry ${style.bg} border-l-4 ${style.border}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{style.icon}</span>
                  <span className="text-sm font-medium">
                    {entry.speakerName}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    #{entry.sequenceNumber}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{entry.message}</p>
                
                {/* Evidence references */}
                {entry.evidenceRef && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.evidenceRef.split(',').map(ref => (
                      <span key={ref} className="text-xs px-2 py-0.5 rounded bg-amber-900/30 text-amber-400">
                        📎 {ref.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata: provider, model, source */}
                {(entry.providerUsed || entry.isComplete !== undefined) && (
                  <div className="mt-2 pt-2 border-t border-gray-700/30 flex flex-wrap gap-1">
                    {/* Streaming/complete status */}
                    {entry.isComplete === false && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 animate-pulse">
                        ⏳ Generating...
                      </span>
                    )}
                    {entry.providerUsed && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        entry.responseSource === 'real' ? 'bg-green-900/30 text-green-400' :
                        entry.responseSource === 'fallback' ? 'bg-orange-900/30 text-orange-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {entry.providerUsed}/{entry.modelUsed}
                      </span>
                    )}
                    {entry.responseSource === 'fallback' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400">
                        Fallback
                      </span>
                    )}
                    {entry.isComplete && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500">
                        ✓ Complete
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

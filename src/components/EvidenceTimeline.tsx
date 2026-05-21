/**
 * EvidenceTimeline — Visual timeline of evidence through phases
 * Phase 8: Shows evidence progression and status changes
 */

import type { Evidence, EvidenceStatus } from '../types/courtroom';

interface EvidenceTimelineProps {
  evidence: Evidence[];
}

const statusLabels: Record<EvidenceStatus, string> = {
  pending: 'Pending',
  introduced: 'Introduced',
  disputed: 'Disputed',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const statusColors: Record<EvidenceStatus, string> = {
  pending: 'text-gray-400',
  introduced: 'text-blue-400',
  disputed: 'text-red-400',
  accepted: 'text-green-400',
  rejected: 'text-red-500',
};

export function EvidenceTimeline({ evidence }: EvidenceTimelineProps) {
  // Sort by reference count (referenced first), then by ID
  const refCount = (e: Evidence) => e.referenceCount ?? 0;
  const sortedEvidence = [...evidence].sort((a, b) => {
    const aRefs = refCount(a);
    const bRefs = refCount(b);
    if (aRefs === 0 && bRefs === 0) return a.id.localeCompare(b.id);
    if (aRefs === 0) return 1;
    if (bRefs === 0) return -1;
    return (a.firstReferencedPhase || 'case_setup').localeCompare(b.firstReferencedPhase || 'case_setup');
  });

  const hasRefs = sortedEvidence.some(e => (e.referenceCount ?? 0) > 0);
  if (!hasRefs) {
    return (
      <div className="bg-courtroom-card rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
          📊 Evidence Timeline
        </h3>
        <p className="text-xs text-gray-500">No evidence referenced yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          📊 Evidence Timeline
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {evidence.filter(e => (e.referenceCount ?? 0) > 0).length} referenced
        </p>
      </div>

      <div className="p-4 max-h-[400px] overflow-y-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-700"></div>

          <div className="space-y-4">
            {sortedEvidence.filter(e => (e.referenceCount ?? 0) > 0).map((item) => (
              <div key={item.id} className="relative pl-8">
                {/* Timeline dot */}
                <div className={`absolute left-1.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
                  item.status === 'accepted' ? 'bg-green-500' :
                  item.status === 'disputed' ? 'bg-red-500' :
                  item.status === 'introduced' ? 'bg-blue-500' :
                  'bg-gray-600'
                }`}></div>

                <div className="bg-gray-800 rounded p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-300">{item.id}</span>
                    <span className={`font-medium ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-1">{item.title}</p>

                  <div className="flex items-center gap-3 text-gray-500">
                    {item.firstReferencedPhase && (
                      <span>First: {item.firstReferencedPhase.replace('_', ' ')}</span>
                    )}
                    <span>Refs: {item.referenceCount ?? 0}</span>
                    {item.lastReferencedBy && (
                      <span>By: {item.lastReferencedBy}</span>
                    )}
                  </div>

                  {item.objectionId && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-red-400">
                      ⚠️ Linked to objection {item.objectionId.slice(-6)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

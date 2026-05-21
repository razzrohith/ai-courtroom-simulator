/**
 * ObjectionHistoryPanel — Display recent objections and rulings
 * Phase 7.5: Include ruling controls for pending objections
 */

import type { ObjectionEvent } from '../types/courtroom';
import { EmptyStatePlaceholder, RulingStampVisual } from './visuals/CourtroomVisuals';

interface ObjectionHistoryPanelProps {
  objections: ObjectionEvent[];
  onRuling?: (objectionId: string, sustained: boolean, targetEvidence?: string) => void;
}

export function ObjectionHistoryPanel({ objections, onRuling }: ObjectionHistoryPanelProps) {
  // Group by status: pending first, then recent
  const pendingObj = objections.filter(o => o.status === 'pending');
  const resolvedObj = objections.filter(o => o.status !== 'pending').slice(-5).reverse();

  const hasPending = pendingObj.length > 0;
  const hasResolved = resolvedObj.length > 0;

  if (!hasPending && !hasResolved) {
    return (
      <div className="bg-courtroom-card border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">⚖️ Objection History</h3>
        <EmptyStatePlaceholder 
          icon="⚖️" 
          title="No Objections Yet" 
          message="Objections will appear when attorneys raise them during trial." 
        />
      </div>
    );
  }

  return (
    <div className="bg-courtroom-card border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">⚖️ Objection History</h3>
      
      {/* Pending objections with ruling buttons */}
      {pendingObj.map(obj => (
        <div key={obj.id} className="mb-3 p-2 bg-gray-800 rounded border-l-2 border-yellow-500">
          <div className="flex items-center justify-between">
            <span className="font-medium text-yellow-400 capitalize">{obj.raisedBy}</span>
            <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-900 text-yellow-200">
              PENDING
            </span>
          </div>
          <p className="text-gray-300 mt-1 font-medium">{obj.type}</p>
          {obj.targetEvidence && (
            <p className="text-gray-500 text-xs mt-1">Evidence: {obj.targetEvidence}</p>
          )}
          {onRuling && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onRuling(obj.id, true, obj.targetEvidence)}
                className="flex-1 text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded"
              >
                ❌ Sustain
              </button>
              <button
                onClick={() => onRuling(obj.id, false, obj.targetEvidence)}
                className="flex-1 text-xs px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded"
              >
                ✅ Overrule
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Resolved objections */}
      {hasResolved && (
        <>
          <h4 className="text-xs text-gray-500 uppercase mt-3 mb-2">Resolved</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {resolvedObj.map(obj => (
              <div key={obj.id} className={`text-xs p-2 bg-gray-800 rounded border-l-2 ${
                obj.status === 'sustained' ? 'border-red-500' : 'border-green-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300 capitalize">{obj.raisedBy}</span>
                  <RulingStampVisual ruling={obj.status === 'sustained' ? 'sustained' : 'overruled'} />
                </div>
                <p className="text-gray-400 mt-1">{obj.type}</p>
                {obj.targetEvidence && (
                  <p className="text-gray-500 text-xs mt-1">Evidence: {obj.targetEvidence}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

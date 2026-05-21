/**
 * ObjectionHistoryPanel — Display recent objections and rulings
 */

import type { ObjectionEvent } from '../types/courtroom';

interface ObjectionHistoryPanelProps {
  objections: ObjectionEvent[];
}

export function ObjectionHistoryPanel({ objections }: ObjectionHistoryPanelProps) {
  const recentObj = objections.slice(-5).reverse();

  if (recentObj.length === 0) {
    return (
      <div className="bg-courtroom-card border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Objection History</h3>
        <p className="text-xs text-gray-500">No objections recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-courtroom-card border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Objection History</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {recentObj.map(obj => (
          <div key={obj.id} className="text-xs p-2 bg-gray-800 rounded border-l-2 border-gray-600">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-300">{obj.raisedBy}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                obj.status === 'sustained' ? 'bg-red-900 text-red-200' :
                obj.status === 'overruled' ? 'bg-green-900 text-green-200' :
                'bg-yellow-900 text-yellow-200'
              }`}>
                {obj.status}
              </span>
            </div>
            <p className="text-gray-400 mt-1">{obj.type}</p>
            {obj.targetEvidence && (
              <p className="text-gray-500 text-xs mt-1">Evidence: {obj.targetEvidence}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

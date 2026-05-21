/**
 * MotionPanel — Display and manage motions
 * Phase 9: Motion flow system
 */

import type { MotionEvent, MotionType, MotionStatus /* AgentRole removed - unused */ } from '../types/courtroom';

interface MotionPanelProps {
  motions: MotionEvent[];
  onRuling?: (motionId: string, granted: boolean, rulingNote?: string) => void;
}

const motionTypeLabels: Record<MotionType, string> = {
  motion_to_strike: 'Motion to Strike',
  motion_to_dismiss: 'Motion to Dismiss',
  motion_to_admit_evidence: 'Motion to Admit Evidence',
  motion_to_exclude_evidence: 'Motion to Exclude Evidence',
};

const motionStatusStyles: Record<MotionStatus, { label: string; class: string }> = {
  pending: { label: 'Pending', class: 'bg-yellow-700 text-yellow-200' },
  granted: { label: 'Granted', class: 'bg-green-700 text-green-200' },
  denied: { label: 'Denied', class: 'bg-red-700 text-red-200' },
};

export function MotionPanel({ motions, onRuling }: MotionPanelProps) {
  const pendingMotions = motions.filter(m => m.status === 'pending');
  
  if (motions.length === 0) {
    return (
      <div className="bg-courtroom-card rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
          ⚡ Motions
        </h3>
        <p className="text-xs text-gray-500">No motions raised yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          ⚡ Motions
        </h3>
        <p className="text-xs text-gray-500 mt-1">{motions.length} motion(s), {pendingMotions.length} pending</p>
      </div>

      <div className="p-4 grid gap-3 max-h-[400px] overflow-y-auto">
        {motions.map((motion) => {
          const status = motionStatusStyles[motion.status];
          return (
            <div key={motion.id} className={`bg-gray-800 rounded-lg p-3 ${
              motion.status === 'pending' ? 'border border-yellow-600' : ''
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-300 uppercase">
                  {motionTypeLabels[motion.motionType]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${status.class}`}>
                  {status.label}
                </span>
              </div>
              
              <p className="text-xs text-gray-400 mb-1">Reason: {motion.reason}</p>
              
              <div className="text-xs text-gray-500 flex gap-3">
                <span>Raised by: {motion.raisedBy}</span>
                {motion.targetEvidence && <span>Evidence: {motion.targetEvidence}</span>}
              </div>
              
              {motion.rulingNote && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-yellow-400">Ruling: {motion.rulingNote}</p>
                </div>
              )}
              
              {/* Pending: Show ruling buttons */}
              {motion.status === 'pending' && onRuling && (
                <div className="mt-2 pt-2 border-t border-gray-700 flex gap-2">
                  <button
                    onClick={() => onRuling(motion.id, true, 'Motion GRANTED')}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Grant
                  </button>
                  <button
                    onClick={() => onRuling(motion.id, false, 'Motion DENIED')}
                    className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

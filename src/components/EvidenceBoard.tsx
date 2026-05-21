/**
 * EvidenceBoard — Display and manage case evidence
 */

import type { Evidence, EvidenceStatus } from '../types/courtroom';

interface EvidenceBoardProps {
  evidence: Evidence[];
}

const statusStyles: Record<EvidenceStatus, { label: string; class: string }> = {
  pending: { label: 'Pending', class: 'bg-gray-700 text-gray-300' },
  offered: { label: 'Offered', class: 'bg-blue-700 text-blue-200' },
  admitted: { label: 'Admitted', class: 'bg-green-700 text-green-200' },
  disputed: { label: 'Disputed', class: 'bg-red-700 text-red-200' },
  excluded: { label: 'Excluded', class: 'bg-red-800 text-red-300' },
  sealed: { label: 'Sealed', class: 'bg-purple-700 text-purple-200' },
};

const typeIcons: Record<Evidence['type'], string> = {
  document: '📄',
  email: '📧',
  report: '📊',
  physical: '📦',
  testimony: '👤',
  digital: '💻',
};

export function EvidenceBoard({ evidence }: EvidenceBoardProps) {
  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          📋 Evidence Board
        </h3>
        <p className="text-xs text-gray-500 mt-1">{evidence.length} items</p>
      </div>

      <div className="p-4 grid gap-3 max-h-[400px] overflow-y-auto">
        {evidence.map((item) => {
          const status = statusStyles[item.status];
          return (
            <div
              key={item.id}
              className={`
                evidence-card 
                ${item.status === 'offered' ? 'evidence-introduced' : ''}
                ${item.status === 'disputed' ? 'evidence-disputed' : ''}
                ${item.status === 'pending' ? 'evidence-pending' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{typeIcons[item.type]}</span>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${status.class}`}>
                  {status.label}
                </span>
              </div>
              
              <p className="text-xs text-gray-400 mb-2">{item.summary}</p>
              
              <div className="text-xs text-gray-500">
                <span className="capitalize">Type: {item.type}</span>
                <span className="mx-2">•</span>
                <span>By: {item.introducedBy}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

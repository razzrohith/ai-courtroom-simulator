/**
 * ExhibitPanel — Display evidence exhibits with metadata, confidentiality, and status
 * Phase 13: Exhibit management with sealed/confidential handling
 */

import type { Evidence } from '../types/courtroom';
import { EmptyStatePlaceholder } from './visuals/CourtroomVisuals';

interface ExhibitPanelProps {
  exhibits: Evidence[];
  showRestricted?: boolean;
}

// Badge styling helpers
function getConfBadge(confidentiality: Evidence['confidentiality']) {
  switch (confidentiality) {
    case 'sealed':
      return { label: 'SEALED', bg: 'bg-red-900', text: 'text-red-400' };
    case 'confidential':
      return { label: 'CONFIDENTIAL', bg: 'bg-yellow-900', text: 'text-yellow-400' };
    default:
      return { label: 'PUBLIC', bg: 'bg-green-900', text: 'text-green-400' };
  }
}

function getStatusBadge(status: Evidence['status']) {
  switch (status) {
    case 'admitted':
      return { label: 'Admitted', bg: 'bg-emerald-900/50', text: 'text-emerald-400' };
    case 'offered':
      return { label: 'Offered', bg: 'bg-blue-900/50', text: 'text-blue-400' };
    case 'excluded':
      return { label: 'Excluded', bg: 'bg-red-900/50', text: 'text-red-400' };
    case 'sealed':
      return { label: 'Sealed', bg: 'bg-purple-900/50', text: 'text-purple-400' };
    case 'disputed':
      return { label: 'Disputed', bg: 'bg-orange-900/50', text: 'text-orange-400' };
    default:
      return { label: 'Pending', bg: 'bg-gray-800', text: 'text-gray-400' };
  }
}

export function ExhibitPanel({ exhibits, showRestricted = false }: ExhibitPanelProps) {
  const sortedExhibits = [...exhibits].sort((a, b) => {
    const aNum = a.exhibitNumber || a.id;
    const bNum = b.exhibitNumber || b.id;
    return aNum.localeCompare(bNum);
  });

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-300">Exhibit List</h3>
          <p className="text-xs text-gray-500 mt-1">Phase 13: Exhibit management</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded">Public</span>
          <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded">Confidential</span>
          <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded">Sealed</span>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto">
        {sortedExhibits.length === 0 && (
          <EmptyStatePlaceholder 
            icon="📁" 
            title="No Exhibits Yet" 
            message="Evidence will appear here once introduced during the trial." 
          />
        )}
        {sortedExhibits.map((exhibit) => {
          const confBadge = getConfBadge(exhibit.confidentiality);
          const statusBadge = getStatusBadge(exhibit.status);
          const isRestricted = exhibit.confidentiality !== 'public';
          const displayContent = (!isRestricted || showRestricted)
            ? exhibit.content
            : exhibit.sealedSummary || '[Content restricted]';

          return (
            <div key={exhibit.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs text-gray-500 mr-2">{exhibit.exhibitNumber || exhibit.id}</span>
                  <span className="text-sm font-medium text-gray-200">{exhibit.title}</span>
                </div>
                <div className="flex gap-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${confBadge.bg} ${confBadge.text}`}>
                    {confBadge.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusBadge.bg} ${statusBadge.text}`}>
                    {statusBadge.label}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-2">
                <span className="capitalize">[{exhibit.type}]</span> {exhibit.summary}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Offered by: <span className="capitalize text-gray-400">{exhibit.introducedBy}</span>
                {exhibit.admittedBy && <> - Admitted by {exhibit.admittedBy}</>}
              </div>
              {exhibit.referenceCount !== undefined && exhibit.referenceCount > 0 && (
                <div className="text-xs text-gray-500">Referenced: {exhibit.referenceCount}x</div>
              )}
              <div className={`mt-2 p-2 rounded text-xs ${isRestricted ? 'bg-gray-900 text-gray-500 italic' : 'bg-gray-900 text-gray-300'}`}>
                {displayContent}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-700 text-xs text-gray-500">
        {!showRestricted && <p className="text-yellow-500">Some exhibits are restricted.</p>}
        {exhibits.filter(e => e.confidentiality === 'sealed').length > 0 && (
          <p className="text-red-400 mt-1">{exhibits.filter(e => e.confidentiality === 'sealed').length} sealed exhibit(s)</p>
        )}
      </div>
    </div>
  );
}
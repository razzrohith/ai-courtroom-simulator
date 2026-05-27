import React from 'react';
import { Evidence } from '../../types/courtroom';
import styles from './StageEvidencePresenter.module.css';
const malformedTitleRegex = /\b(who|whose|by|from|regarding)\b/gi; // used for evidence title cleanup
export interface StageEvidencePresenterProps {
  evidence?: Evidence;
}

export const StageEvidencePresenter: React.FC<StageEvidencePresenterProps> = ({ evidence }) => {
  if (!evidence) return null;

  const statusColors: Record<string, string> = {
    offered: 'bg-yellow-500/20 text-yellow-300',
    admitted: 'bg-green-500/20 text-green-300',
    disputed: 'bg-red-500/20 text-red-300',
    excluded: 'bg-gray-500/20 text-gray-300',
    sealed: 'bg-blue-500/20 text-blue-300',
  };

  const badgeClass = statusColors[evidence.status] ?? 'bg-gray-500/20 text-gray-300';

  const isSealed = evidence.status === 'sealed' || (evidence as any).sealed;

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.slideIn}`}> 
        <div className="flex items-center gap-2">
          {isSealed ? (
            <span className="text-2xl" role="img" aria-label="sealed">🔒</span>
          ) : (
            <span className="text-2xl" role="img" aria-label="evidence">📂</span>
          )}
          <div>
            <div className="text-sm font-medium text-white">{evidence.id}</div>
            <div className="text-xs text-gray-300 truncate max-w-xs">{evidence.title
              .replace(/[\u201c\u201d]/g, '"')
              .replace(/[\u2018\u2019]/g, "'")
              // Remove leading party name and connector words (e.g., "Samsung who ")
// Regex pattern for malformed title cleanup: /\b(who|whose|by|from|regarding)\b/gi
              .replace(malformedTitleRegex, '')
              .replace(/\s{2,}/g, ' ')
              .trim()}</div>
          </div>
        </div>
        <div className={`mt-1 px-2 py-0.5 rounded ${badgeClass} text-xs`}> {evidence.status.toUpperCase()} </div>
        {isSealed && (
          <div className={styles.sealedOverlay}>Confidential</div>
        )}
      </div>
    </div>
  );
};

export default StageEvidencePresenter;

/**
 * CaseSummaryReport — Generate and share structured case summary
 * Phase 8: Copy/download case report
 */

import { useState, useCallback } from 'react';
import type { CourtState } from '../types/courtroom';

interface CaseSummaryReportProps {
  state: CourtState;
}

// Helper to add separator lines
function addSep(lines: string[], chars: string) {
  lines.push(chars);
}

export function CaseSummaryReport({ state }: CaseSummaryReportProps) {
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const generateReport = useCallback(() => {
    const { case: caseData, transcript, evidence, objectionHistory, verdict, currentPhase } = state;
    
    const lines: string[] = [];
    addSep(lines, '='.repeat(50));
    lines.push(`${caseData.title.toUpperCase()}`);
    lines.push('CASE SUMMARY REPORT');
    addSep(lines, '='.repeat(50));
    lines.push('');
    
    // Case info
    lines.push('CASE INFORMATION');
    addSep(lines, '-'.repeat(30));
    lines.push(`Case Number: ${(caseData as any).caseNumber || 'N/A'}`);
    lines.push(`Case Type: ${caseData.caseType}`);
    lines.push(`Phase: ${currentPhase.replace('_', ' ')}`);
    lines.push('');
    
    // Parties
    lines.push('PARTIES');
    addSep(lines, '-'.repeat(30));
    lines.push(`Plaintiff: ${caseData.plaintiffSide || caseData.title.split(' v. ')[0]}`);
    lines.push(`Defense: ${caseData.defenseSide || caseData.title.split(' v. ')[1]}`);
    lines.push('');
    
    // Claim summary
    lines.push('CLAIM SUMMARY');
    addSep(lines, '-'.repeat(30));
    lines.push(caseData.claimSummary);
    lines.push('');
    
    // Key facts
    if (caseData.keyFacts.length > 0) {
      lines.push('KEY FACTS');
      addSep(lines, '-'.repeat(30));
      caseData.keyFacts.forEach((fact, i) => {
        lines.push(`${i + 1}. ${fact}`);
      });
      lines.push('');
    }
    
    // Evidence status
    lines.push('EVIDENCE STATUS');
    addSep(lines, '-'.repeat(30));
    lines.push(`Total Items: ${evidence.length}`);
    const introducedCount = evidence.filter(e => e.status !== 'pending').length;
    const acceptedCount = evidence.filter(e => e.status === 'admitted').length;
    const disputedCount = evidence.filter(e => e.status === 'disputed').length;
    lines.push(`Introduced: ${introducedCount}`);
    lines.push(`Accepted: ${acceptedCount}`);
    lines.push(`Disputed: ${disputedCount}`);
    lines.push('');
    
    evidence.filter(e => e.referenceCount ?? 0 > 0).forEach(ev => {
      lines.push(`- ${ev.id}: ${ev.title} (${ev.status}) [Refs: ${ev.referenceCount}]`);
    });
    lines.push('');
    
    // Objections
    if (objectionHistory.length > 0) {
      lines.push('OBJECTIONS AND RULINGS');
      addSep(lines, '-'.repeat(30));
      objectionHistory.forEach(obj => {
        lines.push(`- ${obj.type} by ${obj.raisedBy}: ${obj.status}`);
        if (obj.targetEvidence) lines.push(`  Evidence: ${obj.targetEvidence}`);
      });
      lines.push('');
    }
    
    // Transcript summary
    if (transcript.length > 0) {
      lines.push('TRANSCRIPT SUMMARY');
      addSep(lines, '-'.repeat(30));
      lines.push(`Total Entries: ${transcript.length}`);
      
      const phaseCounts = transcript.reduce((acc, t) => {
        acc[t.phase] = (acc[t.phase] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(phaseCounts).forEach(([phase, count]) => {
        lines.push(`- ${phase.replace('_', ' ')}: ${count} entries`);
      });
      lines.push('');
    }
    
    // Verdict
    if (verdict) {
      lines.push('VERDICT');
      addSep(lines, '-'.repeat(30));
      lines.push(`Decision: ${verdict.decision.replace('_', ' ')}`);
      lines.push('');
      
      if (verdict.winnerName) {
        lines.push(`Winner: ${verdict.winnerName}`);
        lines.push(`Why this side won: ${verdict.whyWinnerWon}`);
        lines.push(`Why the other side did not win: ${verdict.whyLoserLost}`);
        if (verdict.keyReasons && verdict.keyReasons.length > 0) {
          lines.push('Key reasons:');
          verdict.keyReasons.forEach(r => lines.push(`- ${r}`));
        }
        if (verdict.evidenceConsidered && verdict.evidenceConsidered.length > 0) {
          lines.push('Evidence/facts considered:');
          verdict.evidenceConsidered.forEach(ev => lines.push(`- ${ev}`));
        }
        lines.push('');
      }

      lines.push(verdict.ruling);
      lines.push('');
      lines.push('Reasoning Summary:');
      lines.push(verdict.reasoningSummary);
      lines.push('');
      
      if (verdict.plaintiffPoints.length > 0) {
        lines.push('Strengths (Plaintiff):');
        verdict.plaintiffPoints.forEach(p => lines.push(`- ${p}`));
        lines.push('');
      }
      
      if (verdict.defensePoints.length > 0) {
        lines.push('Strengths (Defense):');
        verdict.defensePoints.forEach(p => lines.push(`- ${p}`));
        lines.push('');
      }
      
      // Phase 10: Witness credibility impact
      if ('witnessImpact' in verdict && verdict.witnessImpact) {
        lines.push('Witness Testimony Impact:');
        lines.push(verdict.witnessImpact);
        lines.push('');
      }
      
      // Phase 11: Jury instructions impact
      if ('juryInstructionSummary' in verdict && verdict.juryInstructionSummary) {
        lines.push('Jury Instructions:');
        lines.push(verdict.juryInstructionSummary);
        lines.push('');
      }
      
      // Phase 11: Motion impact
      if ('motionImpact' in verdict && verdict.motionImpact) {
        lines.push('Motion Rulings Impact:');
        lines.push(verdict.motionImpact);
        lines.push('');
      }
      
      // Phase 12: Deliberation summary
      if ('deliberationSummary' in verdict && verdict.deliberationSummary) {
        lines.push('Judge Deliberation Notes:');
        lines.push(verdict.deliberationSummary);
        lines.push('');
      }
      
      // Phase 12: Appeal grounds
      if ('appealGrounds' in verdict && verdict.appealGrounds && verdict.appealGrounds.length > 0) {
        lines.push('Potential Appeal Grounds:');
        verdict.appealGrounds.forEach(ground => lines.push(`- ${ground}`));
        lines.push('');
      }
    }
    
    // Disclaimer
    addSep(lines, '='.repeat(50));
    lines.push('SIMULATION DISCLAIMER');
    lines.push('This is an AI courtroom simulation for education and experimentation only.');
    lines.push('It is NOT legal advice and should not be used for real legal matters.');
    addSep(lines, '='.repeat(50));
    
    return lines.join('\n');
  }, [state]);

  const handleCopy = useCallback(async () => {
    const report = generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [generateReport]);

  const handleDownload = useCallback(() => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case-summary-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateReport]);

  return (
    <div className="bg-courtroom-card rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            📄 Case Summary Report
          </h3>
          <p className="text-xs text-gray-500 mt-1">Generate and share case summary</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={copied}
            className={`text-xs px-3 py-1.5 rounded ${
              copied ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            } transition-colors`}
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors"
          >
            💾 Download
          </button>
        </div>
      </div>
      
      {/* Preview collapsed */}
      {!showReport && (
        <div className="p-4">
          <button
            onClick={() => setShowReport(true)}
            className="text-xs text-gray-500 hover:text-gray-400"
          >
            ▼ Preview full report ({generateReport().split('\n').length} lines)
          </button>
        </div>
      )}
      
      {/* Full report preview */}
      {showReport && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Report Preview</span>
            <button
              onClick={() => setShowReport(false)}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              ▲ Hide
            </button>
          </div>
          <pre className="text-xs text-gray-400 whitespace-pre-wrap bg-gray-900 p-3 rounded max-h-64 overflow-y-auto font-mono">
            {generateReport()}
          </pre>
        </div>
      )}
    </div>
  );
}

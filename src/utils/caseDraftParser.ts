import type { CaseData, Evidence } from '../types/courtroom';

/**
 * Parses a JSON case draft string from the model output.
 * Handles markdown code block wraps and varying JSON field mappings.
 */
export function parseCaseDraftJSON(text: string): Partial<CaseData> {
  const cleanText = text.trim();
  
  // Find first '{' and last '}'
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No valid JSON object found in response.');
  }
  
  const jsonStr = cleanText.substring(firstBrace, lastBrace + 1);
  const parsed = JSON.parse(jsonStr);
  
  // Map parsed JSON fields to CaseData structure with fallback support
  const title = parsed.title || parsed.caseTitle || parsed.case_title || '';
  const caseType = parsed.caseType || parsed.case_type || parsed.type || '';
  const plaintiffSide = parsed.plaintiffSide || parsed.plaintiff_side || parsed.plaintiff || '';
  const defenseSide = parsed.defenseSide || parsed.defense_side || parsed.defense || '';
  const claimSummary = parsed.claimSummary || parsed.claim_summary || parsed.summary || parsed.claim || '';
  
  let keyFacts: string[] = [];
  const rawFacts = parsed.keyFacts || parsed.key_facts || parsed.facts || [];
  if (Array.isArray(rawFacts)) {
    keyFacts = rawFacts.map((f: any) => String(f).trim()).filter(Boolean);
  }
  
  let evidenceItems: Evidence[] = [];
  const rawEv = parsed.evidenceItems || parsed.evidence_items || parsed.evidence || parsed.exhibits || [];
  if (Array.isArray(rawEv)) {
    evidenceItems = rawEv.map((ev: any, idx: number) => {
      // Plaintiff evidence is typically introduced first, defense second
      const isPlaintiff = 
        ev.introducedBy === 'prosecutor' || 
        ev.introducedBy === 'plaintiff' || 
        ev.introduced_by === 'prosecutor' ||
        idx === 0;
        
      const defaultId = isPlaintiff ? 'EXHIBITP1' : 'EXHIBITD1';
      const defaultNum = isPlaintiff ? 'Exhibit P-1' : 'Exhibit D-1';
      
      // Normalize type
      let type: Evidence['type'] = 'document';
      const rawType = String(ev.type || '').toLowerCase();
      if (['document', 'email', 'report', 'physical', 'testimony', 'digital'].includes(rawType)) {
        type = rawType as Evidence['type'];
      }
      
      const summaryText = ev.summary || ev.description || ev.content || '';
      
      return {
        id: ev.id || defaultId,
        exhibitNumber: ev.exhibitNumber || ev.number || defaultNum,
        title: ev.title || `Exhibit ${isPlaintiff ? 'P-1' : 'D-1'}`,
        type,
        confidentiality: (ev.confidentiality || 'public') as Evidence['confidentiality'],
        summary: summaryText,
        content: ev.content || summaryText || 'No content provided.',
        introducedBy: (isPlaintiff ? 'prosecutor' : 'defense') as Evidence['introducedBy'],
        status: 'pending' as Evidence['status']
      };
    });
  }
  
  // Ensure we have exactly 3 key facts and 2 evidence items to keep simulator functioning correctly
  if (keyFacts.length < 3) {
    const defaultFacts = [
      `A dispute exists regarding the performance/priority of ${plaintiffSide} vs ${defenseSide}.`,
      `Plaintiff ${plaintiffSide} filed a claim on the basis of: ${claimSummary}.`,
      `Defendant ${defenseSide} asserts its defense against plaintiff's claims.`
    ];
    keyFacts = [...keyFacts, ...defaultFacts.slice(keyFacts.length)];
  }
  
  if (evidenceItems.length === 0) {
    evidenceItems = [
      {
        id: 'EXHIBITP1',
        exhibitNumber: 'Exhibit P-1',
        title: `${plaintiffSide} Technical Performance Report`,
        type: 'report',
        confidentiality: 'public',
        summary: `Document showing the capabilities and arguments for ${plaintiffSide}.`,
        content: `Detailed capability report for ${plaintiffSide}.`,
        introducedBy: 'prosecutor',
        status: 'pending'
      },
      {
        id: 'EXHIBITD1',
        exhibitNumber: 'Exhibit D-1',
        title: `${defenseSide} System Log & Study`,
        type: 'report',
        confidentiality: 'public',
        summary: `Research findings showing the defense side arguments and data for ${defenseSide}.`,
        content: `Detailed capability log for ${defenseSide}.`,
        introducedBy: 'defense',
        status: 'pending'
      }
    ];
  } else if (evidenceItems.length === 1) {
    const single = evidenceItems[0];
    const isPlaintiff = single.introducedBy === 'prosecutor';
    const oppositeId = isPlaintiff ? 'EXHIBITD1' : 'EXHIBITP1';
    const oppositeNum = isPlaintiff ? 'Exhibit D-1' : 'Exhibit P-1';
    const oppositeTitle = isPlaintiff ? `${defenseSide} System Log` : `${plaintiffSide} Technical Report`;
    const oppositeRole = isPlaintiff ? 'defense' : 'prosecutor';
    
    evidenceItems.push({
      id: oppositeId,
      exhibitNumber: oppositeNum,
      title: oppositeTitle,
      type: 'report',
      confidentiality: 'public',
      summary: `Document showing the capabilities and arguments for ${oppositeRole === 'defense' ? defenseSide : plaintiffSide}.`,
      content: `Detailed capability report.`,
      introducedBy: oppositeRole as 'prosecutor' | 'defense',
      status: 'pending'
    });
  }
  
  // Make sure IDs match expectations for the simulator agents
  evidenceItems[0].id = 'EXHIBITP1';
  evidenceItems[0].exhibitNumber = 'Exhibit P-1';
  evidenceItems[0].introducedBy = 'prosecutor';
  if (evidenceItems[1]) {
    evidenceItems[1].id = 'EXHIBITD1';
    evidenceItems[1].exhibitNumber = 'Exhibit D-1';
    evidenceItems[1].introducedBy = 'defense';
  }
  
  return {
    title: String(title).trim(),
    caseType: String(caseType).trim(),
    plaintiffSide: String(plaintiffSide).trim(),
    defenseSide: String(defenseSide).trim(),
    claimSummary: String(claimSummary).trim(),
    keyFacts: keyFacts.slice(0, 5), // limit to max 5 facts
    evidenceItems: evidenceItems.slice(0, 2), // limit to exactly 2 evidence items for the simulator
    legalQuestions: [
      `Whether ${plaintiffSide} provides superior capability for the claims asserted in: ${claimSummary}.`,
      `Whether ${defenseSide} offers advantages that override the plaintiff's assertions.`
    ]
  };
}

/**
 * Validates whether the case draft has all mandatory fields populated.
 */
export function validateCaseDraft(caseData: Partial<CaseData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!caseData.title?.trim()) {
    errors.push('Case Title is missing.');
  }
  if (!caseData.caseType?.trim()) {
    errors.push('Case Type is missing.');
  }
  if (!caseData.plaintiffSide?.trim()) {
    errors.push('Plaintiff is missing.');
  }
  if (!caseData.defenseSide?.trim()) {
    errors.push('Defendant is missing.');
  }
  if (!caseData.claimSummary?.trim()) {
    errors.push('Claim Summary is missing.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

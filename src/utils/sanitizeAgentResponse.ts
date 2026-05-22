// src/utils/sanitizeAgentResponse.ts

/**
 * Sanitize agent response to prevent prompt leakage, markdown wrappers, meta commentary, and instruction text.
 * Removes known patterns that appear in internal prompts or planning instructions.
 */
export function sanitizeAgentResponse(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();

  // Remove role prefixes like "Advocate Sneha Kapoor:" etc.
  const prefixes = [
    /^(?:Advocate|Attorney|Counsel|Judge|Justice|Honorable)\s+[A-Za-z\s]+(?:\s*\([^)]*\))?:/gi,
    /^(?:Prosecutor|Defense|Judge|Jury)(?:\s+Counsel)?(?:\s*\([^)]*\))?:/gi,
    /^(?:Advocate|Attorney|Counsel|Judge|Justice|Honorable)\s+[A-Za-z\s]+-\s+/gi,
  ];
  prefixes.forEach(r => { cleaned = cleaned.replace(r, '').trim(); });

  // Remove generic instruction headers
  cleaned = cleaned.replace(/^(?:Instructions|System\s+Instructions|Task|Constraints|Rules):\s*/gi, '');

  // Remove specific prompt leak lines
  const leakPatterns = [
    /You are (?:Advocate|Attorney|Judge|Justice|Honorable)\s+[A-Za-z\s]+,\s*counsel for the [A-Za-z\s]+\./gi,
    /Represent your client's case based on the Case Overview, Key Facts, and evidence\./gi,
    /Challenge the (?:prosecution|defense)'s evidence\./gi,
    /As an AI(?:\s+assistant|\s+language\s+model)?,\s*/gi,
    /I am an AI(?:\s+assistant|\s+language\s+model)?\s*(?:and|but)?\s*/gi,
    /We need to (?:respond|craft|write|create).*/gi,
    /I need to (?:respond|write|craft).*/gi,
    /Must follow (?:style|guidelines).*/gi,
    /Follow style.*/gi,
    /Keep short.*/gi,
    /Word count:\s*\d+-\d+\s*words.*/gi,
    /80-140 words.*/gi,
    /2-5 sentences.*/gi,
    /plain English.*/gi,
    /no heavy jargon.*/gi,
    /cite evidence IDs.*/gi,
    /Let'?s craft.*/gi,
    /Let'?s write.*/gi,
    /We should.*/gi,
    /Instructions:\s*/gi,
    /Prompt:\s*/gi,
    /System prompt.*/gi,
    /Developer prompt.*/gi,
    /You are.*/gi,
    /As an AI.*/gi,
  ];
  leakPatterns.forEach(r => { cleaned = cleaned.replace(r, '').trim(); });

  // Remove list items that are typical instruction bullets
  const lines = cleaned.split('\n');
  const filtered = lines.filter(line => {
    const l = line.toLowerCase().trim();
    return !(
      l.startsWith('- write in') ||
      l.startsWith('- avoid long') ||
      l.startsWith('- never give') ||
      l.startsWith('- cite evidence') ||
      l.startsWith('- stay in character') ||
      l.startsWith('- use proper') ||
      l.startsWith('- this is an educational') ||
      l.startsWith('important constraints:') ||
      l.startsWith('length rule:')
    );
  });
  cleaned = filtered.join('\n').trim();

  // Strip surrounding quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned || text.trim();
}

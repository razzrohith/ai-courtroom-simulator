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

  // Extract quoted speech after "something like" if present
  const somethingLikeMatch = cleaned.match(/something\s+like:?\s*(["'])(.*?)\1/si);
  if (somethingLikeMatch && somethingLikeMatch[2]) {
    cleaned = somethingLikeMatch[2].trim();
  }

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
    /We need to (?:respond|craft|write|create|stay neutral|follow).*/gi,
    /I need to (?:respond|write|craft).*/gi,
    /Must follow (?:style|guidelines|instructions).*/gi,
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
    /We should (?:respond|stay|follow).*/gi,
    /Instructions:\s*/gi,
    /Prompt:\s*/gi,
    /System prompt.*/gi,
    /Developer prompt.*/gi,
    /You are.*/gi,
    /As an AI.*/gi,
    /We must keep.*/gi,
    /Something like.*/gi,
    /That’s maybe \d+ sentences.*/gi,
    /That's maybe \d+ sentences.*/gi,
    /Need \d+ sentences.*/gi,
    /Need to.*/gi,
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
      l.startsWith('length rule:') ||
      l.startsWith('- we must') ||
      l.startsWith('- we need') ||
      l.startsWith('- target')
    );
  });
  cleaned = filtered.join('\n').trim();

  // Strip surrounding quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Safety check: if output still looks like instructions/planning, force empty to trigger fallback
  const lowerCleaned = cleaned.toLowerCase();
  if (
    lowerCleaned.includes('we need to') ||
    lowerCleaned.includes('must follow') ||
    lowerCleaned.includes('let’s craft') ||
    lowerCleaned.includes('let\'s craft') ||
    lowerCleaned.includes('word count') ||
    lowerCleaned.includes('system prompt') ||
    lowerCleaned.includes('developer prompt') ||
    lowerCleaned.includes('something like') ||
    lowerCleaned.includes('write in plain') ||
    lowerCleaned.includes('sentences')
  ) {
    cleaned = '';
  }

  return cleaned || '';
}

/**
 * Summarize a courtroom utterance into a single short line (max ~120 characters) deterministically.
 */
export function summarizeCourtroomUtterance(text: string, role: string, _phase: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Remove common courtroom filler words and phrases
  const fillers = [
    /^(?:Your Honor|Respectfully|With all due respect|May it please the court|Thank you Your Honor|Thank you)[,\s]*/i,
    /^(?:the plaintiff submits that|the prosecution submits that|the defense submits that|we submit that)/i,
    /^(?:I argue that|I submit that|I contend that|We argue that|We contend that)/i,
    /^(?:It is clear that|It is obvious that|There is no doubt that)/i,
    /^(?:Let me be clear|Let the record show that)/i,
  ];
  fillers.forEach(f => {
    cleaned = cleaned.replace(f, '');
  });
  
  // Clean up any starting lowercase or double spaces caused by strip
  cleaned = cleaned.trim();
  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 2. Select the first or main sentence.
  const sentenceEndRegex = /(?<=[.!?])\s+(?=[A-Z])/;
  const sentences = cleaned.split(sentenceEndRegex).map(s => s.trim()).filter(Boolean);
  
  let summary = sentences[0] || cleaned;

  // Perform deterministic role prefixing
  if (role === 'judge') {
    summary = summary.replace(/^(?:I rule that|The court rules that|I order that|The court orders that)/i, '').trim();
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
    summary = `Judge: ${summary}`;
  } else if (role === 'prosecutor') {
    summary = summary.replace(/^(?:The prosecution argues that|I argue that|We argue that)/i, '').trim();
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
    summary = `Prosecutor: ${summary}`;
  } else if (role === 'defense') {
    summary = summary.replace(/^(?:The defense argues that|I argue that|We argue that)/i, '').trim();
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
    summary = `Defense: ${summary}`;
  }

  // 3. Truncate cleanly to around 120 characters, matching word boundary if possible, and add ellipsis.
  const maxLength = 120;
  if (summary.length > maxLength) {
    let truncated = summary.slice(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 60) {
      truncated = truncated.slice(0, lastSpace);
    }
    summary = truncated.trim() + '...';
  }

  return summary;
}


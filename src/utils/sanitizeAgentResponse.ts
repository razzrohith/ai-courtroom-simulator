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
 * Summarize a courtroom utterance into a single short line (80-140 characters) deterministically.
 */
export function summarizeCourtroomUtterance(text: string, role: string, phase: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // Remove common role prefixes and system instructions
  cleaned = cleaned.replace(/^(Judge|Prosecutor|Defense|Advocate|Counselor):\s*/i, '');
  
  // Clean up common fillers
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
  cleaned = cleaned.trim();
  if (cleaned) {
    cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }

  // Extract first sentence
  const sentenceEndRegex = /(?<=[.!?])\s+/;
  const sentences = cleaned.split(sentenceEndRegex).map(s => s.trim()).filter(Boolean);
  let mainContent = sentences[0] || cleaned;

  // Strip trailing punctuation
  mainContent = mainContent.replace(/[.!?]+$/, '');

  // Strip surrounding quotes if any
  if ((mainContent.startsWith('"') && mainContent.endsWith('"')) || (mainContent.startsWith("'") && mainContent.endsWith("'"))) {
    mainContent = mainContent.slice(1, -1).trim();
  }

  let summary = '';
  
  if (role === 'judge') {
    if (phase === 'objection_ruling' || cleaned.toLowerCase().includes('objection')) {
      const lower = cleaned.toLowerCase();
      if (lower.includes('sustain')) {
        summary = 'Judge sustains the objection, ordering counsel to rephrase or strike the testimony.';
      } else if (lower.includes('overrule')) {
        summary = 'Judge overrules the objection, allowing the witness to continue with the testimony.';
      } else {
        summary = 'Judge rules on the objection raised by counsel to ensure proper courtroom decorum.';
      }
    } else {
      if (mainContent.length > 5) {
        summary = `Judge explains the next step: directing counsel to focus on ${mainContent}.`;
      } else {
        summary = 'Judge explains the next step, guiding both counsels on courtroom procedures.';
      }
    }
  } else if (role === 'prosecutor') {
    if (mainContent.length > 5) {
      summary = `Plaintiff argues that ${mainContent}.`;
    } else {
      summary = 'Plaintiff argues that the presented evidence supports their claims in this matter.';
    }
  } else if (role === 'defense') {
    if (mainContent.length > 5) {
      summary = `Defense responds that ${mainContent}.`;
    } else {
      summary = 'Defense responds that the claims lack foundation and should be dismissed.';
    }
  } else {
    summary = `Courtroom proceeding update for the active phase of the case.`;
  }

  // Adjust length to hit 80-140 characters range when possible
  if (summary.length < 80) {
    if (role === 'judge') {
      if (summary.includes('sustains')) {
        summary = 'Judge sustains the objection, ruling the statement inadmissible and directing counsel to rephrase the question.';
      } else if (summary.includes('overrules')) {
        summary = 'Judge overrules the objection, allowing the witness to answer and directing the trial proceedings to continue.';
      } else {
        summary = `Judge explains the next step in the trial, instructing the counsels to present their arguments for ${phase.replace(/_/g, ' ')}.`;
      }
    } else if (role === 'prosecutor') {
      summary = `Plaintiff argues that the evidence presented is sufficient and supports their legal claim in this courtroom session.`;
    } else if (role === 'defense') {
      summary = `Defense responds that the allegations are speculative and lack direct evidence to prove liability in this case.`;
    }
  }

  // Ensure minimum length check: never return under 40 chars
  if (summary.length < 40) {
    summary = `Proceeding update: ${role} addresses the court during the active ${phase.replace(/_/g, ' ')} phase of the simulation.`;
  }

  // Truncate cleanly to maximum 140 characters
  const maxLength = 140;
  if (summary.length > maxLength) {
    let truncated = summary.slice(0, maxLength - 4);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 60) {
      truncated = truncated.slice(0, lastSpace);
    }
    summary = truncated.trim() + '...';
  }

  return summary;
}

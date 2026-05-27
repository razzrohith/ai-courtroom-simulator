// src/legal/caseReasoningProfiles.ts
/**
 * Case reasoning profiles for Phase 6.
 * Each profile defines the legal vocabulary, burden of proof and
 * prohibited/template terms for a given case type.
 */
export type CaseReasoningProfile = {
  caseType: string;
  burdenOfProof: string;
  legalElements: string[];
  prosecutionFocus: string[];
  defenseFocus: string[];
  judgeEvaluationCriteria: string[];
  bannedTemplateTerms: string[]; // terms that must never appear in criminal contexts
  preferredVocabulary: string[]; // terms that SHOULD appear for the case type
  allowedVocabulary: string[]; // extra terms allowed (e.g., for product comparison)
  evidenceEvaluationCriteria: string[];
};

const profiles: CaseReasoningProfile[] = [
  // --- Criminal Murder Trial ---
  {
    caseType: "Criminal Murder Trial",
    burdenOfProof: "beyond reasonable doubt",
    legalElements: [
      "death",
      "unlawful act",
      "causation",
      "intent/knowledge",
      "identity of accused",
    ],
    prosecutionFocus: [
      "motive",
      "opportunity",
      "forensic evidence",
      "timeline",
      "chain of circumstances",
      "witness credibility",
      "chain of custody",
    ],
    defenseFocus: [
      "reasonable doubt",
      "alternative suspect",
      "evidence contamination",
      "weak motive",
      "missing forensic link",
      "investigation gaps",
      "unreliable witnesses",
    ],
    judgeEvaluationCriteria: [
      "whether every element is proven beyond reasonable doubt",
    ],
    bannedTemplateTerms: [
      "superior performance",
      "capability benchmarks",
      "platform",
      "platform strengths",
      "technical experts",
      "capability study",
      "architecture capability study",
      "operational priority",
      "marketing claims",
      "product benchmark",
    ],
    preferredVocabulary: [
      "beyond reasonable doubt",
      "motive",
      "opportunity",
      "forensic evidence",
      "chain of custody",
      "witness credibility",
      "contaminated crime scene",
      "alternative suspect",
      "reasonable doubt",
      "legal elements of murder",
    ],
    allowedVocabulary: [],
    evidenceEvaluationCriteria: ["admissibility", "relevance", "credibility"],
  },
  // --- Criminal Trial (non‑murder) ---
  {
    caseType: "Criminal Trial",
    burdenOfProof: "beyond reasonable doubt",
    legalElements: [],
    prosecutionFocus: [],
    defenseFocus: [],
    judgeEvaluationCriteria: [],
    bannedTemplateTerms: [
      "superior performance",
      "capability benchmarks",
      "platform",
      "platform strengths",
      "technical experts",
      "capability study",
      "architecture capability study",
      "operational priority",
      "marketing claims",
      "product benchmark",
    ],
    preferredVocabulary: [],
    allowedVocabulary: [],
    evidenceEvaluationCriteria: [],
  },
  // --- Civil Dispute ---
  {
    caseType: "Civil Dispute",
    burdenOfProof: "preponderance of evidence",
    legalElements: [],
    prosecutionFocus: [],
    defenseFocus: [],
    judgeEvaluationCriteria: [],
    bannedTemplateTerms: [],
    preferredVocabulary: [],
    allowedVocabulary: [],
    evidenceEvaluationCriteria: [],
  },
  // --- Contract Dispute ---
  {
    caseType: "Contract Dispute",
    burdenOfProof: "preponderance of evidence",
    legalElements: [],
    prosecutionFocus: [],
    defenseFocus: [],
    judgeEvaluationCriteria: [],
    bannedTemplateTerms: [],
    preferredVocabulary: [],
    allowedVocabulary: [],
    evidenceEvaluationCriteria: [],
  },
  // --- Business Dispute ---
  {
    caseType: "Business Dispute",
    burdenOfProof: "preponderance of evidence",
    legalElements: [],
    prosecutionFocus: [],
    defenseFocus: [],
    judgeEvaluationCriteria: [],
    bannedTemplateTerms: [],
    preferredVocabulary: [],
    allowedVocabulary: [],
    evidenceEvaluationCriteria: [],
  },
  // --- Product / Technology Comparison ---
  {
    caseType: "Product / Technology Comparison",
    burdenOfProof: "",
    legalElements: [],
    prosecutionFocus: [],
    defenseFocus: [],
    judgeEvaluationCriteria: [],
    bannedTemplateTerms: [],
    preferredVocabulary: [],
    allowedVocabulary: [
      "benchmark",
      "performance",
      "capability",
      "platform",
      "technical comparison",
      "product strengths",
    ],
    evidenceEvaluationCriteria: [],
  },
  // --- Employment / HR Dispute ---
  {
    caseType: "Employment / HR Dispute",
    burdenOfProof: "preponderance of evidence",
    legalElements: [],
    prosecutionFocus: [],
    defenseFocus: [],
    judgeEvaluationCriteria: [],
    bannedTemplateTerms: [],
    preferredVocabulary: [],
    allowedVocabulary: [],
    evidenceEvaluationCriteria: [],
  },
  // --- Property / Family / General Dispute ---
  {
    caseType: "Property / Family / General Dispute",
    burdenOfProof: "preponderance of evidence",
    legalElements: [],
    prosecutionFocus: [],
    defenseFocus: [],
    judgeEvaluationCriteria: [],
    bannedTemplateTerms: [],
    preferredVocabulary: [],
    allowedVocabulary: [],
    evidenceEvaluationCriteria: [],
  },
];

/** Retrieve a profile by case type (case‑insensitive). */
export function getCaseReasoningProfile(caseType: string): CaseReasoningProfile | undefined {
  return profiles.find((p) => p.caseType.toLowerCase() === caseType.toLowerCase());
}

/** Simple helper to detect criminal cases. */
export function isCriminalCaseType(caseType: string): boolean {
  const lower = caseType.toLowerCase();
  return lower.includes("criminal") || lower.includes("murder");
}

/** Remove banned template terms from generated text for a given case type. */
export function sanitizeCaseTypeText(text: string, caseType: string): string {
  const profile = getCaseReasoningProfile(caseType);
  if (!profile) return text;
  let clean = text;
  for (const term of profile.bannedTemplateTerms) {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    clean = clean.replace(regex, "");
  }
  // Special exception: allow phrasing that explicitly contrasts the criminal standard.
  const contrast = /preponderance of evidence is not the correct criminal standard/i;
  if (contrast.test(text)) {
    // ensure we keep the contrast phrase; removed terms shouldn't affect it.
    clean = text;
  }
  return clean.trim();
}

/** Assert that sanitized text contains no banned terms; throws if it does. */
export function assertCaseTypeReasoningSafe(text: string, caseType: string): void {
  const profile = getCaseReasoningProfile(caseType);
  if (!profile) return;
  for (const term of profile.bannedTemplateTerms) {
    const regex = new RegExp(`\\b${term}\\b`, "i");
    if (regex.test(text)) {
      throw new Error(`Banned term "${term}" found in ${caseType} reasoning text.`);
    }
  }
}

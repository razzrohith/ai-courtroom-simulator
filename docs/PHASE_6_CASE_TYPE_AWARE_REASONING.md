# Phase 6 – Case‑Type‑Aware Legal Reasoning & Evidence‑Grounded Verdict Engine

This phase extends the AI Courtroom Simulator to support multiple case types with dedicated reasoning profiles:

- Criminal Murder Trial
- Criminal Trial (non‑murder)
- Civil Dispute
- Contract Dispute
- Business Dispute
- Product / Technology Comparison
- Employment / HR Dispute
- Property / Family / General Dispute

Key features:
- **CaseReasoningProfiles** (`src/legal/caseReasoningProfiles.ts`) define banned terms, preferred vocabulary, burden of proof, and evaluation criteria per case type.
- **Sanitization** in `src/providers/agentService.ts` removes prohibited terminology and asserts safety via `sanitizeCaseTypeText` and `assertCaseTypeReasoningSafe`.
- **Runtime QA** (`npm run qa:trial`) validates that the new logic prevents case‑type contamination, rejects invalid evidence, and preserves verdict fields.
- Updated `tsconfig.qa.json` compiles to an isolated `.qa-build` directory.
- Comprehensive QA script (`scripts/qaTrialFlow.mjs`) checks all constraints and confirms successful execution.

All checks now pass:
```
PASS real runtime invalid evidence rejected
PASS real runtime duplicate summary prevented
PASS real runtime verdict fields populated
PASS criminal murder trial case‑type sanitization
PASS criminal trial case‑type sanitization
PASS civil dispute case‑type sanitization
PASS product/technology comparison allowed vocabulary
PASS employment/HR dispute checks
PASS property/family dispute checks
```

The repository is clean, and the changes are pushed to `origin/main`.

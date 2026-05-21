# Phase 10: Dynamic Witness Questioning and Credibility Scoring

## Overview
Makes witness testimony more realistic with generated Q&A and credibility scoring.

## New Types (src/types/courtroom.ts)

### CredibilityScore
```typescript
export type CredibilityScore = 'strong' | 'moderate' | 'weak' | 'challenged';
```

### WitnessEvidenceLink
```typescript
export interface WitnessEvidenceLink {
  evidenceId: string;
  supports: boolean; // corroborates or contradicts
  notes?: string;
}
```

### WitnessQAndA
```typescript
export interface WitnessQAndA {
  id: string;
  witnessId: string;
  examinerRole: AgentRole;
  question: string;
  answer: string;
  phase: CourtPhase;
  evidenceIds?: string[];
}
```

### Witness extends
```typescript
interface Witness {
  credibilityScore?: CredibilityScore;
  evidenceLinks?: WitnessEvidenceLink[];
  qAndAHistory?: WitnessQAndA[];
}
```

### Verdict extends
```typescript
interface Verdict {
  witnessImpact?: string; // Phase 10
}
```

## Q&A Generation (src/providers/mockModelProvider.ts)

### generateWitnessQAndA()
Creates structured mock Q&A pairs:
- Direct examination (by presenting side)
- Cross-examination (by opposing side)
- Judge clarification questions

Returns: question, answer, evidenceIds

Example:
```typescript
const qa = generateWitnessQAndA({
  witnessId: 'wit-001',
  examinerRole: 'prosecutor',
  questionType: 'direct',
});
// { question: 'Mr. Morrison, please describe...', answer: 'I was Operations Manager...' }
```

## Credibility Scoring (src/providers/mockModelProvider.ts)

### calculateCredibilityScore()
Simple algorithm weighing:
- consistencyWithEvidence: 0-100
- contradictions: number found
- corroborations: supporting evidence count

Outputs:
- strong: consistency ≥75%, corraborations ≥1
- moderate: consistency ≥50%
- weak: consistency <50%
- challenged: contradictions >2 or consistency <30%

Also adds notes explaining the rating.

## Processing Flow (src/orchestration/courtControllerAsync.ts)

### processWitnessTestimony()
Called during witness_testimony phase:
1. Gets witness matching speaker role
2. Generates appropriate Q&A (direct/cross/clarification)
3. Records in qAndAHistory
4. After cross-examination:
   - Calculates credibility score
   - Adds evidence links (supports/contradicts)
   - Updates credibility notes
5. Returns updated state

Integrated into processNextTurnAsync() for witness_testimony phase.

## UI Updates (src/components/WitnessPanel.tsx)

Updated display:
- Credibility score (STRONG/MODERATE/WEAK/CHALLENGED)
- Evidence links (corroboration badges)
- Q&A History (last 3 exchanges)
- Credibility notes

Color coding:
- STRONG: green-400
- MODERATE: yellow-400
- WEAK: orange-400
- CHALLENGED: red-400

## Verdict Integration (src/components/VerdictPanel.tsx)

Shows witness testimony impact when verdict.witnessImpact present:
- Blue highlighted section
- Court weight on witness credibility
- Credibility of each witness

## Mock Responses (src/data/mockCourtFlow.ts)

Updated MOCK_VERDICT includes witnessImpact field.

## Files Changed

| File | Change |
|------|--------|
| src/types/courtroom.ts | Added CredibilityScore, WitnessEvidenceLink, WitnessQAndA, extended types |
| src/providers/mockModelProvider.ts | Added generateWitnessQAndA(), calculateCredibilityScore() |
| src/orchestration/courtControllerAsync.ts | Added processWitnessTestimony() |
| src/components/WitnessPanel.tsx | Updated display for Q&A, scoring, evidence links |
| src/components/VerdictPanel.tsx | Added witnessImpact section |
| src/data/mockCourtFlow.ts | Added witnessImpact to verdict |

## Flow Verification

1. Phase advances to witness_testimony
2. Prosecutor speaks → direct examination Q&A generated
3. Prosecutor → direct-examination flag set
4. Defense speaks → cross-examination Q&A generated  
5. Cross-examination sets:
   - credibilityScore: calculated
   - evidenceLinks: added
   - credibilityNotes: appended
6. Judge speaks → clarification Q&A generated
7. Phase advances → verdict shows witnessImpact

## Evidence Linkage

During Q&A, if evidence IDs referenced:
- Added to evidenceLinks[]
- Marked as supports (direct) or contradicts (cross)
- Displayed in WitnessPanel as badges

Example display:
- E01 ✓ (corroborates)
- E03 ✗ (contradicts)

## Known Limitations

- Q&A is still mock-only (no real generation)
- Consistency uses random values
- Single question per speaker (not full examination)
- No automatic cross-question follow-up

## Future Enhancements

Phase 11 could add:
- Full direct examination script
- Follow-up question generation
- Real-time credibility updates in UI
- Jury instruction on witness credibility
- Expert witness types
- Character witness categories
- Deposition vs live testimony differentiation

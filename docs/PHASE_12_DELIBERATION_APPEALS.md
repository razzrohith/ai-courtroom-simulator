# Phase 12: Deliberation Chamber and Appeal Grounds

## Overview
Adds judge deliberation chamber before verdict with evidence/objection review and post-verdict appeal grounds analysis.

## New Components

### DeliberationPanel
Displays pre-verdict judicial review:
- deliberation summary
- evidence weighting
- witness credibility impact
- motion rulings effect
- objection rulings effect

### AppealPanel
Displays post-verdict analysis:
- potential appeal grounds
- verdict context
- procedural warnings
- simulation disclaimers

## Files Changed

| File | Change |
|------|--------|
| src/types/courtroom.ts | Added deliberationSummary, appealGrounds to Verdict |
| src/data/mockCourtFlow.ts | Added mock deliberation and appeal data |
| src/providers/mockModelProvider.ts | Updated judge_deliberation responses |
| src/components/DeliberationPanel.tsx | NEW - Delib panel |
| src/components/AppealPanel.tsx | NEW - Appeal panel |
| src/components/CourtroomLayout.tsx | Added Delib & Appeal rendering |
| src/components/VerdictPanel.tsx | Added verdict appeal display |
| src/components/CaseSummaryReport.tsx | Added deliberation/appeal export |

## Verdict Extension

```typescript
interface Verdict {
  // existing...
  deliberationSummary?: string;
  appealGrounds?: string[];
}
```

## Phase Flow

`jury_instructions` → `rebuttal` → `closing_arguments` → **`judge_deliberation`** → `verdict` → `case_summary`

During `judge_deliberation`: DeliberationPanel appears with full review.

During `verdict`/`case_summary`: AppealPanel appears with appeal analysis.

## Mock Content

### Deliberation Summary (mock)
```
All evidence reviewed. Force majeure claim valid for April delay. 
Defense waiver through acceptance. Prosecution motion to exclude testimony 
GRANTED. Both witnesses credible but partially corroborated. 
Preliminary ruling: plaintiff wins.
```

### Appeal Grounds (mock)
```
- Procedural: Timing of objection to Exhibit E04 may have been untimely.
- Evidentiary: Exhibit E02 admitted despite relevance challenge.
- Witness: Defense challenge to Mr. Morrison credibility partially sustained.
- Motion: Prosecution objection to motion for new evidence ruled without full briefing.
```

## Persists

- CourtState.save/load preserves verdict including new fields
- Case summary export includes deliberation and appeal sections

## Manual Testing

1. Start simulation
2. Next → to judge_deliberation phase
3. DeliberationPanel shows with evidence/witness/motion review
4. Continue → to verdict
5. AppealPanel appears with potential grounds
6. Export includes deliberation + appeal grounds

## Provider Status

Provider routing exists (OpenRouter/Ollama adapters). Mock-only for MVP.

## Limits

- Mock judicial reasoning only
- Appeal grounds fictional/demo only
- No binding real-world implications
- Not legal advice

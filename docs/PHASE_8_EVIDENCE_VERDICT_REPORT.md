# Phase 8: Evidence Timeline and Verdict Report Polish

## Overview
Adds evidence timeline and case summary report features for phase 8.

## New Components

### 1. EvidenceTimeline
Shows evidence as a vertical timeline:
- Evidence ID and title
- Status with color-coded dots
- First referenced phase
- Reference count
- Last referenced by
- Linked objection indicator

Toggle: Click "Timeline" button in sidebar to switch.

### 2. CaseSummaryReport
Structured case report with:
- COPY button → copies report as text to clipboard
- DOWNLOAD button → downloads .txt file
- Optional preview

Report includes:
- Case information
- Parties
- Claim summary
- Key facts
- Evidence status summary
- Objections and rulings
- Transcript summary
- Verdict details
- Disclaimer

### 3. Enhanced VerdictPanel
New fields in verdict display:
- Evidence Impact section
- Accepted/disputed evidence counts
- Ruling count

### 4. EvidenceBoard Improvements
Improved metadata display:
- Reference count
- Last referenced by
- Short reason for status changes

## Type Changes
Added optional fields to Evidence interface (backward compatible):

```typescript
interface Evidence {
  // ...
  firstReferencedPhase?: CourtPhase;
  lastReferencedBy?: AgentRole;
  referenceCount?: number;
  objectionId?: string;
}
```

## Persistence
All new fields now save/load correctly with session state.

## Usage

### Evidence Timeline
Click "📊 Timeline" to toggle timeline view in sidebar.
Shows only referenced evidence sorted by first appearance.

### Case Summary Report
COPY: Copies full report to clipboard.
DOWNLOAD: Downloads as case-summary-{timestamp}.txt

### Verdict Panel
After verdict phase, panel shows enhanced breakdown:
- Evidence used
- Ruling impact

## Modified Files

1. src/types/courtroom.ts
2. src/components/EvidenceTimeline.tsx (NEW)
3. src/components/CaseSummaryReport.tsx (NEW)
4. src/components/VerdictPanel.tsx
5. src/components/CourtroomLayout.tsx
6. src/orchestration/courtControllerAsync.ts
7. src/data/sampleCase.ts

## Limitations
- Still using mock responses
- No real evidence citation engine
- Timeline uses rough sort
- Report preview collapses on new phase entries

## Next Steps
Phase 9 will focus on:
- Motion and counter-motion flow
- Witness testimony integration
- Per-phase prompt enhancements for real models
- Animation polish

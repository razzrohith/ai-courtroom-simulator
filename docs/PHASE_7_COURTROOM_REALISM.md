# Phase 7: Courtroom Realism and Objection Logic

## Overview
Phase 7 adds judge-led phase transitions, context-aware objection generation, improved courtroom prompts, better verdict reasoning, and related UI improvements.

## Features Implemented

### 1. Judge-Led Phase Transitions
When moving from one phase to another, the judge now announces a formal transition message:

```typescript
// from mockCourtFlow.ts
export const JUDGE_TRANSITIONS: Record<CourtPhase, string> = {
  court_opening: "The Court will now come to order. This is Case Number 2024-CV-3847...",
  plaintiff_opening: "Thank you, counsel. Now, Ms. Chen, you may deliver your opening statement...",
  defense_opening: "Thank you, Ms. Chen. Mr. Williams, you may deliver your opening statement...",
  evidence_presentation: "We will now move to the evidence presentation phase...",
  // ... all phases
};
```

These messages appear in the transcript when advancing phases.

### 2. Phase Instructions
Agents receive specific instructions based on their role and current phase:

```typescript
export const PHASE_INSTRUCTIONS = {
  court_opening: {
    judge: "You are Presiding Judge Sarah Mitchell. Open court...",
    prosecutor: "You are Attorney Rebecca Chen for Apex Logistics...",
    defense: "You are Attorney Marcus Williams for Northstar Retail...",
  },
  // ...
};
```

### 3. Objection Generation
Random objection triggering during evidence_presentation and cross_examination phases:

```typescript
export const OBJECTION_TYPES = {
  relevance: { weight: 0.15, desc: "irrelevant" },
  hearsay: { weight: 0.12, desc: "hearsay" },
  // ...
};

export function shouldTriggerObjection(phase, speakerTurn) {
  // ~25% chance during evidence/cross-examination after speaker has spoken
}
```

Triggers include: relevance, hearsay, speculation, lack_of_foundation, leading, argumentative, compound, assume_facts.

### 4. Improved Courtroom Context
Agents now receive richer context including:
- Case key facts (first 5)
- Recent transcript (up to 6 entries)
- Evidence status (including DISPUTED/ACCEPTED markers)
- Recent objections/rulings
- Jury instructions when relevant

### 5. Better Verdict Reasoning
Uses improved MOCK_VERDICT with detailed reasoning:

```typescript
export const MOCK_VERDICT: Verdict = {
  decision: 'plaintiff_wins',
  reasoningSummary: 'The court finds that the plaintiff properly invoked force majeure...',
  plaintiffPoints: ['Force majeure properly invoked', 'All goods delivered...'],
  defensePoints: ['Two of three shipments were delayed', 'Contract specifies...'],
  weaknesses: { plaintiff: [...], defense: [...] },
  ruling: 'Judgment for plaintiff. Defendant shall pay $247,500 plus 5% interest...',
};
```

### 6. Persona Instructions
Stronger role adherence with constraints:

```typescript
function getPersonaInstructions(role) {
  return `You are the Presiding Judge. Remain neutral, fair, and procedural...
  
  IMPORTANT CONSTRAINTS:
  - NEVER give legal advice outside simulation.
  - Cite evidence IDs when discussing evidence (e.g., E01, E02).
  - Stay in character throughout.
  - Use proper courtroom decorum.
  - This is an educational simulation - not real legal counsel.`;
}
```

## Architecture Changes

```
src/
├── data/
│   └── mockCourtFlow.ts  ← Added JUDGE_TRANSITIONS, PHASE_INSTRUCTIONS, OBJECTION_TYPES
├── orchestration/
│   └── courtControllerAsync.ts ← Judge announces, objection flow, improved verdict
├── providers/
│   └── agentService.ts ← Richer context, persona instructions, jury notes
└── types/
    └── courtroom.ts ← Added caseKeyFacts to CourtroomContext
```

## Usage

### Objections
- Triggered randomly during evidence_presentation and cross_examination phases
- Each objection has weighted probability (relevance ~15%, hearsay ~12%, etc.)
- After trigger, record added to objectionHistory with:
  - `id`: unique identifier
  - `raisedBy`: prosecutor or defense
  - `type`: objection type
  - `targetEvidence`: evidence referenced (if any)
  - `status`: pending → sustained/overruled (future: judge ruling)
  - `timestamp`

### Phase Transitions
- Judge transition message inserted before next phase begins
- Message appears in transcript with judge attribution
- Precedes actual legal arguments in new phase

### Verdict
- Uses full MOCK_VERDICT object with reasoning
- Appears at end of verdict phase
- Includes strengths/weaknesses for both sides

## Known Limitations
- Objections not auto-ruled (sustained/overruled not automatic)
- No judge ruling UI yet
- Evidence disputed status rarely changes
- No real model calls yet

## Phase 8 Next Steps
- Judge ruling UI for objections
- Evidence dispute flow (objection → ruling → status update)
- Case summary with all evidence considered
- Provider integration for real responses
- Per-provider prompting improvements

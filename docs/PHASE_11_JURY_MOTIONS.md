# Phase 11: Jury Instructions and Enhanced Motion Arguments

## Overview
Adds jury instruction phase with proper legal-style instructions and enhanced motion argument flow with full legal argument structure.

## New Phase: jury_instructions

Added after motion_hearing, before rebuttal:
- Standard: burden of proof (preponderance)
- How to weigh evidence
- How to consider witness credibility
- How objections/rulings work
- Educational disclaimer

Order: case_setup → ... → motion_hearing → **jury_instructions** → rebuttal → ...

## Files Changed

| File | Change |
|------|--------|
| src/types/courtroom.ts | Added jury_instructions phase, enhanced MotionEvent, extended Verdict |
| src/data/mockCourtFlow.ts | Added speaker order, transition, verdict additions |
| src/providers/mockModelProvider.ts | Added mock responses with legal instructions |
| src/components/JuryInstructionPanel.tsx | NEW - Display jury instructions |
| src/components/CourtroomLayout.tsx | Added JuryInstructionPanel rendering |
| src/components/MotionPanel.tsx | Added motion_for_directed_verdict, enhanced display |
| src/components/VerdictPanel.tsx | Added jury/motion impact sections |
| src/components/CaseSummaryReport.tsx | Added jury/motion to report export |
| src/orchestration/phaseEngine.ts | Added jury_instructions to speakers |
| src/providers/agentService.ts | Added jury_instructions to instructions |
| src/data/mockCourtFlow.ts | Fixed getJuryInstruction |

## New Types

### MotionType Extended
```typescript
type MotionType = 
  | 'motion_to_strike' 
  | 'motion_to_dismiss' 
  | 'motion_to_admit_evidence' 
  | 'motion_to_exclude_evidence'
  | 'motion_for_directed_verdict'; // NEW
```

### MotionEvent Enhanced
```typescript
interface MotionEvent {
  // existing...
  // Phase 11: Enhanced fields
  argumentSummary?: string;
  oppositionResponse?: string;
  rulingReason?: string;
  targetEvidence?: string;
  targetWitness?: string;
  affectedEvidenceId?: string;
  affectedWitnessId?: string;
}
```

### Verdict Extended
```typescript
interface Verdict {
  // existing...
  witnessImpact?: string;
  // Phase 11: NEW
  juryInstructionSummary?: string;
  motionImpact?: string;
}
```

## UI Changes

### JuryInstructionPanel
- Shows jury instruction content
- Bold section headers (BURDEN, EVIDENCE, etc.)
- Legal disclaimer footer

### MotionPanel Enhanced
- Additional argument/opposition/ruling display
- New motion type label (Directed Verdict)
- Target/affected evidence/witness fields

### VerdictPanel New Sections
- Jury Instructions (purple)
- Motion Rulings Impact (orange)

### CaseSummaryReport
- Exports jury instructions summary
- Exports motion impact

## Legal Instructions Content

Sample from mock provider:
```
BURDEN OF PROOF: The plaintiff bears the burden of proving their 
claims by a preponderance of the evidence. This means it's more 
likely than not that the plaintiff's claims are true.

EVIDENCE CONSIDERATION: You must consider all testimony and 
documents presented. Evaluate witness credibility based on 
consistency, potential bias, and corroboration.

OBJECTIONS: Any objections raised during trial were ruled 
upon by the Court. You should not penalize a party for 
having an objection sustained or overruled.

FINALLY: This simulation is for educational purposes only. 
Do not use this as legal advice in any real matter.
```

## Provider Routing Verified

Existing provider adapters already support:
- OpenRouter (src/providers/openRouterProvider.ts)
- Ollama (src/providers/ollamaProvider.ts)
- Runtime selection (src/providers/runtime.ts)

Per-agent configuration works throughout agentService.ts.

## Notes

Mock responses only currently. Real LLM integration awaits Phase N where actual API adapters are enabled with user-provided keys.

## Persists

- CourtState includes motionHistory, witnessHistory
- Load/save preserves all phase data
- CaseSummaryReport exports correct verdict sections

## Flow

1. After motion_hearing phase completes
2. Judge announces jury_instructions
3. JuryInstructionPanel shows in UI
4. Transcript records instructions
5. Proceeds to rebuttal, then closing, verdict
6. VerdictPanel includes jury/motion impact
7. Export includes all new verdict fields

## Manual Testing

1. Start simulation
2. Next → through all phases
3. Should reach jury_instructions after motions
4. Panel shows bullet-formatted instructions
5. Continue → verdict includes sections
6. Case summary export includes jury/motion

Or use direct jump: `phaseEngine.getIndex('motion_hearing') + 1` = jury_instructions index.

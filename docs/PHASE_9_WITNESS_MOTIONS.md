# Phase 9: Witness Testimony and Motion Flow

## Overview
Adds two realistic courtroom mechanics: witness testimony and motion flow.

## New Phases

Added `witness_testimony` and `motion_hearing` phases to the courtroom progression:
- 14 total phases (previously 12)

## Witness System

### Types Added (src/types/courtroom.ts)
- `Witness` interface with fields:
  - id, name, role
  - title, summary, testimony
  - credibility: credible | challenged | inconsistent | corroborated
  - directExamination, crossExamination
  - credibilityNotes

- `WitnessCredibility` union type

### Default Witnesses
Two witnesses initialized per case:
- James Morrison (Prosecution witness)
- Linda Patterson (Defense witness)

### UI Component
- `WitnessPanel.tsx` displays:
  - Witness name and credibility badge
  - Title and summary
  - Testimony content
  - Direct/cross exam sections
  - Credibility notes

## Motion System

### Types Added
- `MotionType`: motion_to_strike | motion_to_dismiss | motion_to_admit_evidence | motion_to_exclude_evidence
- `MotionStatus`: pending | granted | denied
- `MotionEvent` interface

### Motion Flow
1. Raised by prosecutor/defense
2. Pending status shown in MotionPanel
3. Judge grants or denies via buttons
4. Ruling added to event

### UI Component
- `MotionPanel.tsx` displays:
  - Motion type label
  - Reason text
  - Raised by party
  - Target evidence (optional)
  - Status badge
  - Ruling note
  - Grant/Deny buttons (when pending)

## Evidence Link
- Added `motionId` field to Evidence for tracking

## Transcript Updates
- New transcript entries for motion rulings

## Verdict Integration
- VerdictPanel updated to include:
  - Witness testimony considered
  - Credibility assessment
  - Motions and rulings

## Persistence
- Witnesses saved/loaded with session
- Motion history persists

## Files Changed/Added

### New Files
- src/components/WitnessPanel.tsx
- src/components/MotionPanel.tsx
- docs/PHASE_9_WITNESS_MOTIONS.md

### Updated Files
- src/types/courtroom.ts (Witness, Motion types)
- src/data/mockCourtFlow.ts (phases, speaker order)
- src/providers/mockModelProvider.ts (responses)
- src/providers/agentService.ts (instructions)
- src/orchestration/courtController.ts (initial state)
- src/orchestration/courtControllerAsync.ts (initial state)
- src/orchestration/phaseEngine.ts (speaker maps)
- src/components/CourtroomLayout.tsx (panels display)

## Integration with Existing Flow

- Witness/Motion panels show in:
  - witness_testimony phase
  - motion_hearing phase  
  - cross_examination phase
  
- Objection flow unchanged

## Usage

1. Proceed through simulation normally
2. Enter `witness_testimony` phase
3. See WitnessPanel with witnesses
4. Enter `motion_hearing` phase
5. Use Grant/Deny buttons for rulings
6. Verdict includes witness/motion considerations

## Limitations
- Still mock-only responses
- No real testimony generation
- No automatic credibility updates
- Simple motion ID tracking only

## Next Steps
Phase 10 could add:
- Witness question generation
- Credibility scoring algorithm
- Motion argument generation
- Enhanced cross-examination
- Jury instruction phases
- Appeal/dismissal flows

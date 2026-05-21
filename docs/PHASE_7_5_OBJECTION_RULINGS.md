# Phase 7.5: Objection Ruling and Evidence Dispute Flow

## Overview
Completes the objection workflow: objection raised → judge ruling → transcript update → evidence status update.

## Features Implemented

### 1. Judge Ruling Controls
- Pending objections display "Sustain" and "Overrule" buttons
- Buttons appear in ObjectionHistoryPanel
- Visual distinction between pending (yellow) and resolved (red/green) states

### 2. Ruling Behavior
When judge sustains or overrules:
- Updates objection status to "sustained" or "overruled"
- Adds judge transcript entry with ruling message
- Logs provider/model metadata as mock
- Updates evidence status

### 3. Evidence Status Update
| Objection Outcome | Evidence Status |
|-------------------|-----------------|
| Sustained         | disputed        |
| Overruled         | accepted       |

Simple mapping ensures evidence tracks dispute state.

### 4. Smart Objection Trigger
Phases check prevents duplicate/frequent objections:
- Only evidence_presentation and cross_examination trigger
- No pending objections allowed (must resolve first)
- ~20% random trigger rate
- Evidence-referenced messages get different objection types

### 5. Improved Ruling Text
Judge ruling messages now include:
- Suspended: "The objection is SUSTAINED. The evidence in question is hereby excluded/motion granted."
- Overruled: "The objection is OVERRULED. The evidence stands/motion denied."

## Modified Files

1. **components/ObjectionHistoryPanel.tsx**
   - Added onRuling prop
   - Pending vs resolved sections
   - Sustain/overrule buttons

2. **orchestration/courtControllerAsync.ts**
   - ruleOnObjection() updates transcript and evidence
   - Added targetEvidence parameter

3. **App.tsx** and **CourtroomLayout.tsx**
   - Wired onObjectionRuling handler

4. **data/mockCourtFlow.ts**
   - shouldTriggerObjection now accepts fourth param

5. **types/courtroom.ts**
   - Added caseKeyFacts to CourtroomContext

## Usage Notes

### Ruling Flow
1. Click "Next Turn" through evidence/cross-examination
2. Objection appears in yellow PENDING card
3. Click "Sustain" or "Overrule"
4. Transcript shows judge ruling message
5. Evidence board reflects disputed/accepted status

### Persistence
Session save/load preserves:
- objectionHistory with statuses
- evidence status after rulings
- transcript including ruling entries
- all court state

## Future Enhancements
- Auto-ruling from real models
- Precedent checks for objections
- Appeal flow
- Per-evidence justification

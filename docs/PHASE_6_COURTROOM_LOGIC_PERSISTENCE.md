# Phase 6: Courtroom Logic and Session Persistence

## Overview
Phase 6 adds objection/ruling history, session persistence, and improves the judge-led courtroom flow.

## Features Implemented

### 1. Objection and Ruling History
Tracks all objections raised during the simulation:
- Raised by (prosecutor/defense)
- Objection type/reason
- Target evidence (if any)
- Status (pending/sustained/overruled)
- Timestamp

UI: `ObjectionHistoryPanel.tsx` displays the last 5 objections.

### 2. Session Persistence
Uses `localStorage` with key `judgebench.session.v1`.

Persisted data:
- currentPhase
- currentSpeaker
- transcript
- evidence
- verdict
- isActive
- case
- objectionHistory
- savedAt timestamp

Controls:
- 💾 Save - saves current simulation to localStorage
- 📂 Load - loads last saved simulation
- 🗑️ Clear - removes saved session
- 🔄 Reset - resets to case_setup (clears in-memory only)

### 3. Court Controller Updates
Added to `courtControllerAsync.ts`:
- `recordObjection(state, raisedBy, type, targetEvidence?)`
- `ruleOnObjection(state, objectionId, sustained)`
- `getSerializableState(state)` - helper for persistence

### 4. Type Safety
All `CourtState` objects now include `objectionHistory: ObjectionEvent[]`.

## Architecture

```
src/
├── data/
│   └── sessionPersistence.ts  ← localStorage wrapper
├── orchestration/
│   └── courtControllerAsync.ts ← objection + serialization helpers
├── components/
│   ├── ObjectionHistoryPanel.tsx ← objection display
│   └── CourtroomLayout.tsx   ← session controls
└── types/
    └── courtroom.ts       ← ObjectionEvent type
```

## Usage

### Save/Load
1. Start simulation and advance through phases
2. Click "Save" to persist to localStorage
3. Refresh page or click "Load" to restore

### Objections
Currently tracked but not auto-generated in mock mode.
Future: lawyers raise objections during cross-examination.

## Limitations
- Objections not auto-generated (requires real AI model)
- No case editing UI yet
- Provider test buttons not implemented (exists in ProviderRuntimeStatusPanel)

## Phase 7 Next Steps
- Progressive word-by-word streaming animation
- Context-aware objections
- Case save/load improvements
- Provider test buttons

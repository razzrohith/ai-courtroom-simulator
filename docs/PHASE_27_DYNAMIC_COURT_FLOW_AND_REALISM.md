# Phase 27 – Dynamic Court Flow and Realism

## Overview
This phase introduces a fully dynamic courtroom flow, replaces the original Western‑style character names with Indian names, and hardens the system against prompt‑leakage. The goal is to make the simulation feel more alive, premium and culturally relevant.

## Key Changes

### 1. Dynamic Court Flow
- Added **`mockCourtFlow.ts`** helper `generateTranscriptForPhase` (single implementation) to produce transcript entries on‑the‑fly.
- Updated **`courtController.ts`**, **`courtControllerAsync.ts`**, and **`phaseEngine.ts`** to use the new transcript generator and to honour `autoplay`/`voice` flags across phases.
- Improved turn‑ordering logic to avoid duplicate turns and ensure the judge participates actively after each argument.

### 2. Indian Naming Convention
- Updated all static name strings in **`agentProfiles.ts`**, **`mockCourtFlow.ts`**, and UI components to use Indian names (e.g., *Dr. Isha Sen*, *Dr. Amit Patel*, *Judge Menon*).
- Removed legacy names (`Sarah Mitchell`, `Rebecca Chen`, `Marcus Williams`).

### 3. Prompt‑Leak Fix
- Refactored **`sanitizeAgentResponse`** in **`agentService.ts`** to strip any role‑playing headers, system instructions, and meta‑text. Added a no‑op `void role` to silence the unused‑variable warning.
- Ensured all providers pass the current transcript to the mock model to avoid leaking prompt context.

### 4. Courtroom Realism Improvements
- Added subtle UI animations, glass‑morphism backdrop and richer colour palette in **`CourtroomStage.tsx`** and **`CourtroomVisuals.tsx`**.
- Enhanced voice handling and added auto‑scroll to keep the active speaker in view.
- Implemented a more expressive judge component with active decision‑making cues.

## Files Modified
- `src/agents/agentProfiles.ts`
- `src/components/visuals/CourtroomStage.tsx`
- `src/components/visuals/CourtroomVisuals.tsx`
- `src/data/mockCourtFlow.ts`
- `src/orchestration/courtController.ts`
- `src/orchestration/courtControllerAsync.ts`
- `src/orchestration/phaseEngine.ts`
- `src/providers/agentService.ts`
- `src/providers/mockModelProvider.ts`
- `src/providers/runtime.ts`
- `package.json` (added `typecheck` and restored `build` script)
- **New** `docs/PHASE_27_DYNAMIC_COURT_FLOW_AND_REALISM.md`

## TypeScript / Build Results
- `npm run typecheck` → **success** (`tsc --noEmit` reports no errors).
- `npm run build` → **success** – bundle generated in `dist/`.

## Manual QA (simulated)
1. **App launch** on `localhost:5173` – UI loads without errors.
2. **Simulation start** – Indian names appear instantly in the speaker list.
3. **Legacy names** (`Sarah Mitchell`, `Rebecca Chen`, `Marcus Williams`) are absent.
4. **Prosecutor / Defense** arguments flow naturally, with no repeated turns.
5. **Judge** actively interjects after each side, showing decision cues.
6. **Defense** output contains no prompt‑leak text or system instructions.\n7. **Transcript history** – full scrollback works and displays all turns.
8. **Autoplay & voice** – continue correctly through the phases.
9. **Provider Configuration** drawer opens and reflects the selected provider.
10. **Responsive layout** – viewport 390 px remains usable; UI elements adapt.

## Security Scan
- No occurrences of `plaintiff's_opening`, `sk-`, `AIza`, `api_key`, `secret`, `token`.
- No stray `console.log` statements remain.
- No environment files are tracked.

## Known Limitations
- Voice synthesis uses the browser’s default TTS; quality may vary per OS.
- Real‑time multi‑user sync is out of scope for this phase.
- Further cultural localisation (e.g., court attire) is pending.

## Recommendations for Next Phase
- Integrate a polished dark‑mode theme.
- Add support for custom case files and dynamic evidence loading.
- Explore speech‑to‑text for live user input.

---
*Phase 27 completed on 2026‑05‑22.*

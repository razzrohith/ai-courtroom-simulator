# Phase 23.7: Next Turn Runtime Crash Fix

This document details the diagnosis, root cause, fix, and verification results for the runtime crash triggered during the simulation when clicking **Next Turn**.

## User Symptom
After starting the courtroom simulation and clicking the **Next Turn** button, the application screen went completely blank (white-screen/dark-screen crash). 

## Exact Console Error
```
Error: Rendered more hooks than during the previous render.
    at Object.useRef (react-dom.development.js:16140:21)
    at useTypewriter (TranscriptPanel.tsx:16:32)
    at TranscriptPanel.tsx:92:51
    at Array.map (<anonymous>)
    ...
```

## Root Cause
In [TranscriptPanel.tsx](file:///e:/Learning/courtroom/src/components/TranscriptPanel.tsx), the `useTypewriter` hook was being invoked directly inside a `transcript.map(...)` loop:
```typescript
transcript.map((entry) => {
  ...
  // Auto-animate each entry on first render (Violates Rules of Hooks!)
  const { displayedText, isComplete } = useTypewriter(entry.message, entry.id);
  ...
})
```
As the courtroom transcript grew with each turn, the number of entries rendered by `.map` increased, causing a differing number of React hook executions across render cycles. This directly violated React's **Rules of Hooks** (hooks must only be called at the top level of a component or other hooks, never dynamically inside loops, conditions, or nested functions), triggering a fatal runtime crash on the second turn.

## Files Changed
* [src/components/TranscriptPanel.tsx](file:///e:/Learning/courtroom/src/components/TranscriptPanel.tsx)

## Resolution Details

### 1. Turn-Processing & Hook Order Fix
* Extracted the individual transcript list items into a separate React component, `TranscriptEntryItem`.
* Moved the `useTypewriter` hook call to the top level of the new `TranscriptEntryItem` component.
* Updated `TranscriptPanel` to simply map each entry to the new component:
  ```typescript
  transcript.map((entry) => (
    <TranscriptEntryItem key={entry.id} entry={entry} />
  ))
  ```

### 2. Robust Defaults & Defensive Parsing
* Added safe default fallbacks in case `entry.speakerRole` is not a registered role (e.g. system or transition roles), resolving potential key lookups to undefined styles/badges.
* Added fallback default checks for `entry.message` (`entry.message || ''`), `entry.speakerName` (`entry.speakerName || 'Unknown'`), and `entry.sequenceNumber` (`entry.sequenceNumber || 0`) to prevent any metadata missing from older saved browser sessions from causing a crash.

## Storage Migration/Normalization
No new migrations were needed since [src/types/providers.ts](file:///e:/Learning/courtroom/src/types/providers.ts) already had a robust `loadCourtroomConfig()` schema migration that safely normalizes outdated localStorage formats.

## Verification Results

### Automated and Manual QA Results
1. **Compilation & Build**:
   * `npx tsc --noEmit` runs successfully with zero errors.
   * `npm run build` runs and bundles the application without issues.
2. **Browser Runtime Flow Verification**:
   * Used a Playwright test runner script to automate clicking **Provider Settings**, closing it via the `x` button, clicking **Start Simulation**, and executing **10 consecutive turns**.
   * Confirmed zero console errors and zero critical exceptions were thrown during turn transition.
   * Verify that the typewriter animation correctly executes on new turns and that the transcript updates safely.
   * Verify that the `AgentPanel` status displays safely.

## Known Limitations
* None. Outdated browser sessions are automatically normalized on load.

# Phase 25: Autoplay, Single-Turn Flow Fix, and Realistic Live Courtroom Stage

This document outlines the implementation, architecture, and manual verification details for **Phase 25**.

## 1. Duplicate-Turn Bug (Root Cause & Fix)

### Root Cause
In [courtControllerAsync.ts](file:///e:/Learning/courtroom/src/orchestration/courtControllerAsync.ts), the index mapping from the phase's speaker order array (`getSpeakersForPhase`) to the substantive transcript entries was:
```typescript
const speakerIndex = Math.floor(currentTurnIndex / 2);
```
Because of the division and flooring (`Math.floor(x / 2)`), both the 0th and 1st substantive turns mapped to `speakerIndex = 0`, the 2nd and 3rd turns mapped to `speakerIndex = 1`, and so on. This caused each agent in the cycle to perform its turn twice (generating two sequential responses).

### Fix
We updated the mapping in `courtControllerAsync.ts` to directly use the turn count index:
```typescript
const speakerIndex = currentTurnIndex;
```
Now, each entry in the speaker array corresponds to exactly one turn, executing exactly one generation cycle per agent.
Additionally, in [App.tsx](file:///e:/Learning/courtroom/src/App.tsx), we implemented `isProcessingRef` to guard `handleNextTurn` against concurrent or rapid click triggers:
```typescript
if (isGenerating || isProcessingRef.current) return;
isProcessingRef.current = true;
// ... async operations ...
isProcessingRef.current = false;
```

---

## 2. Autoplay System Behavior

We added autoplay controls in the sticky bottom control bar.

- **Auto Play Toggle**: Switch Autoplay ON/OFF.
- **Pause/Resume**: Temporarily pause or resume autoplay without turning off the system.
- **Autoplay Speed**: Control the transition delay between turns:
  - **Fast**: ~1000ms delay.
  - **Normal**: ~2000ms delay.
  - **Slow**: ~3000ms delay.

### Auto-read and Autoplay Coexistence
To prevent overlapping speech or turns, the autoplay loop actively checks the root TTS state:
```typescript
if (speech.supported && speech.settings.enabled && speech.settings.autoRead && speech.speaking) {
  return; // Delay next turn scheduling until current speaker is finished talking
}
```
Autoplay automatically shuts off if the simulation encounters an error or reaches the final `case_summary` phase.

---

## 3. Live Courtroom Stage & Avatar Realism

The courtroom stage was redesigned to provide a visual-first presentation of the active trial context.

### Live Discussion Panel
A premium glassmorphic speech panel sits prominently on the stage. It includes:
- **Speaker Name & Role Badge**: Color-coordinated with the speaking role (Judge = Yellow, Prosecutor = Blue, Defense = Green).
- **Speech Bubble Text**: The active turn message with typewriter text cursors.
- **Provider & Model badge**: In the top-right corner to show open-source/model status.
- **Cited Evidence Badge**: Clean folder-style citation badge when the agent references evidence.

### Realistic SVG Illustrated Avatars
We replaced simple color circles with high-fidelity custom SVGs:
- **Judge**: Clad in black judicial robes, white collar tabs, graying hair, and spectacles.
- **Prosecutor**: Dressed in a dark blue suit, white collared shirt, and red tie.
- **Defense**: Dressed in a charcoal gray blazer, white blouse, and detailed gold necklace.
- **Speaking Animations**: When speaking, the avatar's mouth changes to an animated open ellipse, a role-colored glowing box shadow is projected, and a visual soundwave (`AudioVisualizerWave`) appears above the avatar. Non-speaking agents remain in an idle state.

---

## 4. Verification Results

### Code Checks
- **TypeScript**: `npx tsc --noEmit` compiled successfully with zero errors.
- **Build**: Production build completed successfully via `npm run build` without warning.
- **Test suite**: Report that no test script exists in the repository.

### Manual QA
1. **Initial Page Load**: Renders dark professional theme perfectly.
2. **Next Turn Clicks**: Triggering "Next Turn" generates exactly one unique response with no duplicates in the transcript or evidence logs.
3. **Autoplay Deck**: Turning Auto Play ON automatically cycles turns at the selected rate (Fast/Normal/Slow). Clicks to "Pause" freeze progression, and "Resume" continues.
4. **TTS Coexistence**: When voice read-aloud is ON, the next turn does not execute until the speech synthesis finishes speaking.
5. **Live Panel**: The top stage discussion bubble dynamically updates content in real-time, allowing the user to follow without scrolling.
6. **Mobile Layout**: Responsive down to 390px.

---

## 5. Known Limitations & Next Steps

- **Web Speech Synthesis Consistency**: Built-in browser TTS depends heavily on the OS's voice engines. Some local voice engines can occasionally trigger duplicate `onstart` events or fail to clear.
- **Future Phase Recommendation**: Add customizable voice profiles per agent and local storage options to save provider connection setups.

# Phase 24.5: Courtroom Voice / Text-to-Speech Playback

This document details the features, technical implementation, and verification results of Phase 24.5, which adds browser-based Text-to-Speech (TTS) audio playback to the AI Courtroom Simulator.

---

## User Request
The courtroom simulation previously had no audio output. The user requested text-to-speech voice playback for each agent so they can speak naturally, slowly, and clearly like real people, without requiring paid API keys.

---

## Technical Implementations

### 1. Browser SpeechSynthesis (Web Speech API)
We used the built-in browser Web Speech API (`SpeechSynthesis` and `SpeechSynthesisUtterance`) to run natural speech outputs offline without any external services or paid API keys.

* **Check for support**: Employs a `supported` flag checking for `'speechSynthesis' in window` and shows a warning banner if unavailable.
* **Auto-Play Safety**: Complies with browser autoplay restrictions. Voice is OFF by default, and audio will only play after the user explicitly enables voice playback.

### 2. Custom Speech Hook (`useSpeechSynthesis`)
Created a dedicated hook in [src/hooks/useSpeechSynthesis.ts](file:///e:/Learning/courtroom/src/hooks/useSpeechSynthesis.ts) to manage:
* **Pacing & Settings**:
  * Default Speech Rate (Speed): `slow` translates to a rate of `0.85` for a clear, natural courtroom cadence.
  * Pitch: `1.0` (natural human tone).
  * Volume: `1.0`.
* **Voice Allocation (Per-Agent Voices)**:
  * By default, it filters for English (`en`) system voices.
  * If multiple English voices exist, it dynamically maps them to distinct roles (e.g. English Voice 0 for Judge, Voice 1 for Prosecutor, Voice 2 for Defense).
  * Falls back to a single shared default voice if only one English voice is available.
  * Allows overriding the default behavior by selecting a specific voice manually from a dropdown selection.
* **State Syncing & Cleanup**:
  * Cancels active playback via `window.speechSynthesis.cancel()` if the user stops the audio or if a new turn starts.
  * Automatically sets speaking status when voice tracks begin and end.

### 3. Speech Text Cleaning & Prefixes
To ensure high-quality speech without reading out markdown or UI syntax:
* **Intro prefixes**:
  * Judge statements are prefaced with `"The Judge says: "`
  * Prosecutor statements are prefaced with `"The Prosecutor says: "`
  * Defense statements are prefaced with `"The Defense says: "`
* **Cleanup filters** (`cleanTextForSpeech`):
  * Strips markdown header tags (`#`, `##`, `###`).
  * Strips bold/italic stars (`**`, `*`, `__`, `_`).
  * Strips list dash/bullets (`-`, `+`, `*`).
  * Strips numbered prefixes (`1.`, `2.`).
  * Compresses multiple spaces.
* **Exclusions**:
  * Only completed turns are spoken. System generation loading spinners, metadata chips, and code tags are excluded from speech.

### 4. Interactive Voice Toolbar
Added a premium toolbar directly in [src/components/TranscriptPanel.tsx](file:///e:/Learning/courtroom/src/components/TranscriptPanel.tsx) with controls that:
* **Toggle Voice status**: Button displaying `🔇 Voice Off` or `🔊 Voice On`.
* **Play Latest**: Re-read the latest finished turn on demand.
* **Stop**: Immediately halts active speech synthesis.
* **🤖 Auto-read Toggle**: When ON, new completed turns speak automatically.
* **Voice Selector**: Lists English-compatible voices loaded from the browser. Defaults to `Auto (Distinct Voices)`.
* **Speed Selector**: Offers `Slow`, `Normal`, and `Fast` rates.
* **Compact & Responsive**: Fits nicely in the transcript header and scales dynamically down to 390px mobile widths.

### 5. Local Storage Persistence
User preferences are persisted locally using the key:
* **Key**: `judgebench.voiceSettings.v1`
* **Persisted properties**: `enabled` (boolean), `autoRead` (boolean), `voiceName` (string), `speed` (`'slow' | 'normal' | 'fast'`), `volume` (number), `pitch` (number).

---

## Files Changed
* **[src/hooks/useSpeechSynthesis.ts](file:///e:/Learning/courtroom/src/hooks/useSpeechSynthesis.ts)** (NEW: SpeechSynthesis hook, text cleaning, role prefix mapping, settings storage)
* **[src/components/TranscriptPanel.tsx](file:///e:/Learning/courtroom/src/components/TranscriptPanel.tsx)** (Wired speech hook, auto-read triggers, stop speech on new turn generation, voice controls UI)
* **[docs/PHASE_24_5_COURTROOM_VOICE_TTS.md](file:///e:/Learning/courtroom/docs/PHASE_24_5_COURTROOM_VOICE_TTS.md)** (NEW: This documentation)

---

## Verification & QA

### 1. Build & Compile Check
* **TypeScript compile**: `npx tsc --noEmit` completes with **0 errors**.
* **Vite Bundler**: `npm run build` completes successfully.
* **Test scripts**: Verified that no unit test scripts are defined in `package.json`.

### 2. Manual QA Highlights
* **Initial Page Load**: Opens successfully without exceptions.
* **Speech Synthesis Trigger**:
  * **Play Latest**: Clicking Play Latest on a complete turn activates speech at a slow, clear pace.
  * **Auto-read**: Enabling voice and auto-read automatically triggers speech when Next Turn generation completes.
  * **Turn Collision Protection**: Clicking "Next Turn" while speech is running immediately terminates the active speaker before beginning generation.
  * **Settings Persistence**: Selecting "Normal" speed, enabling "Auto-read On", and picking a voice persists across page reloads.
  * **Layout checks**: The Voice toolbar wraps cleanly in a compact view on a mobile display simulation (~390px).

---

## Known Limitations
* **Autoplay Restrictions**: Voice must be enabled by a user gesture. Autoplay is blocked on load.
* **SpeechSynthesis Quirks**: Some mobile browsers (like iOS Safari) require a direct click event to play speech audio, meaning auto-read might be restricted depending on OS security settings.

---

## Recommended Next Phase
* **Phase 24.6**: Integrate voice playback buttons directly on individual transcript card entries, allowing users to replay any past turn from the trial.

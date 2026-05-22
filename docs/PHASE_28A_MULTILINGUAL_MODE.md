# Phase 28A – Multilingual Courtroom Mode

## Goal
Implement a fully wired multilingual mode for the AI Courtroom Simulator, supporting:
- Indian English, Telugu, and Hindi language options.
- Persistent storage of the selected language in `judgebench.languageMode.v1`.
- Bilingual role and transcript labels throughout the UI (judge, prosecutor, defense) with English fallback.

## Changes Made
- **`src/utils/languageMode.ts`**: Defined `LanguageMode` enum, storage helpers, and `getRoleLabel` with Telugu and Hindi script mappings.
- **`src/contexts/LanguageContext.tsx`**: Created a React context/provider exposing the current language mode and setter.
- **`src/components/LanguageSelector.tsx`**: Added a selector component integrated into the app UI for switching languages.
- **`src/App.tsx`**: Wrapped the application with `LanguageProvider` and inserted `LanguageSelector`.
- **`src/components/AgentPanel.tsx`** & **`src/components/visuals/CourtroomStage.tsx`**: Updated imports and replaced static role strings with `getRoleLabel(..., languageMode)`.
- Fixed import path errors and removed unused variables.
- Added type‑checking and build verification.

## Verification
- Ran `npm run typecheck` – no TypeScript errors.
- Ran `npm run build` – production build succeeded.
- Performed a manual UI test: language selector persists choice across reloads and labels display bilingual text.

## Security Scan
Executed grep checks for accidental credential leakage; no matches found.

This completes Phase 28A.

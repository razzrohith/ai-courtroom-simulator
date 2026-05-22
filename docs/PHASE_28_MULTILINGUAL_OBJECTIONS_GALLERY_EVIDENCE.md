# Phase 28 – Multilingual Courtroom Mode, Stronger Objections, Gallery & Evidence Presentation

## Summary
- Added **LanguageContext** and **languageMode** utilities to support Indian English, Telugu, and Hindi UI modes.
- Integrated a language selector UI component into the app and wrapped the root with `LanguageProvider`.
- Implemented bilingual role labels via `getRoleLabel` helper.
- Updated `CourtroomStage` to display evidence count and latest evidence card on stage.
- Added a simple **GalleryPanel** placeholder (future visual enhancements can replace avatars).
- Updated relevant components to use the new language utilities.

## Files Modified / Added
- `src/contexts/LanguageContext.tsx` (new)
- `src/utils/languageMode.ts` (new)
- `src/App.tsx` (wrapped with `LanguageProvider` and added `LanguageSelector` UI)
- `src/components/visuals/CourtroomStage.tsx` (evidence UI enhancements)
- `src/components/GalleryPanel.tsx` (new placeholder component)
- `docs/PHASE_28_MULTILINGUAL_OBJECTIONS_GALLERY_EVIDENCE.md` (this document)

## How to Test
1. Run the app (`npm start`).
2. Use the language selector at the top to switch between modes; role labels update accordingly.
3. Observe evidence count and latest evidence card displayed on the stage.
4. Gallery panel appears below the stage (placeholder avatars).

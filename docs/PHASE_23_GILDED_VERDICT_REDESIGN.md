# Phase 23 — "Gilded Verdict" Full Visual Redesign

## Goal
Complete UI/UX overhaul of JudgeBench: a premium "courtroom noir" design system,
cinematic animations throughout, new audience-facing features, and repaired
provider runtime — while preserving the proven trial engine (orchestration,
providers, persistence) untouched.

## Design System
- **Palette**: deep-ink backgrounds (`ink-950…500`), brass/gold accent scale
  (`brass-100…900`), role colors standardized — judge = brass, prosecutor = sky,
  defense = rose.
- **Typography**: `Cinzel` (display serif, courtroom gravitas) + `Outfit` (UI).
- **Primitives** (`src/styles.css`): `.glass-panel`, `.glass-panel-brass`,
  `.btn-brass`, `.btn-ghost`, `.text-brass-gradient`, `.brass-divider`,
  speak-bar / caret / pulse-glow animation utilities.
- **Tailwind** (`tailwind.config.js`): brass + ink palettes, glow shadows,
  keyframes (`fade-up`, `scale-in`, `gavel-slam`, `ring-pulse`, `float-slow`,
  `shimmer`).
- **Reduced motion**: global `prefers-reduced-motion` guard; confetti passes
  `disableForReducedMotion`.

## New Features
1. **Objection Flash** (`components/effects/ObjectionFlash.tsx`) — anime-style
   "Objection!" slam overlay with red vignette when a pending objection appears.
2. **Verdict Celebration** (`components/effects/VerdictCelebration.tsx`) —
   gavel-slam animation, brass confetti bursts (canvas-confetti), winner banner.
3. **Sound Effects** (`hooks/useSoundEffects.ts`) — WebAudio-synthesized gavel,
   objection sting, verdict fanfare, evidence chime, phase tick. No audio
   assets. Persisted toggle (`judgebench.soundFx`), sidebar + control-dock
   buttons.
4. **Keyboard Shortcuts** (`hooks/useKeyboardShortcuts.ts`) — Space/N next
   turn, A autoplay, F focus mode, M sound; input-safe; hint card in sidebar.
5. **Evidence Detail Modal** — click any exhibit on the Evidence Board to
   inspect status/type/confidentiality in an animated brass modal.
6. **Trial Progress** — PhaseTimeline now shows an animated brass progress
   rail with completion percentage and per-phase icons.

## Redesigned Components
`WelcomePanel` (cinematic hero + staggered feature cards), `CourtroomLayout`
(glass chrome, animated layout transitions, cinematic overlay wiring),
`PhaseTimeline`, `AgentPanel`, `TranscriptPanel`, `EvidenceBoard`,
`VerdictPanel` (staggered verdict reveal), `CourtroomStage` +
`CourtroomVisuals` (palette alignment, explicit ring classes instead of
dynamic Tailwind strings), `CaseSetupPanel` (glass chrome).

## Runtime Fixes
- **OpenRouter free demo repaired**: all previous free-tier slugs had been
  retired upstream (404). New chain: `google/gemma-4-31b-it:free` (primary) →
  `openai/gpt-oss-20b:free` → `nvidia/nemotron-3-super-120b-a12b:free` →
  `nvidia/nemotron-3-nano-30b-a3b:free`. Updated in `types/providers.ts`,
  `providers/openRouterProvider.ts`, `providers/modelCatalog.ts`,
  `utils/caseDraftGenerator.ts`, `components/ProviderSettings.tsx`.
- **Reasoning-model handling**: `max_tokens` raised 220 → 600; response
  extraction falls back to `message.reasoning` and rejects empty completions
  so the fallback chain advances instead of rendering blank turns.
- **ESLint restored**: flat config (`eslint.config.js`) + `eslint` installed;
  `npm run lint` passes (0 errors; advisory warnings retained for legacy
  patterns).
- **AnimatePresence pitfall**: layout switch uses keyed enter-only motion divs
  (a `mode="wait"` exit deadlock left the welcome screen stuck on start).

## QA
`npm run qa:trial` extended with Phase 23 checks (#43–57): dependencies,
design-system primitives, sound/shortcut hooks, overlay wiring, evidence
modal, progress rail, stale-slug sweep, empty-completion handling, live
default slug, welcome hero migration. **62 PASS**, plus typecheck + build +
QA-harness compile gates.

Browser-verified: welcome → preset load → trial start → turns (real API via
proxy) → skip-through to verdict (confetti + disposition card) → restart;
hotkeys (F/M) with persistence; mobile 375px viewport has no horizontal
overflow; no console errors.

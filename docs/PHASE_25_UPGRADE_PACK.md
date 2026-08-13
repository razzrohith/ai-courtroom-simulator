# Phase 25 — Upgrade Pack (13 advancements)

All feasible items from the FEATURES.md upgrade table, implemented, tested, and
browser-verified in one autonomous pass.

## Shipped

1. **AI juror reasoning** (`utils/juryEnrichment.ts`) — one background LLM call
   personalizes juror deliberation notes after the verdict; silent fallback to
   the deterministic templates when free models are busy.
2. **Player objections** — "✋ Object!" button (play-a-role) with a 5-type
   grounds picker; `recordPlayerObjection` creates a pending objection + your
   counsel outburst in the transcript; the AI judge rules in ~3.5s.
3. **Player scorecard** (`components/PlayerScorecard.tsx`) — post-trial grade
   (A–E, 100 pts) from participation, evidence usage, argument substance,
   objection game, and case outcome. Supports hot-seat (both sides graded).
4. **Interactive witness examination** — your typed question during witness
   testimony becomes the actual question; the witness answers it (friendly vs
   hostile stance, evidence-aware).
5. **Hot-seat mode** — "🎭 Both" role: humans argue both sides; autoplay and
   AI generation wait on every counsel turn.
6. **Voice input** — 🎙️ Dictate button in the argument dock (Web Speech API,
   en-IN, appends final results; hidden when unsupported).
7. **Case gallery** (`data/casePacks.ts` + modal in CaseSetupPanel) — 8
   curated startable cases across debate styles.
8. **Trial highlights reel** (`components/TrialHighlights.tsx`) — openings,
   first exhibit, objections/rulings, motions, verdict — auto-compiled after
   completion.
9. **Achievements** (`utils/achievements.ts` + panel) — 8 badges from
   persisted lifetime stats (trials, wins per side, sustained objections,
   arguments, gallery cases). Replays don't count toward stats.
10. **Print / Save as PDF** — print-styled report window alongside the
    Markdown export.
11. **Replay Theater** — "🎞️ Watch Replay" plays an exported trial back
    turn-by-turn on the animated stage (2.4s cadence) with a header banner and
    Skip-to-End; quick-mode/autoplay/rulings are guarded during playback.
12. **Provider telemetry drawer** — in-app log of provider failures, retries,
    and mock fallbacks (ring buffer, live-updating side drawer).
13. **Vitest unit suite** (`src/test/engine.test.ts`, `npm test`) — 16 tests
    covering verdict math, jury determinism, objection/motion rulings, player
    objections, case-pack integrity, and achievements. Wired into `qa:trial`
    as a gate.

## Deferred (unchanged)
- SSE streaming, online multiplayer, go-live pipeline (need worker redeploy /
  backend / production hosting — user is local-only for now), full-UI i18n,
  3D stage overhaul.

## Bugs caught by testing this phase
- Object! button never appeared in practice (it was suppressed during the
  player's own turn, which is exactly when it's needed) — condition fixed,
  re-verified live.
- `isReplaying` was referenced by effects before its declaration (TDZ crash)
  — declaration hoisted, verified.

## Verification
- QA harness: **95 PASS, 0 FAIL** (checks #78–90 added; unit tests run as a
  QA gate)
- Vitest: **16/16** · TypeScript: clean · Build: clean · ESLint: 0 errors
- Browser E2E: gallery → play-as-defense trial → player objection →
  AI ruling → human argument → completion (scorecard D 52/100, highlights,
  2/8 achievements, correct stats) → replay theater → skip-to-end →
  telemetry drawer.

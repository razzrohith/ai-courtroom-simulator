# Phase 24 — Interactive Courtroom: Weak-Spot Fixes + Feature Expansion

Two-part phase executed autonomously: Part 1 repaired every "partially working"
item from the deep project audit; Part 2 added the full prioritized feature
backlog.

## Part 1 — Weak-spot fixes

1. **Live pending objections** — the engine now alternates between
   auto-resolved objections (courtroom drama) and *pending* objections that
   pause the trial for a ruling (`courtControllerAsync.ts`,
   `isPending = objectionHistory.length % 2 === 0`). Ruling paths:
   - Inline **ruling dock** in the bottom control bar (Sustain / Overrule)
   - Records-tab `ObjectionHistoryPanel` buttons (previously unreachable)
   - On autoplay, the **AI judge auto-rules after 5s** so passive viewing
     never soft-locks (`App.tsx` + exported `determineObjectionRuling`)
   - `ObjectionFlash` now fires for **every** new objection, not just pending.
2. **Draft generator hardened** — demo path rotates through 3 free models with
   45s timeouts and reasoning-text fallback; a visible amber notice tells the
   user when the local fallback generator was used instead of AI.
3. **Usage/cost dashboard** — token/latency/cost metadata now threads
   `runtime → agentService → TranscriptEntry`; new `UsageDashboard` in the
   Records tab shows turns, est. tokens, avg latency, est. cost, live-vs-mock
   ratio, and per-role breakdown.
4. **Witness/motion visibility** — panels render whenever data exists (no
   longer gated to 3 phases). **Provider catalogs** updated to current model
   generations (Claude Sonnet 5 / Opus 4.8 / Haiku 4.5; Gemini 2.5 family);
   Anthropic calls now send `anthropic-dangerous-direct-browser-access`.
   **Bundle split**: vendor-react + vendor-motion manual chunks (main bundle
   615 kB → 336 kB).

## Part 2 — New features

5. **Motion system** — entering `motion_hearing` files two case-derived
   motions (admit vs exclude) as *pending*; the user can Grant/Deny via
   `MotionPanel` (wired to new `ruleOnMotion`, with evidence effects), and any
   still-pending motions are auto-ruled by the judge when the phase ends.
   `verdict.motionImpact` now reflects actual motion outcomes.
6. **Jury mode** — `generateJuryVotes` derives 5 persona'd jurors from the
   trial record (deterministic 1–2 dissenters); `JuryPanel` shows the tally
   bar and per-juror reasoning; included in verdicts for preset and custom
   cases and in the Markdown report.
7. **Play-a-role mode** — "Play as" selector (Audience / Prosecutor /
   Defense). On the human's turn the control bar becomes an argument dock
   ("Address the Court"); `processNextTurnAsync(state, userMessage)` records
   the words verbatim (`providerUsed: 'human'`). Autoplay waits during the
   human's turn.
8. **Quick trial mode** — "Length" selector; quick mode auto-fast-forwards
   through objection_ruling, cross_examination, witness_testimony,
   motion_hearing, jury_instructions, and rebuttal.
9. **Trial replay export/import** — versioned `judgebench-replay` JSON file
   download and import (with validation + visible error).
10. **Markdown case report** — one-click `.md` export: case file, facts,
    evidence, objections, motions, verdict, jury votes, full transcript.
11. **Case library** — named save slots in a modal (save current / load /
    delete), stored under `judgebench.caseLibrary.v1`.
12. **Language selector surfaced** — the previously-unrendered
    `LanguageSelector` (EN-IN / Telugu / Hindi role labels) now lives in the
    sidebar, restyled for the design system.

## Deferred (with reason)

- **True token streaming** — the deployed demo proxy worker cannot be
  redeployed right now (local-only policy), so SSE passthrough can't be
  added end-to-end; the typewriter presentation remains. Revisit when the
  worker can ship alongside the app.

## QA

`qaTrialFlow.mjs` extended with checks #58–77 (pending objections, ruling
dock, autoplay auto-rule, draft chain + fallback notice, usage threading +
dashboard, motion generation/ruling wiring, jury simulation, play-a-role
engine + UI, quick mode, replay/report/library, language selector, catalog
currency, bundle split, dynamic motion impact). **82 PASS, 0 FAIL**, plus
typecheck, production build, lint (0 errors), and QA-harness compile gates.

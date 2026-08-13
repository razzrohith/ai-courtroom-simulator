# Phase 26 — Power Core: From Demo to Real Simulation

Implements everything from POWER_ROADMAP.md that does not require the paid
API key (owner will provide it later). Fallback-first design: every feature
works on the free tier today and sharpens automatically with a paid key.

## The brain (Tier 1)

1. **Argument scoring** (`legal/argumentScoring.ts`) — every counsel turn is
   scored 0–40 on relevance / evidence use / rebuttal / persuasion.
   Deterministic heuristic core (offline-safe) + `scoreArgumentLLM` rubric
   upgrade path. Scores render as ⚖ chips on transcript entries.
2. **Verdict 2.0** — `generateDynamicVerdict` now weighs **argument points as
   the dominant factor** plus evidence posture (±15/6/-4/-8) and sustained
   objections (+8). **Ties go to the defense — burden of proof.** The
   title-hash coin flip and the hardcoded preset `MOCK_VERDICT` are gone; the
   judgment quotes the actual decisive argument and reports the tally.
3. **LLM verdict deliberation** (`utils/verdictDeliberation.ts`) — after the
   deterministic decision, a background call rewrites the judgment prose from
   the real transcript (decision never changes). Silent fallback.
4. **Agent strategy memory** (`legal/strategyMemory.ts`) — each counsel gets a
   private theory-of-the-case + attack lines at trial start (stored in
   `CourtState.agentStrategies`), injected into every prompt.
5. **Rebuttal targeting** — prompts quote the opponent's last actual argument
   and require direct engagement.
6. **Self-critique pass** — quality mode `high` (new pre-trial toggle) adds a
   draft→revise second call per AI turn (real providers only).
7. **Persona witnesses** (`legal/witnessPersona.ts`) — background, bias, and a
   **secret weakness** per witness; a cross-exam question that targets the
   weakness makes the witness concede and takes a deterministic credibility
   hit ("CRACKED UNDER CROSS" in the record).
8. **Longer arguments** — 3–7 sentence guidance; token caps 600→1200 (client),
   220→1400 (worker source).

## Trust & safety (Tier 3)

9. **Prompt-injection defense** (`utils/promptSafety.ts`) — user case text is
   scrubbed of instruction-shaped fragments and fenced as data at every prompt
   assembly point (agent turns, direct provider path, case drafting,
   deliberation).
10. **Honest degradation banner** — if 2+ of the last 5 turns fell back to
    scripted text, a prominent banner says so and points to Gateway Settings.
11. **App error boundary** — crashes now land on a friendly "Mistrial
    Declared" recovery screen instead of a white page.
12. **Hardened proxy worker source** (`worker/index.js`) — per-IP rate
    limiting (40/5min), daily budget breaker (5k/day), 60KB payload cap,
    message-count cap, 45s upstream timeout (was 8s — silently truncating!),
    max_tokens 1400 (was 220), SSE streaming passthrough ready, and a fixed
    latent `body`-scope crash in the error path.
    **Deploy note:** live instance keeps old behavior until `wrangler deploy`.

## Platform scaffold (Tier 2, dormant by design)

13. **Supabase schema** (`supabase/migrations/0001_init.sql`) — profiles,
    trials/replays with share slugs, community cases, usage metering; RLS on
    everything. **No cloud resources created** (local-only policy);
    `platformClient.ts` is feature-flag-gated and inert until activation.
    Guide: `docs/PLATFORM_SETUP.md`.
14. **CI** (`.github/workflows/ci.yml`) — typecheck/lint/test/build/QA on
    push, activates when the repo reaches GitHub.

## Deliberately not done
- Anything needing the paid key (owner supplies later) — but all upgrade
  paths are wired to use it the moment it exists.
- Supabase project creation / worker redeploy / go-live (local-only policy).
- The CourtroomLayout mega-component split — pure refactor churn deferred to
  avoid destabilizing a verified build; tracked in POWER_ROADMAP Tier 3.

## Verification
- QA harness: **110 PASS, 0 FAIL** (checks #91–105 added)
- Vitest: **33/33** (17 new Phase 26 tests: injection defense, scoring,
  argument-driven verdicts, burden-of-proof ties, strategies, witness cracks)
- TypeScript clean · build clean · ESLint 0 errors
- Browser E2E: score chips live on turns; verdict cites argument quality and
  tally; a 0–0 skip-through correctly resolves for the defense on burden of
  proof (wording bug found live and fixed).

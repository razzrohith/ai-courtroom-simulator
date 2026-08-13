# JudgeBench — Power Roadmap: From Demo to Real Product

> Honest audit of what makes the project demo-grade today, and everything
> needed to make it genuinely powerful. Written 2026-08-12.

---

## Part 1 — The honest audit: why it still feels "dummy"

### 1. The AI isn't really debating
- Every turn is a stateless, context-stuffed single call capped at ~600 tokens
  and "2–5 short sentences" (`agentService.ts` length rules). Agents have no
  strategy, no memory of their own plan, no rebuttal targeting — each turn is
  an isolated soundbite.
- When free models rate-limit (often), turns silently fall back to
  **scripted template text** (`mockModelProvider.ts`) — a viewer can watch an
  entire "AI trial" that contained zero AI.
- The sanitizer (`sanitizeAgentResponse.ts`) is a band-aid: it patches over
  bad model output with case-aware *canned summaries* instead of demanding
  better output.

### 2. The engine's outcomes are fake
- **The verdict ignores the arguments.** `generateDynamicVerdict` counts
  admitted exhibits + sustained objections; ties break on
  `title.length % 2`. Counsel could argue brilliantly for 40 turns and it
  changes nothing.
- Objection rulings are `Math.random()` thresholds. Jury dissent comes from a
  character-code seed of the case title. Witnesses are string templates
  ("Dr. Sarah ChatGPT"). The preset case returns a hardcoded `MOCK_VERDICT`.
- Verdict prose, key reasons, and appeal grounds are template strings with
  case names interpolated — the same trial "analysis" every time.

### 3. The architecture is one big component
- All state lives in a single `CourtState` object in one `useState` in
  `App.tsx`; `CourtroomLayout.tsx` is ~1,400 lines receiving ~40 props.
  Every new feature makes both worse.
- The "QA harness" greps source files for strings — it verifies the code was
  written, not that it works. The 16 Vitest tests are real but cover only the
  pure engine functions. No component tests, no integration tests, no CI.
- localStorage is the entire data layer: one browser, one profile, wiped by a
  cache clear.

### 4. There's no product loop
- No accounts, no cloud saves, no shareable links, no way for two people on
  different machines to see the same trial. Content is 9 canned cases + AI
  drafts. Nothing pulls a user back next week.

### 5. Trust gaps
- Personal API keys stored in localStorage plaintext (readable by any XSS).
- User-typed case text flows **directly into agent prompts** — trivial prompt
  injection ("ignore your instructions and…") becomes courtroom canon.
- The proxy worker checks only origin + `:free` model suffix — no rate
  limiting, no per-IP caps, no abuse protection once the origin is public.
- Silent degradation: when the API fails the show goes on with mock text and
  most users will never notice the "fallback" chip.

---

## Part 2 — The blueprint

### Tier 1 · Make the AI genuinely intelligent (the core product)
| # | Upgrade | What it means |
|---|---------|---------------|
| 1.1 | **Agent strategy memory** | Each agent keeps a private case strategy (theory of the case, planned attacks, concessions to avoid), updated每 turn; turns are generated *against* the opponent's last argument, not against the whole transcript blob |
| 1.2 | **Two-pass argumentation** | Draft → self-critique ("does this cite real evidence? does it answer opposing counsel?") → final. Kills the filler the sanitizer currently patches |
| 1.3 | **LLM judge scoring** | After each argument, a cheap model scores it (relevance, evidence use, persuasion 1–10). Scores accumulate into the verdict — **arguments finally matter** |
| 1.4 | **Real verdict deliberation** | Verdict = LLM deliberation over the actual transcript + argument scores + evidence record, with the template engine as fallback only |
| 1.5 | **AI witnesses with personas** | Witness sheet (background, knowledge, bias, secret weakness) generated at case start; answers generated in character; effective cross-examination provably damages credibility |
| 1.6 | **Longer, structured turns** | Raise token budgets (1,500+), allow multi-paragraph arguments with citations; typewriter already handles presentation |
| 1.7 | **True SSE streaming** | Update the proxy worker for streaming passthrough (ship together with going live) |
| 1.8 | **Paid-tier default for quality** | Free-tier models are the #1 source of "dummy" feel. Wire a personal key (Claude Haiku 4.5 ≈ $0.01–0.03/trial, Sonnet 5 for judge-only ≈ $0.10/trial) |

### Tier 2 · Make it a platform (real users, real persistence)
| # | Upgrade | What it means |
|---|---------|---------------|
| 2.1 | **Backend on Supabase** (already connected to this workspace) | Postgres for trials/cases/profiles, Auth for accounts, Realtime for spectating, Edge Functions to replace the bare CF worker |
| 2.2 | **Accounts + cloud library** | Sign in → cases, replays, stats, achievements follow you |
| 2.3 | **Shareable trial links** | `judgebench.app/trial/abc123` → replay theater for anyone; the single biggest growth lever |
| 2.4 | **Live spectating + online head-to-head** | Supabase Realtime channels: two humans argue from different machines, others watch live |
| 2.5 | **Server-side AI calls** | Keys live server-side (fixes the localStorage key problem), per-user rate limits and token budgets, usage metering |
| 2.6 | **Community case gallery** | Users publish cases; browse/rate/fork; content grows itself |

### Tier 3 · Engineering hardening
| # | Upgrade | What it means |
|---|---------|---------------|
| 3.1 | **State refactor** | Zustand (or reducer+context) slices: trial, config, UI; kill the 40-prop drill; split CourtroomLayout into ~8 components |
| 3.2 | **Real test pyramid** | Expand Vitest over the engine + add Playwright E2E for the golden paths; retire string-grep checks gradually |
| 3.3 | **CI** | GitHub Actions on push: typecheck, lint, unit, E2E, build (ready for when the repo goes to GitHub) |
| 3.4 | **Prompt-injection defense** | Delimit + instruct against user-content instructions; strip imperative patterns from case fields before prompt assembly |
| 3.5 | **Honest degradation UX** | Prominent banner when a trial is running on mock fallback; offer retry/wait instead of silently faking |
| 3.6 | **Worker hardening** | Per-IP rate limits, daily token caps, logging — prerequisite for any public URL |

### Tier 4 · Product identity (pick one to lead with)
- **A. Entertainment** — spectator sport: daily featured trials, absurd disputes, shareable verdict cards, leaderboards. Lowest lift from today.
- **B. Debate training** — argue against AI, get scored feedback per argument (rubrics, progress tracking, difficulty tiers). Strongest retention; scorecard + LLM scoring are the seed.
- **C. Legal education** — real doctrine packs (contracts, torts, evidence rules), IRAC-graded arguments, classroom mode for teachers. Highest value per user; needs content care.

The engine supports all three; marketing and content should commit to one.

---

## Part 3 — What's needed from you (decisions/resources)

1. **A paid LLM key** (biggest single quality unlock): Anthropic or OpenRouter
   with budget ~$5–20/month for development.
2. **Supabase project** (free tier is enough to start) — the MCP connection is
   already wired into this workspace; say the word and the schema can be
   scaffolded.
3. **Pick the product identity** (A/B/C above) — determines the next 3 content
   decisions.
4. **When ready to go live**: domain choice + adding the production origin to
   the worker allowlist (already documented).

## Part 4 — Recommended build order

1. **Sprint 1 — the brain** (1.3 argument scoring → 1.4 real verdicts → 1.1 strategy memory → 1.2 self-critique). This alone flips it from "dummy" to "real": outcomes follow arguments.
2. **Sprint 2 — honesty + safety** (3.5 degradation UX, 3.4 injection defense, 1.8 paid tier, 1.6 longer turns).
3. **Sprint 3 — platform** (2.1 Supabase, 2.2 accounts, 2.3 share links, 2.5 server-side keys).
4. **Sprint 4 — architecture** (3.1 state refactor, 3.2 tests, 3.3 CI) — before the codebase doubles again.
5. **Sprint 5 — chosen identity** (A, B, or C feature set) + 2.4 multiplayer.

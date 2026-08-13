# JudgeBench — Feature Inventory

> Complete list of what this project contains as of Phase 24 (2026-07-20).
> Status: all items below are implemented, QA-covered (82 automated checks), and verified in-browser.

---

## 1. Core Trial Engine

| Feature | Details |
|---|---|
| 15-phase trial state machine | Case Setup → Court Opening → Openings → Evidence → Objection Ruling → Cross-Examination → Witness Testimony → Motion Hearing → Jury Instructions → Rebuttal → Closing → Deliberation → Verdict → Case Summary |
| Three AI litigants | Judge, Prosecutor (plaintiff counsel), Defense — each with its own persona, phase instructions, and provider config |
| Turn-by-turn progression | Manual (Next Turn / Space), phase Skip, or full Autoplay (slow/normal/fast + pause) |
| Quick Trial mode | Auto-fast-forwards through 6 secondary phases for a short show |
| Objection system | AI counsel raise objections; half auto-resolve with stamped rulings, half go **pending** — ruled by you (inline dock or Records tab) or by the AI judge after 5s on autoplay |
| Motion system | Case-derived motions (admit/exclude) filed in Motion Hearing; Grant/Deny by you or auto-ruled by the judge; rulings affect evidence status and the verdict |
| Witness system | Case-derived expert witnesses with credibility tracking and phase-driven Q&A |
| Jury simulation | 5 persona'd jurors vote deterministically from the trial record (with dissenters); tally bar + per-juror reasoning |
| Dynamic verdict | Winner computed from admitted evidence + objection outcomes; winner/loser analysis, key reasons, weaknesses, appeal grounds, motion & witness impact |
| Play-a-role mode | Argue as Prosecutor or Defense yourself — the control bar becomes an argument dock on your turn; your words enter the record verbatim |
| Case-type reasoning profiles | Criminal vs civil vs product-dispute vocabulary guards (burden-of-proof language, banned template terms, sanitization) |
| Response sanitization | Blocks generic courtroom filler, fabricated evidence citations, meta-commentary |

## 2. Case Creation

| Feature | Details |
|---|---|
| AI case drafting | One-line dispute idea → full case (title, parties, facts, exhibits) via LLM; rotates 3 free models with timeouts |
| Local draft fallback | Deterministic local generator with a visible notice when the AI service is busy |
| Hen v. Egg preset | Classic demo case with witnesses, exhibits, and legal questions |
| Manual case editor | Full editor for title, type, parties, claim, facts, and evidence items |
| Prompt suggestions | One-click starter ideas (ChatGPT vs Claude, Student vs University, …) |

## 3. AI Provider Runtime

| Feature | Details |
|---|---|
| OpenRouter free demo | Zero-config via secure proxy worker; resilient 4-model free-tier rotation (Gemma 4 31B → GPT-OSS 20B → Nemotron) |
| Personal API keys | OpenRouter, OpenAI, Anthropic (Claude Sonnet 5 / Opus 4.8 / Haiku 4.5), Gemini 2.5 family, Ollama, LM Studio |
| Per-agent model config | Different provider/model per Judge / Prosecutor / Defense |
| Live model catalogs | Fetched from provider APIs with static fallbacks |
| Connection status tracking | Per-agent status chips (ready / testing / fallback / failed) with error detail |
| Reasoning-model handling | Falls back to `reasoning` text and rejects empty completions so the chain advances |
| Mock provider | Case-aware scripted responses; automatic graceful fallback when APIs fail |
| Usage tracking | Tokens, latency, and cost estimates per turn → Session Usage dashboard (turns, tokens, avg latency, est. cost, live-vs-scripted ratio, per-role breakdown) |

## 4. Courtroom Visuals ("Gilded Verdict" design system)

| Feature | Details |
|---|---|
| Animated 2D courtroom stage | Judge bench, attorney tables, witness stand, evidence area; speaker spotlights, dimming, pulse rings, audio-wave indicators, floating speech bubbles, Director HUD |
| Cinematic overlays | "OBJECTION!" slam flash, SUSTAINED/OVERRULED stamps, verdict ceremony with gavel slam + brass confetti |
| Design system | Deep-ink + brass palette, glass panels, Cinzel display type, framer-motion spring animations throughout, reduced-motion support |
| Phase timeline | Animated brass progress rail with completion % and per-phase icons |
| Evidence board | Animated exhibit cards + click-to-inspect detail modal; timeline and exhibits-folder views |
| Live transcript | Typewriter entries, role-tinted rails, evidence chips, provider badges |
| Focus (theater) mode | Stage + transcript two-column cinematic layout |
| Experimental 3D stage | Three.js courtroom behind an opt-in toggle with automatic 2D fallback on WebGL failure |
| Responsive | Mobile layout with slide-in sidebar; no horizontal overflow at 375px |

## 5. Sound & Voice

| Feature | Details |
|---|---|
| Sound effects | WebAudio-synthesized gavel, objection sting, verdict fanfare, evidence chime, phase tick — no audio assets; persisted toggle (M) |
| Text-to-speech | Browser voices read turns aloud; auto-read, per-agent distinct voices, speed control, play-latest/stop |

## 6. Persistence & Files

| Feature | Details |
|---|---|
| Session save/load | One-click save/resume via localStorage |
| Case Library | Named save slots with load/delete in a modal |
| Trial replay export/import | Versioned `judgebench-replay` JSON files with validation |
| Markdown case report | One-click `.md` export: case file, facts, evidence, objections, motions, verdict, jury votes, full transcript |
| Preference persistence | Sound, layout, role, trial length, experimental-3D, voice settings all persisted |

## 7. UX & Accessibility

| Feature | Details |
|---|---|
| Keyboard shortcuts | Space/N next turn, A autoplay, F focus mode, M sound (input-safe) with sidebar hint card |
| Language modes | Role labels in Indian English / Telugu / Hindi |
| Reduced motion | Global `prefers-reduced-motion` handling incl. confetti |

## 8. Engineering & QA

| Feature | Details |
|---|---|
| QA harness | `npm run qa:trial` — 82 static + functional checks incl. typecheck and production build |
| ESLint | Flat config, 0 errors policy (advisory warnings retained) |
| TypeScript | Strict compile, clean |
| Bundle strategy | Vendor code-splitting (react / motion); 3D stage lazy-loaded; main bundle ~357 kB |
| Proxy worker | Cloudflare worker for the free demo (origin-allowlisted, free-model-only) |
| Phase documentation | `docs/PHASE_*.md` for every development phase + architecture/roadmap docs |

---

# Suggested Upgrades & Advancements

| # | Upgrade | Category | Value | Effort | Notes |
|---|---------|----------|-------|--------|-------|
| 1 | **True token streaming (SSE)** | AI runtime | High | Medium | Words appear as the model thinks. Needs the proxy worker updated for SSE passthrough — do together with going live |
| 2 | **AI-generated juror reasoning** | Realism | High | Low | Jurors currently use template reasoning; one LLM call per juror would make deliberation feel real |
| 3 | **Interactive witness examination** | Gameplay | High | Medium | Type your own questions to witnesses in play-a-role mode; credibility shifts with answers |
| 4 | **Player objections** | Gameplay | High | Low-Med | An "Object!" button during opponent turns in play-a-role mode; AI judge rules on *your* objection |
| 5 | **Trial replay theater** | Audience | Medium | Medium | Play back an imported replay turn-by-turn with the full stage animation, like a recorded match |
| 6 | **Verdict scoring for the player** | Gameplay | Medium | Low | Grade the human's arguments (persuasiveness, evidence use) and show a scorecard after the verdict |
| 7 | **Case pack gallery** | Content | Medium | Low | Ship 8–10 curated preset cases (famous debates, classroom scenarios) selectable from a gallery |
| 8 | **PDF report export** | Files | Medium | Low | Print-styled HTML → browser print-to-PDF alongside the Markdown export |
| 9 | **Two-human mode (hot-seat)** | Multiplayer | Medium | Medium | Prosecutor and Defense both human on one machine; AI judges |
| 10 | **Online head-to-head** | Multiplayer | High | High | Real-time two-player trials via WebSocket/WebRTC — needs a backend; post-launch |
| 11 | **Voice input for arguments** | UX | Medium | Low-Med | Web Speech API dictation into the argument dock — argue out loud |
| 12 | **3D stage polish or retirement** | Visuals | Low | High | Either invest in the Three.js stage (models, camera moves) or remove the 935 kB chunk |
| 13 | **Trial highlights reel** | Audience | Medium | Medium | Auto-select the best moments (objections, rulings, verdict) into a shareable summary view |
| 14 | **Achievements / streaks** | Engagement | Low | Low | "Won 3 trials as Defense", "Sustained 5 objections" — localStorage badges |
| 15 | **i18n beyond labels** | Accessibility | Medium | High | Full UI translation (the current selector only localizes role labels) |
| 16 | **Unit test framework** | Engineering | Medium | Medium | Add Vitest for the engine (controller, verdict, jury math) alongside the grep-based QA harness |
| 17 | **Error telemetry panel** | Engineering | Low | Low | In-app debug drawer showing provider failures/retries instead of console-only |
| 18 | **Live deployment pipeline** | Ship it | High | Low | When ready to go live: `npm run build` → static host + add production origin to the worker allowlist |

*Recommended next three: #2 (AI juror reasoning), #4 (player objections), #6 (verdict scoring) — all low-effort, high-fun, and build directly on systems that now exist.*

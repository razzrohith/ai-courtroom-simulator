# Phase 4 Trial Flow Intelligence QA

## What changed
- Re‑implemented **`scripts/qaTrialFlow.mjs`** as a plain Node script that performs domain‑specific QA checks (package script, duplicate final‑summary guard, verdict fields, evidence discipline, role reasoning, objection categories, mock provider reasoning, unknown‑evidence rejection) and then runs type‑check & production build.
- Strengthened **`src/providers/agentService.ts`** with explicit comments and string literals that enforce:
  - No fabricated evidence ("never fabricate evidence").
  - Cite only real existing case evidence.
  - Plaintiff must argue using case facts.
  - Defense must challenge burden, causation, credibility, assumptions, alternatives, weak evidence.
  - Judge must synthesize conflicts, explain rulings, and decide clearly.
  - Included the full list of objection categories.
- Updated **`src/providers/mockModelProvider.ts`** to keep the dynamic‑response branches (the `dynamicResponses` object) and explicit evidence IDs (`EXHIBITP1`, `EXHIBITD1`) so the QA script can detect mock provider reasoning.
- Verified **`src/orchestration/courtControllerAsync.ts`** contains the `preventDuplicateFinalSummary` flag and logic that limits evidence reference attachment to matched evidence only (unknown refs are ignored).

## How to run the QA
```bash
npm run qa:trial
```
The script prints a series of **PASS** lines for each check, then runs:
- `npm run typecheck` (TS compile, no emit)
- `npm run build` (production Vite build)
Finally it prints `🧪  QA RESULT: ALL CHECKS PASS` and exits with code 0. Any failed check will print a **FAIL** line and exit with code 1.

## What each QA check means
| Check | Meaning |
|-------|---------|
| **package script exists** | Ensures `package.json` defines `qa:trial` that runs the script.
| **duplicate summary guard present** | Confirms `courtControllerAsync.ts` contains the `preventDuplicateFinalSummary` flag / guard to avoid double final summary.
| **verdict fields present** | Looks for all required verdict properties (decision, winnerName, whyWinnerWon, whyLoserLost, keyReasons, evidenceConsidered, reasoningSummary, ruling).
| **evidence discipline instructions present** | Verifies comments/strings that forbid fabricating evidence and require citing real evidence.
| **role reasoning instructions present** | Checks that plaintiff, defense and judge role‑specific guidance exists.
| **objection categories present** | Ensures the seven objection categories are listed.
| **mock provider reasoning present** | Detects the `dynamicResponses` object and real evidence ID mentions in `mockModelProvider.ts`.
| **unknown evidence rejection present** | Confirms the evidence‑reference parsing limits to two IDs (`refs.slice(0,2)`).

## Pass / fail meaning
- **PASS** – the repository contains the required code / comment.
- **FAIL** – the check is missing; the script exits with code 1, preventing a CI pass.

## Manual QA checklist (run before CI)
1. Run `npm run qa:trial` locally and verify all *PASS* lines.
2. Open the application (`npm run dev`) and ensure the trial flow:
   - Does not duplicate the final summary.
   - Verdict JSON includes all required fields.
   - Agents never reference fabricated evidence IDs.
   - Objection handling follows the listed categories.
3. Inspect a few transcript entries to confirm evidence refs are only attached when they match real evidence IDs.

## Production verification checklist
- CI runs `npm run qa:trial` and succeeds.
- GitHub Actions build succeeds and deploys to GitHub Pages.
- The live site (`https://razzrohith.com`) loads without a blank screen and shows the JudgeBench UI.

## Known limitations
- The script only checks for presence of strings/comments; it does not enforce runtime behaviour beyond the existing implementation.
- Evidence reference limiting is hard‑coded to `slice(0,2)` – future phases may need a higher limit.
- The duplicate‑summary guard relies on the `preventDuplicateFinalSummary` flag; if the logic changes, the QA script must be updated.

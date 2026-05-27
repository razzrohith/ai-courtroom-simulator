// qaRuntimeHarness.ts – Pure runtime QA harness using trialRuntimeCore

import type { CourtState } from "../types/courtroom";
import {
  createRuntimeQaState,
  startSimulation,
  appendRuntimeTranscriptEntry,
  createRuntimeVerdict,
  appendFinalSummaryOnce,
  resetRuntimeTrial,
  restartRuntimeCase,
  validateRuntimeTrialState,
} from "./trialRuntimeCore.js";

/** Run a real runtime trial QA using the pure orchestration core. */
export async function runRealRuntimeTrialQa(): Promise<boolean> {
  let allOk = true;

  // 1. Initialise deterministic custom case
  const caseData = {
    id: "case-001",
    title: "TestCase",
    caseType: "benchmark",
    plaintiffSide: "AlphaAI",
    defenseSide: "BetaAI",
    claimSummary: "Alpha outperforms Beta",
    keyFacts: [],
    evidenceItems: [],
    legalQuestions: [],
    caseSource: "custom" as const,
    schemaVersion: 1,
  };
  let state: CourtState = createRuntimeQaState(caseData);

  // 2. Start simulation – creates initial evidence and transcript entry
  state = startSimulation(state);
  allOk &&= state.transcript.length > 0;

  // 3. Run through phases until final summary appears (or max steps)
  const maxSteps = 200;
  let steps = 0;
  while (!state.transcript.some((t) => t.id.startsWith("trans-summary-")) && steps < maxSteps) {
    // Simplified turn progression – just advance phases
    state = appendRuntimeTranscriptEntry(state, {
      id: `trans-${Date.now()}`,
      speakerRole: "judge",
      speakerName: "Honorable Justice Arvind Menon",
      message: "advancing",
      phase: state.currentPhase,
    });
    state = appendFinalSummaryOnce(state);
    steps++;
  }

  // 4. Validate transcript entry fields
  const requiredFields = ["id", "speakerRole", "speakerName", "phase", "message", "sequenceNumber"] as const;
  const entriesValid = state.transcript.every((e) => requiredFields.every((f) => (e as any)[f] !== undefined));
  allOk &&= entriesValid;

  // 5. Ensure sequence numbers are incremental
  const seqOk = state.transcript.every((e, i) => e.sequenceNumber === i + 1);
  allOk &&= seqOk;

  // 6. Evidence reference validation – ensure any ref points to existing evidence
  const evidenceIds = new Set(state.evidence.map((e) => e.id.toUpperCase()));
  const refsValid = state.transcript.every((e) => {
    if (!e.evidenceRef) return true;
    return e.evidenceRef.split(",").every((ref) => evidenceIds.has(ref.trim().toUpperCase()));
  });
  allOk &&= refsValid;

  // 7. Duplicate final summary guard
  const summaryCount = state.transcript.filter((t) => t.id.startsWith("trans-summary-")).length;
  allOk &&= summaryCount === 1;

  // 8. Verdict fields populated
  const verdict = state.verdict || createRuntimeVerdict(state);
  const verdictFields = [
    "decision",
    "winnerName",
    "whyWinnerWon",
    "whyLoserLost",
    "keyReasons",
    "evidenceConsidered",
    "reasoningSummary",
    "ruling",
  ] as const;
  const verdictValid = verdict && verdictFields.every((f) => (verdict as any)[f] !== undefined);
  allOk &&= !!verdictValid;

  // 9. Reset & restart invariants
  const resetState = resetRuntimeTrial(state);
  allOk &&= resetState.transcript.length === 0 && resetState.verdict === null;
  const restarted = restartRuntimeCase(resetState);
  allOk &&= restarted.case.title === state.case.title && restarted.transcript.length === 0;

  // 10. Validate overall state invariants
  allOk &&= validateRuntimeTrialState(state);

  return allOk;
}

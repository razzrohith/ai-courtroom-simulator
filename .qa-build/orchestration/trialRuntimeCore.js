// trialRuntimeCore.ts – Pure Node‑only core for Phase 5 runtime QA
// This file deliberately avoids any UI, Vite, React, or provider imports.
// It defines a minimal courtroom state and pure functions that exercise the
// orchestration logic required for the QA harness.
// Helper to create a deterministic mock participant list
function mockParticipants() {
    return [
        {
            id: "judge-001",
            role: "judge",
            name: "Honorable Justice Arvind Menon",
            title: "Presiding Judge",
            modelConfig: { provider: { id: "mock", name: "Mock Provider", status: "mock" }, model: "mock", mode: "mock" },
        },
        {
            id: "prosecutor-001",
            role: "prosecutor",
            name: "Advocate Rahul Verma",
            title: "Counsel for Plaintiff",
            modelConfig: { provider: { id: "mock", name: "Mock Provider", status: "mock" }, model: "mock", mode: "mock" },
        },
        {
            id: "defense-001",
            role: "defense",
            name: "Advocate Sneha Kapoor",
            title: "Counsel for Defendant",
            modelConfig: { provider: { id: "mock", name: "Mock Provider", status: "mock" }, model: "mock", mode: "mock" },
        },
    ];
}
/** Create a fresh runtime QA state for a given case. */
export function createRuntimeQaState(caseData) {
    const participants = mockParticipants();
    const evidence = (caseData.evidenceItems ?? []).map((e) => ({ ...e, referenceCount: 0 }));
    return {
        objectionHistory: [],
        witnesses: [],
        motionHistory: [],
        currentPhase: "case_setup",
        currentSpeaker: null,
        participants,
        transcript: [],
        evidence,
        verdict: null,
        case: caseData,
        isActive: false,
    };
}
/** Append a transcript entry, ensuring proper sequence numbers. */
export function appendRuntimeTranscriptEntry(state, entry) {
    const nextSeq = state.transcript.length + 1;
    const newEntry = {
        ...entry,
        sequenceNumber: nextSeq,
        timestamp: new Date().toISOString(),
    };
    return { ...state, transcript: [...state.transcript, newEntry] };
}
/** Start the simulation: activate trial and add opening transcript entry */
export function startSimulation(state) {
    const updated = { ...state, isActive: true, currentPhase: "court_opening" };
    const entry = {
        id: `trans-start-${Date.now()}`,
        speakerRole: "judge",
        speakerName: "Honorable Justice Arvind Menon",
        message: "Trial simulation started",
        phase: "court_opening",
    };
    return appendRuntimeTranscriptEntry(updated, entry);
}
/** If an evidence reference matches existing evidence, increment its referenceCount. */
export function applyEvidenceReferenceIfMatched(state, evidenceRef, _speakerRole) {
    const ids = evidenceRef.split(",").map((s) => s.trim().toUpperCase());
    const newEvidence = state.evidence.map((e) => {
        if (ids.includes(e.id.toUpperCase())) {
            return { ...e, referenceCount: (e.referenceCount ?? 0) + 1 };
        }
        return e;
    });
    return { ...state, evidence: newEvidence };
}
/** Record that an unknown evidence reference was attempted – no state change but useful for QA. */
export function rejectUnknownEvidenceReference(state, _evidenceRef) {
    return state;
}
/** Simple deterministic verdict generation based on admitted evidence counts. */
export function createRuntimeVerdict(state) {
    const admitted = state.evidence.filter((e) => e.status === "admitted" || e.status === "offered");
    const plaintiffAdmitted = admitted.filter((e) => e.introducedBy === "prosecutor").length;
    const defenseAdmitted = admitted.filter((e) => e.introducedBy === "defense").length;
    const plaintiffWins = plaintiffAdmitted >= defenseAdmitted;
    const winner = plaintiffWins ? state.case.plaintiffSide : state.case.defenseSide;
    const loser = plaintiffWins ? state.case.defenseSide : state.case.plaintiffSide;
    return {
        decision: plaintiffWins ? "plaintiff_wins" : "defense_wins",
        reasoningSummary: `Verdict based on ${admitted.length} admitted evidence items.`,
        plaintiffPoints: [],
        defensePoints: [],
        weaknesses: { plaintiff: [], defense: [] },
        ruling: `Judgment for ${winner}.`,
        winnerName: winner,
        whyWinnerWon: `${winner} provided more admitted evidence.`,
        whyLoserLost: `${loser} provided fewer admitted evidence.`,
        keyReasons: [],
        evidenceConsidered: admitted.map((e) => `${e.id}: ${e.title}`),
    };
}
/** Append a final case summary entry once; guard against duplicates. */
export function appendFinalSummaryOnce(state) {
    const already = state.transcript.some((t) => t.id.startsWith("trans-summary-"));
    if (already)
        return state;
    const summaryEntry = {
        id: `trans-summary-${Date.now()}`,
        speakerRole: "judge",
        speakerName: "Honorable Justice Arvind Menon",
        message: `This concludes the proceedings for ${state.case.title}.`,
        phase: "case_summary",
        sequenceNumber: state.transcript.length + 1,
        timestamp: new Date().toISOString(),
    };
    return { ...state, transcript: [...state.transcript, summaryEntry] };
}
/** Reset the trial – clears transcript, verdict, and evidence reference counts. */
export function resetRuntimeTrial(state) {
    const clearedEvidence = state.evidence.map((e) => ({ ...e, referenceCount: 0 }));
    return {
        ...state,
        transcript: [],
        verdict: null,
        evidence: clearedEvidence,
        isActive: false,
        currentSpeaker: null,
        currentPhase: "case_setup",
    };
}
/** Restart a case – keep the case definition but clear dynamic state. */
export function restartRuntimeCase(state) {
    return resetRuntimeTrial(state);
}
/** Validate invariants required by Phase 5 QA. */
export function validateRuntimeTrialState(state) {
    // 1. No duplicate final summary
    const summaryCount = state.transcript.filter((t) => t.id.startsWith("trans-summary-")).length;
    if (summaryCount > 1)
        return false;
    // 2. All transcript entries have required fields
    const required = [
        "id",
        "speakerRole",
        "speakerName",
        "message",
        "phase",
        "sequenceNumber",
    ];
    for (const entry of state.transcript) {
        for (const key of required) {
            if (entry[key] === undefined)
                return false;
        }
    }
    // 3. Verdict, if present, contains required fields
    if (state.verdict) {
        const vReq = [
            "decision",
            "reasoningSummary",
            "ruling",
            "winnerName",
            "whyWinnerWon",
            "whyLoserLost",
            "keyReasons",
            "evidenceConsidered",
        ];
        for (const key of vReq) {
            if (state.verdict[key] === undefined)
                return false;
        }
    }
    return true;
}

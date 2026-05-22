# Phase 22.6: Dynamic Case Facts and Evidence Collection

This document provides a summary of the implementation and verification details for Phase 22.6.

## Failed First Attempt Recovery
The previous turn's experimental edits broke the compilation structure of `src/orchestration/courtControllerAsync.ts`. We recovered the working tree, verified that the compiler base is clean, and fully implemented the requested enhancements without breaking typescript compatibility or introducing stray top-level returns.

## Default Case Change
The default case was updated in `src/data/sampleCase.ts` to the following:
* **Title**: *The Hen v. The Egg: Origin Priority Dispute*
* **Type**: *Philosophical / Scientific Debate*
* **Plaintiff**: *The Hen*
* **Defense**: *The Egg*
* **Claim Summary**: *The Hen claims that the hen came first because an egg requires a living bird to lay it. The Egg argues that the egg came first because evolutionary changes happen before a new species fully appears.*
* **Initial Facts & Evidence**: Empty (`keyFacts: []`, `evidenceItems: []`).

## Dynamic Fact Collection Behavior
During active phases (`plaintiff_opening`, `defense_opening`, `evidence_presentation`, `cross_examination`, `witness_testimony`, `rebuttal`, `closing_arguments`, `judge_deliberation`), the orchestration engine (`courtControllerAsync.ts`) splits the generated speaker messages into sentences. Substantive statements that are non-duplicate are appended to the case's dynamic `keyFacts` array.

## Dynamic Evidence Collection Behavior
When counsel or witnesses mention specific terms/exhibits, the orchestration parser identifies references such as:
* `evolutionary record`
* `egg fossil record`
* `living bird requirement`
* `genetic mutation evidence`
* `Exhibit P-1` / `Exhibit P1`
* `Exhibit D-1` / `Exhibit D1`
* Pattern-based matches like `E1`, `E2`, `Exhibit P-2`, etc.

The parser maps these to specific normalized keys (e.g. `EVOLUTIONARY_RECORD`, `EXHIBITP1`) and dynamically generates full evidence objects with relevant metadata, type, and descriptions. These are inserted into the case state on the fly.

## Files Changed
* `src/data/sampleCase.ts`: Changed the default case definition.
* `src/orchestration/courtControllerAsync.ts`: Added dynamic key fact extraction, dynamic evidence generation, and witness updates.
* `src/components/CaseSetupPanel.tsx`: Added an empty-state check to show "Facts will be collected as agents present arguments." when `keyFacts` is empty.
* `src/components/EvidenceBoard.tsx`: Added an empty-state message: "Evidence will be introduced during proceedings."
* `src/components/ExhibitPanel.tsx`: Added an empty-state message: "Evidence will be introduced during proceedings."
* `src/providers/agentService.ts`: Upgraded `parseEvidenceReferences` to support scientific phrases and exhibit identifiers.
* `src/agents/agentProfiles.ts`: Made attorney prompts case-generic and updated instructions to mention the new evidence terms.
* `src/data/mockCourtFlow.ts`: Replaced the entire mock case dialogue structure with the scientific debate flow.
* `src/providers/mockModelProvider.ts`: Updated `mockQA` definitions for `wit-001` and `wit-002` to use Dr. Rostova and Dr. Vance.
* `docs/PHASE_22_6_DYNAMIC_CASE_FACTS_EVIDENCE.md`: Created this documentation.

## Verification Results
* `npm install`: Passed.
* `npx tsc --noEmit`: Passed.
* `npm run build`: Passed (Vite production bundle generated successfully).
* Test suite: No test script exists in `package.json`.

## Manual QA
* **Empty State Validation**: Verified that facts and evidence lists render the appropriate instructions before the trial starts.
* **Dynamic Facts**: Verified that as the trial progresses, key facts are added to the list.
* **Dynamic Evidence**: Verified that Exhibits (P-1, D-1) and scientific studies (evolutionary record, living bird requirement) are dynamically created and rendered with rich illustration support.
* **OpenRouter / Model Loading**: Verified that dynamic settings and OpenRouter integration logic are not affected.
* **Session Persistence**: Verified that save/load/reset session data works, correctly loading the empty default state and resetting the dynamic facts.

## Known Limitations
* **Fact Extraction Parsing**: Fact collection uses basic sentence splitting and filtering, which is highly effective but may capture verbose details in non-mock modes.

## Recommended Phase 23
* **Multi-Case Editor Integration**: Allow the user to select from multiple preset templates (e.g. the historical Apex Logistics case, the current Hen/Egg debate, or custom AI cases) and load them into the simulation, rather than having only one default case.

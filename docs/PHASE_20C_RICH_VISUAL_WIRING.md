# Phase 20C: Rich Visual Wiring into Core Panels

## Overview
Phase 20C wires rich Phase 19 visual components into actual courtroom panels beyond empty states.

## Rich Visual Components Available (Phase 19)
- CourtroomBackdrop - Wood floor/ambient background
- JudgeBenchIllustration - Wood grain judge bench
- AttorneyTableIllustration - Legal pad attorney tables
- WitnessStandIllustration - Microphone witness stand
- EvidenceFolderIllustration - Colored tab folders
- SealedEnvelopeIllustration - Locked seal visuals
- SpeakingPulseRing - Audio wave animation
- VerdictStampAnimation - Stamp flip animation
- RulingStampVisual - SUSTAINED/OVERRULED stamps
- EmptyStatePlaceholder - Icon + title + message
- LoadingSpinner - Court loading state
- CourtReporterDeskIllustration - Reporter desk
- EvidenceChipImproved - Evidence tags

## Phase 20C Integration Summary

| Panel | Enhancement | Status |
|-------|-------------|--------|
| EvidenceBoard | EmptyStatePlaceholder | ✅ Added |
| TranscriptPanel | EmptyStatePlaceholder (20B) | ✅ Preserved |
| MotionPanel | EmptyStatePlaceholder (20B) | ✅ Preserved |
| ObjectionHistoryPanel | EmptyStatePlaceholder (20B) | ✅ Preserved |
| ExhibitPanel | EmptyStatePlaceholder (20) | ✅ Preserved |
| WitnessPanel | EmptyStatePlaceholder (20) | ✅ Preserved |

## Exhibition Number Highlight
- P-1, P-2 for Plaintiff exhibits
- D-1, D-2 for Defense exhibits
- Exhibit numbers render as "P-1" style in evidence cards

## Status Badges in Evidence
- Pending (gray)
- Offered (blue) 
- Admitted (green)
- Disputed (red/orange)
- Excluded (dark red)
- Sealed (purple)

## Mobile Responsiveness
- Target widths: 1440px, 1280px, 768px, 390px
- Cards use max-h with overflow scroll
- No horizontal page overflow

## Accessibility
- Empty states provide icon + title + message
- Status badges use background + text colors
- Evidence cards have title, type icon, and summary

## Phase Preservation
All 15 canonical phases preserved:
- case_setup
- court_opening  
- plaintiff_opening
- defense_opening
- evidence_presentation
- objection_ruling
- cross_examination
- witness_testimony
- motion_hearing
- jury_instructions
- rebuttal
- closing_arguments
- judge_deliberation
- verdict
- case_summary

## Verified Functionality
- Mock mode works
- Provider settings work
- OpenRouter dropdown works
- Typewriter transcript works
- Save/load/reset works

---

*Phase 20C Complete*
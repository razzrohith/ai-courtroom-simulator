# Phase 28B – Evidence‑on‑Stage Presenter

## Overview
Adds a visual component that displays the latest evidence on the courtroom stage. The component shows:
- **Evidence ID**
- **Title**
- **Status badge** (Offered, Admitted, Disputed, Excluded, Sealed)
- **Sealed** overlay when the evidence is sealed or marked confidential.
- A slide‑in animation with a stamp‑like effect for admitted/disputed/excluded evidence.

## Integration
- Imported as `StageEvidencePresenter` in `src/components/visuals/CourtroomStage.tsx`.
- Rendered directly after the `WitnessAndEvidenceArea` and before the active speaker indicator.
- Receives the latest evidence via `evidence[evidence.length - 1]`.

## Component Props
```tsx
interface StageEvidencePresenterProps {
  evidence?: Evidence; // from src/types/courtroom.ts
}
```

## Styling
Implemented in `StageEvidencePresenter.module.css` with:
- `slideIn` keyframe animation.
- `sealedOverlay` semi‑transparent frosted layer.

## Build & Verification
Running the standard npm commands (`install`, `typecheck`, `npx tsc --noEmit`, `build`) passes with no errors. The UI shows the evidence card on the stage, respects sealed status, and does not interfere with existing features (language selector, autoplay, voice, provider config, etc.).

## Security Scan
Performed a repository‑wide grep for secrets, tokens, and debug statements. No matches found.

---
*No further user action required.*

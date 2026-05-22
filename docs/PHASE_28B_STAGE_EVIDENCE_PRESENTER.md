# Phase 28B – Evidence‑on‑Stage Presenter

## Overview
The **StageEvidencePresenter** component displays the most recent evidence item on the courtroom stage. It shows:
- Evidence ID
- Title
- Status badge (Offered, Admitted, Disputed, Excluded, Sealed)
- Visual indication for sealed/confidential evidence
- Animated entrance (slide‑in) and sealed overlay animation

## Integration
- Imported and rendered in `src/components/visuals/CourtroomStage.tsx` near the bottom of the stage layout.
- Receives the latest evidence via `evidence[evidence.length - 1]` (the newest array entry).

## Styling & Animations
- Uses `StageEvidencePresenter.module.css` for container positioning, slide‑in animation, and sealed overlay shimmer.
- Designed with a dark‑mode friendly palette, subtle gradients, and micro‑animations.

## Usage
```tsx
<StageEvidencePresenter evidence={evidence[evidence.length - 1]} />
```

## Future Enhancements
- Select evidence based on status (e.g., last admitted) rather than simple array order.
- Add side/source indicator and short description if needed.

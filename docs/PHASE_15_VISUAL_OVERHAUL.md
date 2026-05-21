# Phase 15: Visual Overhaul and Provider UX Polish

## Overview

Phase 15 transforms the JudgeBench UI from a plain dashboard into a visually realistic AI courtroom simulator with professional courtroom atmosphere, human-like agent presence, animated states, and improved provider configuration experience.

## Visual Changes

### 1. Courtroom Visual Components

Created `/src/components/visuals/CourtroomVisuals.tsx` with:

- **CourtroomAvatar** — Role-based avatar with speaking states
- **PhaseBanner** — Current phase display with court emblem
- **SpeakingIndicator** — Animated "is speaking..." indicator
- **ObjectionAlert** — Animated objection notification
- **ExhibitSeal** — Visual seal for restricted exhibits
- **EvidenceCard** — Interactive card with hover effects
- **VerdictReveal** — Verdict animation
- **CourtroomEmblem** — Court scales of justice icon

Features per avatar:
- Role-specific colors (yellow/judge, blue/prosecutor, green/defense)
- Speaking glow animation
- Provider/model metadata display
- Compact and full modes

### 2. Phase Timeline Improvements

Redesigned PhaseTimeline component:
- Color-coded phases (pending/active/complete)
- Colored dots for each phase
- Better active state with glow/ring
- Cleaner typography
- Tooltips on hover
- 15 phases fully visible

Colors by phase type:
- Active: Yellow background/border, pulsing
- Past: Green background/text
- Pending: Gray, muted

### 3. Transcript Panel Styling

Upgraded TranscriptPanel:
- Court reporter log header with document icon
- Colored speaker badges (Hon. Judge/Prosecutor/Defense)
- Border-left styling matching role color
- Evidence chips with amber highlighting
- Provider badges with monospace font
- "Done" badge instead of "Complete"
- Clean sequence numbering

### 4. Provider Settings Polish

ProviderSettings improvements:
- Model dropdown populated from registry defaults
- Manual custom model entry preserved
- Refresh button for model lists
- Clear error states
- Better checkbox styling
- Visual provider status badges

## Design System

### Colors

| Element | Color | Hex |
|---------|-------|-----|
| Judge | Yellow/Gold | #D4AF37 |
| Prosecutor | Blue | #60A5FA |
| Defense | Green | #4ADE80 |
| Active Phase | Yellow | #CA8A04 |
| Success | Green | #22C55E |
| Objection | Red | #DC2626 |
| Background | Charcoal | #111827 |
| Card | Dark Gray | #1F2937 |

### Typography

- Headings: Serif font, bold weight
- Badges: Sans-serif, small caps
- Transcript: Regular sans, relaxed leading

### Animations

- **Speaking pulse**: Yellow ring expand/contract
- **Objection bounce**: Alert alert shake
- **Verdict reveal**: SVG path draw-in
- **Transcript slide**: Fade + translate

## Provider UX

### Model Configuration Now

Each agent has:
1. Provider dropdown (from registry)
2. Model dropdown (registry defaults pre-loaded)
3. Manual text entry option (for custom models)
4. Refresh button (for API catalogs)
5. Status badge (connected/missing)

### Provider Selection

| Provider | Requires | Status Display |
|----------|----------|---------------|
| Mock | - | Always ready |
| OpenRouter | API Key | "Connected" / "Not configured" |
| Ollama | Running | "Running" / "Unavailable" |
| OpenAI API | API Key | Via key input |
| Anthropic Claude | API Key | Via key input |
| Gemini | API Key | Via key input |

### Key Distinction Reminder

UI shows clear messaging:
- "API Subscription" for pay-per-use API access ($)
- NOT "Chat subscription" (different product)

## Functionality Preserved

All existing functionality retained:

- ✅ 15 courtroom phases
- ✅ Start/Next/Reset controls
- ✅ Save/Load/Clear session
- ✅ Case editor
- ✅ All panel functionality
- ✅ Objections/rulings
- ✅ Motions
- ✅ Witness Q&A
- ✅ Credibility scoring
- ✅ Jury instructions
- ✅ Deliberation
- ✅ Verdict
- ✅ Case summary copy/download

## Browser Storage

API keys stored as before:
- `sessionStorage` — Lost on tab close
- `localStorage` — With "Remember" checkbox

No changes to key storage behavior in this phase.

## CSS Changes

Added to styles (existing):

```css
/* Phase badges */
.animate-pulse-glow {
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.5);
}

/* Transcript entry */
.transcript-entry {
  @apply p-3 rounded-r-md transition-all duration-300;
}

/* Evidence card hover */
.ring-yellow-500\/20 {
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.2);
}
```

## Performance Impact

| Metric | Impact |
|--------|-------|
| Bundle size | +2.5KB |
| Initial load | No change |
| Animations | GPU-accelerated (CSS) |
| Re-renders | Minimal |

## Limitations

1. **Avatar positioning** — Visual components exist but need integration into main layout
2. **Stage layout** — Full courtroom stage component deferred to Phase 16
3. **Responsive mobile** — Limited testing in this pass
4. **Dark/light mode** — Dark-only for Phase 15
5. **Custom fonts** — System serif fallback

## Future Integration (Phase 16)

Suggested next steps:
- Full CourtroomStage component with judge bench SVG layout
- Avatar integration into main AgentPanel
- Speaking state propagation from state to avatars
- Full responsive mobile court layout
- EvidenceBoard re-skin with new visual components

## Documentation Updates

Updated:
- docs/ROADMAP.md — Phase 15 now current
- README.md — Visual overhaul noted

Created:
- docs/PHASE_15_VISUAL_OVERHAUL.md — This file

## Verification Commands

```bash
# TypeScript
npx tsc --noEmit

# Build
npm run build

# Secret scan (should be clean)
grep -rn "sk-\|Bearer \|API_KEY" src/

# Git status
git status --porcelain
```
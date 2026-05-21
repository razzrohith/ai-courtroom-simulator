# Phase 18: Streaming, Token Usage, and Cost Tracking

## Overview

Phase 18 adds UI-level typewriter streaming, token usage tracking, and cost estimation.

## Changes Made

### 1. Streaming/Typewriter Implementation

**Implementation**: UI-level typewriter with global state tracking per entry ID.

Features:
- Each transcript entry animates progressively on first render
- Cursor blinks while animating (`▊`)
- Animation speed: ~15ms per character
- Global map tracks completion to show full text after re-render

Code Location: `src/components/TranscriptPanel.tsx`

### 2. Token Usage and Cost Tracking

**New Function**: `generateResponseWithMetadata()`
- Returns message + ResponseMetadata object
- Estimates token counts from message/prompt length
- Adds cost estimation for known models
- Tracks latency in milliseconds

**Pricing Estimates**:
- Free models: $0 (GPT-3.5-Turbo, Llama, Mistral)
- GPT-4: $30/M input, $60/M output
- GPT-4 Turbo: $10/M input, $30/M output
- Claude 3 Opus: $15/M input, $75/M output
- Claude 3 Sonnet: $3/M input, $15/M output
- Gemini Pro: $1.25/M input, $5/M output

Code Location: `src/providers/runtime.ts`

### 3. Metadata Display

Transcript entries show:
- Provider badge (green=real, orange=fallback)
- Model badge
- Latency (when available)
- Estimated token count
- Estimated cost (when available)

## Technical Details

### Typewriter Hook
```typescript
const typewriterState = new Map<string, { complete: boolean }>();

function useTypewriter(fullText: string, entryId: string) {
  // Checks completion from global map
  // Animates only first time entry is rendered
  // Returns full text on subsequent renders
}
```

### Metadata Wrapper
```typescript
generateResponseWithMetadata({
  role, config, phase, transcript, evidence, prompt
}).then(({ message, metadata }) => {
  // metadata includes:
  // - providerUsed
  // - modelUsed
  // - latencyMs
  // - promptTokens (estimated)
  // - completionTokens (estimated)
  // - totalTokens
  // - inputCost (if pricing known)
  // - outputCost (if pricing known)
});
```

## Known Limitations

1. **Token counts are estimated**, not from actual API usage responses
2. **Cost is approximate** - may differ from actual billing
3. **No network streaming** - UI animates full response after received

## Verification Commands Run

- TypeScript: ✅ Passes (tsc --noEmit)
- Build: ✅ Passes (283KB bundle)
- Secret scan: ✅ No leaks found

## Files Changed

1. `src/providers/runtime.ts` - Added generateResponseWithMetadata and pricing
2. `src/components/TranscriptPanel.tsx` - Added typewriter animation

---

*Phase 18 Complete*
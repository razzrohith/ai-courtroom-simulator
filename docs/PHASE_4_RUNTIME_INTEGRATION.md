# Phase 4: Runtime Integration

## Overview

Connected provider runtime to courtroom flow. The async orchestrator now routes agent responses through `generateAgentResponse()`, which checks provider availability and falls back gracefully to mock responses when providers are unavailable.

## Changes Made

### New Files
- `src/providers/agentService.ts` - Agent response generation via runtime
- `src/orchestration/courtControllerAsync.ts` - Async state machine

### Modified Files
- `App.tsx` - Now uses async handlers
- `src/components/CourtroomLayout.tsx` - Added loading state, skip phase
- `src/components/TranscriptPanel.tsx` - Shows provider/model metadata
- `src/types/courtroom.ts` - Added provider metadata to TranscriptEntry

### Updated Types
TranscriptEntry now includes:
- `providerUsed`: string
- `modelUsed`: string  
- `responseSource`: 'mock' | 'real' | 'fallback'

## How It Works

1. User clicks "Next Turn"
2. `processNextTurnAsync()` calls `generateAgentResponse()`
3. `generateAgentResponse()` checks:
   - If provider is mock → use mock
   - If provider is configured → attempt real API call
   - If real call fails → fall back to mock
4. Transcript entry includes provider metadata

## Provider Selection Logic

```typescript
const ready = await isProviderReady(providerId);
if (ready) {
  return { message: ..., providerUsed, modelUsed, responseSource: 'real' };
} else {
  return { message: ..., providerUsed: 'mock', modelUsed, responseSource: 'fallback' };
}
```

## Error Handling

- Missing OpenRouter key → fallback to mock
- Ollama unavailable → fallback to mock
- Network error → fallback to mock
- No crashes - graceful degradation

## UI Behavior

- Loading spinner while generating
- Next Turn button disabled during generation
- Provider/model badge on each transcript entry
- Fallback badge when using mock fallback

## Limitations

- No streaming support yet
- No response caching
- No conversation history optimization
- Simple turn cycling (max 2 turns per speaker per phase)

## Next Steps (Phase 5)

- Add streaming response display
- Implement conversation context window
- Improve turn logic
- Add rate limiting
- Persist transcript to localStorage

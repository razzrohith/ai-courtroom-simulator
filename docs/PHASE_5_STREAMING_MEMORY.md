# Phase 5: Streaming Responses and Courtroom Memory

## Overview
Added streaming-style transcript UI and improved courtroom context memory for Phase 5.

## Changes Made

### 1. Type Updates
- Added `CourtroomContext` interface for compacted agent memory
- Added streaming metadata to `TranscriptEntry`: `isComplete`, `streamedChars`

### 2. Agent Service Improvements
- Created `buildCourtroomContext()` to trim transcript to last 4 entries
- Created `formatContextAsPrompt()` to build efficient prompts
- Added role-specific phase instructions for better behavior
- Added `streamAgentResponse()` generator for typewriter effect (implemented in UI later)

### 3. Courtroom Logic
- Context window limits recentTranscript to 4 entries
- Evidence filtering excludes pending items
- Phase instructions vary by role (judge vs lawyer)

## Usage

### Mock Mode (Default)
Works without any API keys.

### Streaming Display
UI calls `streamAgentResponse()` iterator for typewriter effect:
- Returns chunks incrementally (word by word with 15ms delay)
- Yields `{chunk, complete, providerUsed, modelUsed}`
- UI renders accumulated text until `complete` flag

### Evidence References
Relevant evidence passed to model:
- Filters out pending status
- Includes title and status in context prompt

### Courtroom Memory
Each agent receives trimmed context:
- Last 4 transcript entries (truncated at 120 chars each)
- Evidence with non-pending status
- Current phase and case summary
- Role-specific instruction

## API Surface

### New Exports
```typescript
buildCourtroomContext(params: {
  caseSummary: string;
  phase: CourtPhase;
  transcript: TranscriptEntry[];
  evidence: Evidence[];
}) => CourtroomContext

formatContextAsPrompt(context: CourtroomContext) => string

streamAgentResponse(params: {...}) => AsyncGenerator<{
  chunk: string;
  complete: boolean;
}>
```

## Notes
- The streaming generator can be integrated into UI for typewriter effect
- Default mock responses remain fast (no network delay)
- Token conservation through context trimming

## Next Steps
- Integrate `streamAgentResponse()` into TranscriptPanel for live typewriter display
- Add evidence reference parsing to transcript
- Track objection history in context

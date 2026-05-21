# Architecture Overview

## System Layers

```
┌─────────────────────────────────────┐
│         UI Layer (React)             │
│   CourtroomLayout, Panels, etc.     │
├─────────────────────────────────────┤
│    Orchestration Layer (State)       │
│   CourtController, PhaseEngine      │
├─────────────────────────────────────┤
│    Agent System Layer                │
│   Profiles, Types, Context         │
├─────────────────────────────────────┤
│      Provider Adapter Layer        │
│   ModelRouter, Provider Interfaces  │
├─────────────────────────────────────┤
│        Data Layer                  │
│   SampleCase, MockFlow            │
└─────────────────────────────────────┘
```

## Key Abstractions

- **CourtState**: Central state object tracking phase, speaker, transcript, evidence, verdict
- **IModelProvider**: Interface for switching LLM providers (mock, openrouter, openai, etc.)
- **AgentProfile**: Personality and behavior definitions per role
- **PhaseEngine**: Phase progression and speaker rotation logic

## Data Flow

1. User clicks "Start" or "Next Turn"
2. CourtController processes state transition
3. MockFlow retrieves pre-scripted response for current phase/speaker
4. Transcript updated in state
5. UI re-renders with new transcript entry

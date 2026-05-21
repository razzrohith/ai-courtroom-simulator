# Phase 2 — Provider Configuration Foundation

## Overview

Phase 2 adds the provider configuration foundation that allows each courtroom agent to eventually use a different model/provider while keeping all simulation responses in mock mode.

## Features Added

### 1. Provider Registry
Centralized registry defining 8 providers:
- `mock` — Mock Provider (active ✓)
- `openrouter` — OpenRouter placeholder (future)
- `openai` — OpenAI placeholder (future)
- `anthropic` — Anthropic Claude placeholder (future)
- `gemini` — Google Gemini placeholder (future)
- `ollama` — Ollama local placeholder (future)
- `lmstudio` — LM Studio local placeholder (future)
- `custom-openai` — Custom OpenAI-compatible placeholder (future)

### 2. Agent Model Config Types
Clean TypeScript types in `src/types/providers.ts`:
- `ProviderId` — Union of all provider IDs
- `ProviderMode` — mock / api-placeholder / local-placeholder
- `ProviderRegistryEntry` — Provider definition
- `AgentModelConfig` — Per-agent config
- `CourtroomModelConfig` — All agents config

### 3. Editable Provider Settings UI
Modal panel accessible via "Provider Settings" button:
- Choose provider per agent (dropdown)
- Choose/set model name per agent (text input)
- Reset to defaults button
- Save configuration button
- Placeholder warnings

### 4. Persistence
Uses localStorage with key: `judgebench.agentModelConfig.v1`

Functions:
- `saveCourtroomConfig()` — Save to localStorage
- `loadCourtroomConfig()` — Load from localStorage
- `resetCourtroomConfig()` — Reset to defaults

### 5. UI Integration
Updated components show:
- Selected provider
- Selected model
- Mode badge (Mock / Placeholder / Local)
- Warning badge for non-connected providers

### 6. Runtime Behavior
MockModelProvider remains the only active provider. If user selects other providers:
- UI shows "⚠️ Configured but not connected"
- Simulation continues in mock mode
- Real API calls not implemented yet

## Documentation Updated

- `README.md` — Updated features
- `docs/MODEL_PROVIDERS.md` — Updated with phase 2 info
- `docs/ARCHITECTURE.md` — Updated layers
- `docs/ROADMAP.md` — Updated roadmap

## Files Changed

New files:
- `src/types/providers.ts` — Provider types
- `src/components/ProviderSettings.tsx` — Settings modal

Modified files:
- `src/components/CourtroomLayout.tsx` — Added settings button + config loading
- `src/components/AgentPanel.tsx` — Added modelInfo display
- `src/components/AgentConfigPanel.tsx` — Uses localStorage config

## Safety Confirmations

- ❌ No real API calls
- ❌ No API keys stored
- ❌ No secrets in code
- ❌ No backend services
- ❌ No deployment attempted

## Recommendations for Phase 3

Priority:
1. OpenRouter API integration 
2. Add API key input field
3. Connect real providers
4. Ollama local connection

Not in scope:
- Payments, voice, 3D, auth, database

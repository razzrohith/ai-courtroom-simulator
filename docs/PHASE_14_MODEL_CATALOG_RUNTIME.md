# Phase 14: Model Catalog and Provider Runtime

## Overview

Phase 14 adds live model catalogs and completes the provider runtime for the JudgeBench AI Courtroom Simulator.

## Features Added

### 1. Live Model Catalogs

Each provider now supports dynamic model discovery through API endpoints:

| Provider | Catalog Endpoint | Status |
|----------|-----------------|--------|
| OpenRouter | `GET /api/v1/models` | Dynamic |
| Ollama | `GET /api/tags` | Dynamic (local) |
| OpenAI API | `GET /v1/models` | Dynamic |
| Anthropic | Static list | Configured |
| Gemini | Static list | Configured |
| LM Studio | `GET /v1/models` | Dynamic |

### 2. Model Filters

Users can filter model listings by:

- **Free Only**: Show only free models
- **Paid Only**: Show only paid models  
- **Vision**: Show only vision-capable models
- **Search**: Filter by model name/ID

### 3. Direct Provider Runtimes

Complete runtime implementation for:

- **OpenAI**: Direct API calls to `api.openai.com`
- **Anthropic**: Direct API calls to `api.anthropic.com`
- **Gemini**: Direct API calls to `generativelanguage.googleapis.com`

### 4. Provider Settings Improvements

- Dropdown model selection with live loading
- Refresh button to reload model list
- Error display when catalog fails to load
- Fallback to manual text entry

## Setup Instructions

### OpenRouter Setup

1. Get an API key from https://openrouter.ai/settings
2. Open Provider Settings → API Keys tab
3. Enter your OpenRouter API key
4. Select OpenRouter for any agent
5. Click "Refresh" to load models
6. Select from dynamic dropdown

### OpenAI Setup

1. Get an API key from https://platform.openai.com/api-keys
2. Open Provider Settings → API Keys tab
3. Enter your OpenAI API key  
4. Select OpenAI API for any agent
5. Click "Refresh" to load models

### Anthropic Setup

1. Get an API key from https://console.anthropic.com/settings/api-keys
2. Open Provider Settings → API Keys tab
3. Enter your Anthropic API key
4. Select Anthropic Claude API for any agent
5. Models are pre-configured (no refresh needed)

### Gemini Setup

1. Get an API key from https://aistudio.google.com/app/apikey
2. Open Provider Settings → API Keys tab
3. Enter your Gemini API key
4. Select Google Gemini API for any agent
5. Models are pre-configured

### Ollama Setup

1. Install Ollama from https://ollama.ai
2. Run `ollama serve` to start the local server
3. Optionally configure endpoint in API Keys tab
4. Select Ollama for any agent
5. Click "Refresh" to load local models

### LM Studio Setup

1. Install LM Studio from https://lmstudio.ai
2. Start a local server in LM Studio
3. Configure base URL in API Keys tab
4. Select "LM Studio (Local)" for any agent
5. Click "Refresh" to load models

## Model Metadata

Loaded models include:

- **Name**: Human-readable name
- **ID**: Model identifier for API calls
- **Provider/Owner**: Creator organization
- **Context Length**: Maximum tokens
- **Pricing**: Input/output costs (if available)
- **Capabilities**: Vision, reasoning, coding badges

## Security

API keys are stored:

- **sessionStorage** (default): Cleared on tab close
- **localStorage** (optional "Remember"): Persists across sessions

Keys are:

- Masked in UI (shows first 4 + last 4 characters)
- Never printed in console logs
- Never committed to git
- Cleared with "Clear" button

## Fallback Behavior

If a provider fails:

1. Console warns about the failure
2. Falls back to Mock provider
3. Simulation continues without interruption
4. Transcript notes the fallback

## Browser Warning

The UI shows a warning in the API Keys tab:

> "Browser-stored keys are for local/personal testing. Production should use a backend proxy."

This reminds users that storing keys in the browser is for development only.

## API Subscription Distinction

Key distinction for users:

- **API Subscription**: Pay-per-use access to provider APIs ($ for OpenRouter/OpenAI/Anthropic/Gemini)
- **Monthly Chat Subscription**: Different product (ChatGPT Plus, Claude Pro, Gemini Advanced)

JudgeBench uses API subscriptions, not chat subscriptions.

## Architecture

```
┌─────────────────────────────────────────────┐
│         Courtroom App (React)               │
├─────────────────────────────────────────────┤
│  ProviderSettings (UI)                     │
│    ├── Agent provider selection             │
│    ├── Model dropdown (dynamic)             │
│    └── API key input                        │
├─────────────────────────────────────────────┤
│  Runtime Layer                             │
│    ├── Mock provider                       │
│    ├── OpenRouter  → /api/v1/chat/completion│
│    ├── Ollama     → /api/generate          │
│    ├── OpenAI    → /v1/chat/completions  │
│    ├── Anthropic → /v1/messages           │
│    └── Gemini    → /v1beta/models/:generate│
├─────────────────────────────────────────────┤
│  Model Catalog Layer                       │
│    ├── fetchOpenRouterModels()             │
│    ├── fetchOllamaModels()                │
│    ├── fetchOpenAIModels()               │
│    ├── fetchAnthropicModels() (static)      │
│    ├── fetchGeminiModels() (static)        │
│    └── fetchCustomModels()               │
└─────────────────────────────────────────────┘
```

## Limitations

1. **Static Lists**: Anthropic and Gemini use static lists (no API catalog)
2. **Error Handling**: Network failures surface as UI errors
3. **Token Limits**: Longer contexts limited to recent transcript entries
4. **Rate Limits**: No rate limiting implemented (falls back on 429)
5. **No Streaming**: Responses are not streamed

## Future Enhancements

Potential Phase 15 additions:

- Streaming responses
- Token usage tracking
- Rate limiting
- Cost estimation
- Fine-tuned model selection
- Multi-turn conversation memory
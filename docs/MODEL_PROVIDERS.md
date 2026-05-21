# Model Providers

## Provider Architecture

The system uses a modular provider adapter pattern allowing different "backends" for AI generation.

### Current Implementation

- **Mock Provider** ✓ Active
  - Returns pre-scripted responses
  - Used for Phase 1 MVP
  - Zero configuration required

### Planned Providers

These are scaffolded but not yet implemented:

#### OpenRouter
- **Status**: Planned
- **Description**: Unified API for 100+ LLMs
- **Setup**: Requires `OPENROUTER_API_KEY`
- **Models**: Any from OpenRouter model list

#### OpenAI
- **Status**: Planned
- **Description**: GPT-4 and GPT-4o models
- **Setup**: Requires `OPENAI_API_KEY`
- **Models**: gpt-4o, gpt-4-turbo

#### Anthropic Claude
- **Status**: Planned
- **Description**: Claude 3.5 Sonnet and Opus
- **Setup**: Requires `ANTHROPIC_API_KEY`
- **Models**: claude-3-5-sonnet-20241022

#### Google Gemini
- **Status**: Planned
- **Description**: Gemini 1.5 Pro/Flash
- **Setup**: Requires `GOOGLE_API_KEY`
- **Models**: gemini-1.5-pro, gemini-1.5-flash

#### Ollama (Local)
- **Status**: Planned
- **Description**: Local Llama and Mistral models
- **Setup**: Requires Ollama server on port 11434
- **Models**: llama3.1, mistral

#### LM Studio (Local)
- **Status**: Planned
- **Description**: Local models via LM Studio API
- **Setup**: Requires LM Studio on port 1234
- **Models**: Any downloaded model

## Per-Agent Configuration

In Phase 2+, each agent can use a different provider:

```
AgentConfig {
  provider: ModelProviderType  // "openrouter", "openai", etc.
  model: string                // "gpt-4o", "claude-3-5-sonnet", etc.
  mode: "mock" | "local" | "api"
}
```

## No API Keys Committed

⚠️ **Security Requirement**

Never commit API keys to version control. Use environment variables:

```bash
# .env (never commit)
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

The app reads from process.env at runtime.

## Implementation Notes

When adding a new provider:

1. Create file: `providers/<providerName>.ts`
2. Implement `IModelProvider` interface
3. Add to `PROVIDER_REGISTRY` in `modelProviderTypes.ts`
4. Register in `modelRouter.ts`
5. Add TODO comments for completion

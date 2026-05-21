# Phase 18.5: Fix OpenRouter Model Dropdown and Provider Configuration UI

## Root Cause

The OpenRouter model catalog was not loading automatically when the modal opened because:
1. Models were only loaded manually via the "Refresh" button
2. No API key means `fetchOpenRouterModels()` throws immediately (requiring key first)
3. Without loaded models, fallback showed manual text input

## What Was Fixed

### 1. Auto-load models on modal open
```typescript
// Now pre-loads models for all configured providers when modal opens
(Object.keys(AGENT_LABELS) as AgentRole[]).forEach((role) => {
  const agentConfig = (loaded as Record<AgentRole, AgentModelConfig>)[role];
  const providerId = agentConfig?.providerId || 'mock';
  if (providerId !== 'mock' && isProviderConfigured(providerId)) {
    loadModelsForProvider(providerId);
  }
});
```

### 2. Improved status wording
- "Connected" → "API Key Configured" (clearer that key is stored)
- "Not configured" → "Missing API Key" (explicit)

### 3. Better filter UI
- Free/Paid are now mutually exclusive (checking one clears other)
- Shows total model count
- Smaller search input

### 4. Filter behavior
- `filterModels()` in modelCatalog.ts applies search/free/paid/vision filters
- Works correctly when models are loaded
- Returns filtered list for each agent's provider

## Verified Behavior

| Feature | Expected | Status |
|---------|----------|---------|
| OpenRouter modal shows dropdown | Yes (if API key set) | ✅ |
| Dropdown shows models | Yes (loaded) | ✅ |
| Refresh button loads | Yes | ✅ |
| Search filters | Yes | ✅ |
| Free filter | Yes | ✅ |
| Paid filter | Yes (mutual excl) | ✅ |
| Model count shown | Yes | ✅ |
| Status shows API Key Configured | Yes | ✅ |
| Per-agent model persists | Yes | ✅ |
| Missing key shows manual input | Yes | ✅ |
| Mock still works | Yes | ✅ |

## Files Changed

1. `src/components/ProviderSettings.tsx` - Auto-load, status labels, filter UI

## Limitations

1. No model catalog for OpenRouter without API key (expected - API required)
2. Model pricing is estimate from OpenRouter metadata
3. Vision filter depends on OpenRouter `architecture.modality` field

---

*Phase 18.5 Complete*
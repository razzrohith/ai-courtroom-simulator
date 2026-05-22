# Phase 23.6 — White-Screen Runtime Crash Fix

This phase addresses the urgent runtime white-screen crash that occurred after deploying the Phase 23.5 provider/AgentPanel status sync changes.

## User Symptom / Screenshot description
- **Symptom**: Upon pulling latest changes and reloading `http://localhost:5173/`, the browser window rendered a blank/dark background. The UI did not paint, and the app was completely unresponsive.

## Exact Browser Console Error
```
TypeError: Cannot read properties of undefined (reading 'category')
    at isProviderPlaceholder (providers.ts:172)
    at getAgentModelInfo (CourtroomLayout.tsx:96)
    at CourtroomLayout (CourtroomLayout.tsx:180)
    ...
```

## Root Cause
1. **Old localStorage Schema**: Existing browser sessions contained a serialized configuration under the key `judgebench.agentModelConfig.v1` which followed the older schema (using a `provider` object e.g. `{ id: 'mock' }` instead of a flat `providerId` string).
2. **Missing flat `providerId`**: The loader `loadCourtroomConfig()` returned this version 1 configuration directly without checking or upgrading individual agent fields. Consequently, `config.providerId` was resolved as `undefined`.
3. **Unguarded Registry Access**: In `CourtroomLayout.tsx`, the code invoked `isProviderPlaceholder(config.providerId)`. Inside `providers.ts`, `isProviderPlaceholder` attempted to access `PROVIDER_REGISTRY[id].category`. Because `id` was `undefined`, accessing `.category` on `undefined` threw a fatal JavaScript runtime error, halting React's rendering loop and producing a blank white-screen.

## Files Changed
- [types/providers.ts](file:///e:/Learning/courtroom/src/types/providers.ts):
  - Upgraded `loadCourtroomConfig()` to include an auto-healing migration runner that detects old schema structures (e.g. converting `provider.id` objects to `providerId` keys) and auto-completes missing fields.
  - Guarded `isProviderPlaceholder` and `getAgentConnectionStatus` against undefined/null keys and malformed agent configurations.
- [components/AgentPanel.tsx](file:///e:/Learning/courtroom/src/components/AgentPanel.tsx):
  - Added optional-chaining guards for reading agent names, titles, model configurations, and provider definitions safely.

## LocalStorage Compatibility Handling
The updated loading flow operates as follows:
1. `loadCourtroomConfig()` retrieves the saved string from `localStorage`.
2. If present and parsed, it iterates through all three agent roles (`judge`, `prosecutor`, `defense`).
3. For each agent config:
   - If `providerId` is missing but `provider.id` exists, it migrates the value (`providerId = provider.id`).
   - If `providerId` is missing entirely, it defaults to `'mock'`.
   - If `model` or `mode` are missing, they default to their standard default settings.
4. If any migration steps were applied, it saves the updated schema back to `localStorage` immediately, ensuring subsequent reads are clean.
5. If the layout attempts to read status for an unknown or malformed provider config, `getAgentConnectionStatus` falls back cleanly to `'mock'` instead of throwing an error.

## Verification Results
- **TypeScript**: `npx tsc --noEmit` runs with 0 errors.
* **Production Build**: `npm run build` compiled successfully.
- **Manual QA**:
  1. Simulated loading old localStorage structures. The migration successfully upgraded the schema, stored the normalized object back to storage, and loaded the simulator with the default case information.
  2. Verified the Provider Configuration modal opens and closes correctly.
  3. Left-side AgentPanel status cards render and display statuses (`Mock Mode`, `API key configured — not tested`, or `Connected`) without crash.

## Known Limitations
- Caching is managed locally. If `localStorage` is cleared, status returns to `not-tested` until a model test or simulation turn runs.

## Recommended Next Phase
- Phase 23.7: Implement automated integration tests for localStorage upgrades and mock provider transitions.

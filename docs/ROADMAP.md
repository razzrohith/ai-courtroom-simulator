# Roadmap

## ✅ Phase 1-13 Complete

- Project scaffolding (React/TypeScript/Vite/Tailwind)
- Basic UI components
- State management (courtController)
- 15-phase progression
- Mock transcript data
- Evidence board
- Verdict panel
- Agent profiles
- Provider skeleton / API key management

## ✅ Phase 14 — Complete

Live model catalogs and provider runtimes:

- [x] OpenRouter live model catalog (/api/v1/models)
- [x] Ollama local model catalog (/api/tags)
- [x] OpenAI direct runtime
- [x] Anthropic direct runtime  
- [x] Gemini direct runtime
- [x] LM Studio / custom endpoint support
- [x] Model filters (free/paid/vision/search)
- [x] Dynamic model dropdown
- [x] Refresh button for model lists
- [x] Accurate status indicators

See PHASE_14_MODEL_CATALOG_RUNTIME.md

## ✅ Phase 15 — Complete

Visual component library:

- [x] CourtroomVisual.tsx components
- [x] CourtroomAvatar for judges/attorneys
- [x] PhaseBanner for current phase
- [x] SpeakingIndicator with animation
- [x] ObjectionAlert notifications
- [x] EvidenceCard with highlights
- [x] ExhibitSeal for restricted items
- [x] VerdictReveal animation
- [x] SVG components (bench, tables, stand)

See PHASE_15_VISUAL_OVERHAUL.md

## ✅ Phase 16 — Complete

Courtroom stage integration:

- [x] CourtroomStage full component
- [x] Judge bench positioned top center
- [x] Attorney tables left/right
- [x] Witness stand area
- [x] Evidence counter station
- [x] Phase banner on stage
- [x] Active speaker glow
- [x] Objection alert wired
- [x] Verdict reveal linked
- [x] Responsive layout

See PHASE_16_COURTROOM_STAGE_INTEGRATION.md

## ✅ Phase 17 — Complete

Provider runtime completion:

- [x] Dynamic API key loading (sessionStorage)
- [x] ResponseMetadata type definition
- [x] Provider test panel results show provider/model
- [x] OpenRouter runtime with loadApiKey
- [x] OpenAI/Anthropic/Gemini use key storage
- [x] Token usage capture interface (structure ready)
- [x] Graceful fallback to mock

See PHASE_17_PROVIDER_RUNTIME_COMPLETION.md

## ✅ Phase 17.5 — Complete

Provider verification and completion:

- [x] Provider audit (all 7 providers verified)
- [x] Real provider test calls implemented
- [x] LM Studio local provider added
- [x] Accurate fallback display
- [x] Secret safety confirmed

See PHASE_17_5_PROVIDER_VERIFICATION.md

## Phase 18 Future

### Provider Enhancements

- [ ] Wire token usage from API responses

### Live Model Selection

- [ ] In-app model catalog viewer
- [ ] Model test chat UI
- [ ] Favorite models

### Cases

- [ ] Multiple case templates
- [ ] Custom case creation UI
- [ ] Import/export cases

### Sessions

- [ ] Save/restore sessions
- [ ] Session history
- [ ] Transcript PDF export

### Ideas (Unscheduled)

- [ ] Voice/TTS output
- [ ] Animation/visual avatars
- [ ] Jury panel expansion
- [ ] Witness simulation
- [ ] Real-time scoring
- [ ] Multi-case support

# JudgeBench — AI Courtroom Simulator

A realistic multi-agent AI courtroom simulator with a visual courtroom interface. The app simulates a court proceeding with three main AI agents: Judge, Plaintiff/Prosecutor, and Defense.

## Features

- **Multi-Agent Courtroom Simulation** — Three AI agents (Judge, Prosecutor, Defense) participate in a structured legal proceeding
- **Phase-Based Proceedings** — 12 distinct courtroom phases from case setup to verdict
- **Live Transcript** — Real-time transcript showing all agent statements
- **Evidence Board** — Track evidence introduction and status
- **Verdict Panel** — Detailed verdict with reasoning after trial
- **Mock Mode** — All responses are simulated for demonstration (no real API calls)
- **Provider Configuration** — Configurable provider/model per agent (Phase 2)

## Tech Stack

- **React 18** — UI framework
- **TypeScript** — Type-safe development
- **Vite** — Build tool
- **Tailwind CSS** — Styling

## How to Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Current Limitations (Phase 1)

- **Mock Mode Only** — All agent responses are pre-scripted
- No real LLM API connections
- Single predefined case ("Apex Logistics v. Northstar Retail")
- No persistence
- No user authentication

## Future Provider Support

Planned provider adapters:
- OpenRouter (100+ LLM models)
- OpenAI (GPT-4, GPT-4o)
- Anthropic Claude (Claude 3.5, Claude 3 Opus)
- Google Gemini
- Ollama (Local models)
- LM Studio (Local endpoint)

## Per-Agent Model Configuration

Each agent can be assigned a different model provider:
- Judge Agent → can use any provider
- Prosecutor Agent → can use any provider  
- Defense Agent → can use any provider

## No Legal Advice Disclaimer

⚠️ **This is an AI courtroom simulation for education and experimentation only.**

It is not legal advice and should not be used for any legal proceeding. The case depicted is fictional.

## Project Structure

```
src/
├── components/     # React UI components
├── data/           # Sample case & mock flow
├── agents/         # Agent types & profiles
├── providers/      # Model provider adapter system
├── orchestration/ # Court state machine
├── types/          # TypeScript definitions
└── App.tsx         # Main application
```

## License

MIT

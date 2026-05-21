# Agent Design

## Three Main Agents

### 1. Judge Agent

- **Role**: Neutral arbiter and court moderator
- **Profile**: Honorable Sarah Mitchell
- **Responsibilities**:
  - Open and close court
  - Rule on objections
  - Admit evidence
  - Manage courtroom procedure
  - Render verdict

### 2. Prosecutor/Plaintiff Agent

- **Role**: Claim advocate
- **Profile**: Attorney Rebecca Chen
- **Client**: Apex Logistics Inc.
- **Responsibilities**:
  - Opening statement
  - Present evidence supporting claim
  - Cross-examine defense witnesses
  - Rebut defense claims
  - Closing argument

### 3. Defense Agent

- **Role**: Respondent defender
- **Profile**: Attorney Marcus Williams
- **Client**: Northstar Retail Corp.
- **Responsibilities**:
  - Opening statement
  - Challenge plaintiff's evidence
  - Present defense evidence
  - Cross-examine plaintiff witnesses
  - Closing argument

## Agent vs Provider Mapping

In Phase 1 (MVP), all agents use "mock-provider" with mock models.

Future configuration example:

```
Judge      → OpenRouter / claude-3.5-sonnet
Prosecutor → OpenAI / gpt-4o  
Defense    → Ollama / llama3.1
```

## Extensibility

New agents can be added by:
1. Defining new AgentRole in types/courtroom.ts
2. Creating AgentProfile in agents/agentProfiles.ts
3. Adding mock messages in data/mockCourtFlow.ts
4. Registering in CourtController participants

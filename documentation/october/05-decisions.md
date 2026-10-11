# Architecture Decisions

## October 2, 2026

### Decision 001 — Establish Dedicated Q4 Repository Structure

We created a dedicated repository structure for the Q4 AI Engineering Journey.

The three major projects will remain separated while sharing a common documentation structure.

### Structure

```text
Q4-AI-Engineering-Journey/
├── 01-autonomous-engineering-agent/
├── 02-ai-security-operations/
├── 03-ai-automation-platform/
└── documentation/
    ├── october/
    ├── november/
    └── december/
```

### Status

Accepted

---

# October 3, 2026

## Decision 002 — Architecture Before Implementation

We will define and document the logical architecture of the Autonomous Engineering Agent before committing to a final implementation framework.

### Reason

The project involves multiple concepts including:

- Agent orchestration
- Tool calling
- Planning
- Memory
- RAG
- MCP
- Human-in-the-loop
- Evaluation
- Guardrails
- Observability

The architecture should be understood before implementation decisions are finalized.

### Status

Accepted

---

## Decision 003 — Logical Roles Before Physical Agents

Planner, Researcher, Coder, Tester, Security Reviewer, and Final Reviewer will initially be treated as logical responsibilities.

We will not assume that every responsibility must become a separate AI agent.

### Reason

The implementation architecture should be selected based on actual requirements rather than forcing a multi-agent architecture unnecessarily.

### Status

Accepted

---

## Decision 004 — Controlled Autonomy

The system will be designed around controlled autonomy rather than unrestricted machine access.

### Reason

An engineering agent may eventually be capable of reading files, modifying code, executing commands, and interacting with external systems.

These capabilities require security boundaries and observability.

### Status

Accepted

---

## Decision 005 — Documentation as Part of Engineering

Architectural decisions, failures, blockers, and lessons learned will be documented throughout development.

### Reason

The Q4 Journey is both an engineering project and a build-in-public documentation project.

### Status

Accepted

Decision 006 — Provider-Agnostic LLM Architecture

Date: October 8, 2026

Decision:
The Autonomous Engineering Agent will use a provider-agnostic
LLM adapter layer instead of coupling the agent directly to a
single model provider.

Initial providers:
- Gemini
- OpenAI
- Groq

Reason:
The agent's reasoning loop, tool execution, state management,
and safety controls should remain independent of the underlying
LLM provider.

This allows providers to be changed or compared without
rewriting the core agent architecture.

Status:
Proposed → validate through implementation

---

## October 10, 2026

### Decision 007 — Implement the Core Agent Loop Before Adopting an Orchestration Framework

**Decision**

The initial Autonomous Engineering Agent will use a custom TypeScript agent loop to manage model interactions, tool execution, and iteration.

A dedicated orchestration framework will not be introduced until the core mechanics are better understood and the project's requirements justify it.

**Reason**

Building the core loop directly provides an opportunity to understand how an agent coordinates reasoning, tool calls, execution results, and subsequent model responses.

It also allows us to identify limitations and reliability issues before introducing additional abstractions.

**Implementation Notes**

- The agent loop is implemented in `src/agent.ts`.
- Gemini is the current model provider.
- The agent can interact with the codebase through tools such as `list_files`, `read_file`, and `search_code`.
- The current implementation uses an iteration limit to bound the agent loop.

**Status**

Accepted — implementation in progress.

---

### Decision 008 — Detect and Prevent Duplicate Tool Calls

**Decision**

The agent will detect repeated tool calls with the same tool name and equivalent arguments within a single run.

When an identical tool call is detected again, the agent will skip its execution and return a structured error with guidance to try a different approach.

**Reason**

During testing, the agent attempted to repeat the same search operation. Repeated calls can waste API requests, consume available quota, and prevent the agent from making meaningful progress.

The duplicate-call guard provides a deterministic safeguard instead of relying exclusively on instructions in the model prompt.

**Implementation Notes**

- Tool-call arguments are normalized before generating a comparison key.
- Previously executed tool-call keys are tracked during the agent run.
- Duplicate calls are skipped and reported to the agent.
- A manual smoke test confirmed that the first search executed and the repeated search was skipped.

**Limitations**

The current implementation detects identical tool names and normalized arguments. It does not detect every possible form of repetitive behavior, such as different searches that produce the same result.

An automated regression test is still required.

**Status**

Implemented — manual smoke test passed; automated regression testing pending.

---

### Decision 009 — Treat Model Instructions and Programmatic Guardrails Separately

**Decision**

Important operational limits and safety requirements must be enforced by application code where possible, rather than relying only on instructions included in the model prompt.

**Reason**

During testing, the model continued making tool calls beyond the requested task-specific iteration budget. This demonstrated that a prompt instruction alone cannot guarantee compliance with an operational limit.

**Implementation Notes**

- The agent currently has a code-level maximum iteration setting.
- Task-specific iteration budgets need to be enforced explicitly if they differ from the global maximum.
- Error handling, argument validation, and filesystem access restrictions remain part of the ongoing reliability and safety work.

**Status**

Accepted — further implementation and testing required.

---
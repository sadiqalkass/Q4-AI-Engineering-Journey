# Architecture Decisions

## October 2, 2026

### Decision 001 — Establish Dedicated Q4 Repository Structure

**Decision**

We created a dedicated repository structure for the Q4 AI Engineering Journey.

The three major projects will remain separated while sharing a common documentation structure.

**Structure**

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

**Status:** Accepted

---

## October 3, 2026

### Decision 002 — Architecture Before Implementation

**Decision**

We will define and document the logical architecture of the Autonomous Engineering Agent before committing to a final implementation framework.

**Reason**

The project involves multiple concepts, including:

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

**Status:** Accepted

---

### Decision 003 — Logical Roles Before Physical Agents

**Decision**

Planner, Researcher, Coder, Tester, Security Reviewer, and Final Reviewer will initially be treated as logical responsibilities.

We will not assume that every responsibility must become a separate AI agent.

**Reason**

The implementation architecture should be selected based on actual requirements rather than forcing a multi-agent architecture unnecessarily.

**Status:** Accepted

---

### Decision 004 — Controlled Autonomy

**Decision**

The system will be designed around controlled autonomy rather than unrestricted machine access.

**Reason**

An engineering agent may eventually be capable of reading files, modifying code, executing commands, and interacting with external systems.

These capabilities require security boundaries and observability.

**Status:** Accepted

---

### Decision 005 — Documentation as Part of Engineering

**Decision**

Architectural decisions, failures, blockers, and lessons learned will be documented throughout development.

**Reason**

The Q4 Journey is both an engineering project and a build-in-public documentation project.

**Status:** Accepted

---

## October 8, 2026

### Decision 006 — Provider-Agnostic LLM Architecture

**Decision**

The Autonomous Engineering Agent will use a provider-agnostic LLM adapter layer instead of coupling the core agent directly to a single model provider.

**Initial provider plans**

- Gemini
- OpenAI
- Groq

**Reason**

The agent's reasoning loop, tool execution, state management, and safety controls should remain independent of the underlying LLM provider.

This architecture allows providers to be changed or compared without rewriting the core agent architecture.

**Implementation Notes**

- A shared LLM adapter interface has been implemented.
- Gemini and mock adapters are available.
- The mock adapter supports testing without depending on live model availability.
- OpenAI and Groq adapters have not yet been confirmed as implemented.
- Live Gemini validation has been affected by API quota errors.

**Status:** Adapter architecture implemented; additional providers and live-provider validation remain outstanding.

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

- The agent runner is implemented in `src/agentRunner.ts`.
- Gemini is available as a model provider, alongside the mock adapter used for deterministic tests.
- The available tools include `list_files`, `read_file`, and `search_code`.
- The runner enforces an iteration limit and tracks execution outcomes.
- Provider state is preserved between model interactions where supported by the adapter.

**Status:** Core agent runner implemented and covered by automated tests.

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
- Automated tests cover duplicate-call behavior.

**Limitations**

The current implementation detects identical tool names and normalized arguments. It does not detect every possible form of repetitive behavior, such as different searches that produce the same result.

**Status:** Implemented and covered by automated tests.

---

### Decision 009 — Treat Model Instructions and Programmatic Guardrails Separately

**Decision**

Important operational limits and safety requirements must be enforced by application code where possible, rather than relying only on instructions included in the model prompt.

**Reason**

During testing, the model continued making tool calls beyond the requested task-specific iteration budget. This demonstrated that a prompt instruction alone cannot guarantee compliance with an operational limit.

**Implementation Notes**

- The agent runner enforces a code-level maximum iteration limit.
- Automated tests cover iteration-limit behavior.
- Tool errors are handled by the runner so the workflow can respond to failures.
- Task-specific iteration budgets remain a separate requirement.
- Tool argument validation and filesystem access restrictions remain part of the ongoing reliability and safety work.

**Status:** Core iteration guard implemented and tested; additional guardrails remain outstanding.

---

## October 16, 2026

### Decision 010 — Use Mock Adapters for Deterministic Testing

**Decision**

The agent's core behavior must be testable without requiring successful responses from a live LLM provider.

Mock adapters and controlled test doubles will be used to validate agent behavior, orchestration logic, error handling, and other deterministic components.

**Reason**

Live model calls can be affected by API quotas, provider availability, network errors, and nondeterministic model responses.

Testing core application logic independently makes failures easier to reproduce and reduces dependence on external services.

**Implementation Notes**

- A mock LLM adapter is available.
- Automated tests use controlled responses to verify agent-runner behavior.
- Planner tests use test adapters that return controlled planning responses.
- Live Gemini validation remains separate from deterministic unit testing.

**Status:** Implemented and used in automated testing.

---

### Decision 011 — Coordinate Agent Roles Through an Explicit Orchestration Layer

**Decision**

The system will use an explicit orchestration layer to coordinate logical agent responsibilities and control the order in which they execute.

The initial workflow coordinates planning, research, coding, and review. It supports a bounded revision cycle when a review rejects a proposed result.

**Reason**

Explicit orchestration makes the workflow easier to test, understand, and control. A bounded revision cycle also prevents rejected work from triggering an unlimited review-and-revision loop.

**Implementation Notes**

- Orchestration interfaces are defined in `src/orchestration/types.ts`.
- The orchestration flow is implemented in `src/orchestration/orchestrator.ts`.
- The workflow validates task input and planning output.
- Review feedback can be passed into a subsequent coding attempt.
- The number of revision attempts is bounded.
- Automated tests cover role ordering, invalid input, review rejection, revision, approval, and revision limits.

**Limitations**

The orchestration structure and revision logic have been tested, but the complete LLM-backed Researcher, Coder, and Reviewer workflow has not yet been verified end to end.

**Status:** Orchestration structure implemented and tested; complete role integration remains in progress.

---

### Decision 012 — Validate Planner Output Before Orchestration

**Decision**

The planner must return a valid structured plan before the orchestration workflow proceeds.

For the initial implementation, the planner response must be valid JSON containing a non-empty array of non-empty string steps. Unexpected tool calls from the planner are rejected.

**Reason**

Downstream orchestration depends on predictable planning output. Invalid or incomplete plans should be rejected explicitly rather than passed to later stages.

**Implementation Notes**

- The LLM-backed planner implementation is in `src/orchestration/llmPlanner.ts`.
- The planner uses the shared LLM adapter interface.
- JSON parsing and basic plan validation are implemented.
- Automated tests cover valid plans, invalid JSON, empty plans, unexpected tool calls, and blank task input.

**Status:** Implemented and covered by automated tests.

---

## Review Policy

Architecture decisions should be updated when implementation evidence changes their status or reveals a limitation.

Each decision should distinguish between:

- **Accepted:** The architectural direction has been agreed upon.
- **Implemented:** The corresponding functionality has been built.
- **Tested:** Relevant automated or manual verification has been completed.
- **Proposed:** The approach is under consideration and has not yet been validated sufficiently.

A decision being accepted does not mean the related functionality is fully implemented. Future changes should be documented without overstating the current capabilities of the system.

## October 23, 2026

### Decision 013 — Require Structured Coding Proposals

**Decision**

The LLM-backed Coder must return a structured JSON response containing a proposal and an optional list of file changes.

Each file change specifies a project-relative path, complete file content, and an overwrite flag.

**Reason**

Structured output allows the application to validate proposed changes before they reach the file-writing stage.

**Implementation Notes**

- The Coder validates the model response.
- File paths must be project-relative.
- The Coder must not request overwriting existing files.
- Invalid structured responses are rejected.

**Status:** Implemented; automated tests cover the Coder response validation.

### Decision 014 — Protect Existing Files by Default

**Decision**

The `write_code` tool creates new files by default and refuses to overwrite existing files unless overwrite permission is explicitly supplied.

The orchestration change-application layer currently rejects overwrite requests.

**Reason**

Generated code must not silently destroy existing project files.

**Implementation Notes**

- Project-root path validation is implemented.
- Writing through symbolic links is prohibited.
- Existing files are protected by default.
- File updates use a temporary sibling file and rename.
- Parent directories must already exist.

**Limitations**

Applying several changes is not transactional. If a later write fails, earlier writes may remain applied.

**Status:** Implemented and covered by automated tests; batch rollback remains outstanding.

### Decision 015 — Apply Changes Only After Review Approval

**Decision**

The orchestrator applies proposed file changes only when the final review approves the coding result.

Rejected results must not be applied. Approved results with no proposed changes must not invoke the change applier.

**Reason**

Review approval is a necessary checkpoint before proposed code is written to disk.

**Implementation Notes**

- Review and revision are handled by the orchestration layer.
- Revision attempts are bounded.
- Tests cover approved, rejected, and empty-change outcomes.
- The default change applier uses the guarded `write_code` tool.

**Limitations**

Approval is not proof of correctness. The complete workflow still needs end-to-end integration and independent test execution.

**Status:** Implemented and covered by orchestration tests.

### Decision 016 — Integrate MCP Through a Namespaced Tool Registry

**Decision**

MCP tools are discovered and registered through a dedicated client and tool registry. External tool names are namespaced when exposed to the agent.

**Reason**

Namespacing reduces collisions between local tools and tools provided by external MCP servers.

**Implementation Notes**

- An MCP client and test server are implemented.
- The registry handles tool discovery and routing.
- Tests cover namespacing, routing, unknown tools, and registration edge cases.

**Limitations**

The test-server integration does not establish production readiness for arbitrary external MCP servers.

**Status:** Implemented and covered by automated tests.

---

## Decision Review — October 23, 2026

The current implementation favors explicit interfaces, structured model responses, programmatic safeguards, deterministic testing, and bounded orchestration.

The next review should prioritize end-to-end integration, independent verification of generated changes, and safe handling of partial failures.

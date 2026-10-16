# Blockers and Open Questions

**Project:** Autonomous Engineering Agent  
**Last Updated:** October 16, 2026  
**Current Phase:** Week 3 — Tool Use, Orchestration, and Documentation  
**Overall Status:** Core components implemented and tested; full end-to-end agent workflow still in progress.

---

## 1. Current Status

The Autonomous Engineering Agent has progressed from initial architecture planning into implementation, testing, and orchestration.

The current implementation includes:

- A provider-agnostic LLM adapter interface.
- A Gemini adapter and a mock adapter for development and testing.
- An agent runner that manages tool calls, provider state, iteration limits, and execution results.
- Codebase-inspection tools: `list_files`, `read_file`, and `search_code`.
- In-memory agent memory for tracking tool results during a run.
- Orchestration interfaces for the Planner, Researcher, Coder, and Reviewer.
- A revision loop that allows the Coder to revise a proposal based on review feedback.
- A Planner implementation that validates model output and parses a non-empty plan from JSON.
- Automated tests covering runner behavior, memory, orchestration, revision handling, and planner validation.

The latest reported verification results are:

- **Build:** Passed.
- **Automated tests:** 20 passed.

These results confirm the current tested components work under the tested conditions. They do not yet establish that the complete system can autonomously implement, execute, and securely validate a software-engineering task end to end.

## 2. Current Implementation Status

### 2.1 Core Agent Runner

**Status:** Implemented and tested.

The runner executes supported tool calls, tracks execution results, skips duplicate calls, handles tool failures, preserves provider state, and enforces an iteration limit.

**Remaining work:**
- Expand tests for edge cases and unexpected provider responses.
- Review how partial results are reported when execution reaches its limit.
- Confirm all operational limits are enforced in application code.

### 2.2 Codebase-Inspection Tools

**Status:** Implemented; security validation remains open.

Available tools:

- `list_files` — lists files in the codebase.
- `read_file` — reads file contents.
- `search_code` — searches code for a query.

**Remaining work:**
- Validate tool arguments and reject malformed inputs.
- Test path traversal and attempts to access files outside the permitted project directory.
- Review filesystem permissions and error responses.

### 2.3 LLM Provider Architecture

**Status:** Adapter abstraction implemented; live provider validation incomplete.

The agent uses an `LLMAdapter` interface to separate model-provider integration from core agent logic. Gemini and mock adapters are present.

The mock adapter supports deterministic local testing without requiring live model requests.

**Remaining work:**
- Validate the Gemini adapter when quota is available.
- Verify provider-specific tool-call and state-handling behavior.
- Implement and test additional providers only when needed.

OpenAI and Groq support should not be considered verified unless their adapters are implemented and tested.

### 2.4 Duplicate Tool-Call Detection

**Status:** Implemented and covered by automated tests.

The runner identifies repeated tool calls with the same tool name and equivalent arguments within a run. Duplicate calls are skipped rather than executed again.

**Remaining work:**
- Test additional edge cases involving argument normalization.
- Consider broader loop-detection strategies if testing reveals a need.

### 2.5 Iteration Limits

**Status:** Implemented and tested.

The runner enforces a maximum iteration limit, and automated tests confirm that it stops when the configured limit is reached.

**Remaining work:**
- Define how the final result should communicate incomplete work.
- Review whether different tasks require different execution budgets.
- Add tests for any future task-specific limit configuration.

### 2.6 Tool Error Handling

**Status:** Basic handling implemented and tested.

The runner has a test confirming that it can continue after a tool throws an error.

**Remaining work:**
- Standardize error-result formats.
- Test different failure types and malformed tool arguments.
- Decide when a failure should trigger a retry, a different approach, or termination.

### 2.7 Agent Memory

**Status:** Basic in-memory implementation completed and tested.

The current memory implementation supports storing, retrieving, updating, checking, and clearing records. The runner uses memory to avoid repeating tool calls.

**Limitations:**
- Memory currently exists only in the running process and is not persistent across separate runs.
- Long-term task memory and retrieval have not been implemented.
- Memory retention, invalidation, and isolation policies remain to be defined.

**Next action:** Define the memory requirements before introducing persistent storage or RAG.

### 2.8 Agent Orchestration

**Status:** Core orchestration logic implemented and tested; complete agent implementations remain in progress.

The orchestrator coordinates the Planner, Researcher, Coder, and Reviewer through a defined sequence. It also supports bounded revision when a review rejects a coding proposal.

The Planner implementation validates task input, rejects unexpected tool calls, and checks that the returned plan contains valid steps.

**Remaining work:**
- Implement the Researcher, Coder, and Reviewer as working agents.
- Connect the agent implementations to the orchestration flow.
- Test the complete workflow using mock adapters and deterministic agents.
- Verify revision behavior across multiple review attempts.

The Tester and Security Reviewer remain planned responsibilities; they should not be described as fully implemented agents yet.

### 2.9 Gemini API Quota

**Status:** Temporary development constraint.

A Gemini API request previously returned a `429` quota error, limiting further live-model testing.

**Impact:** Live provider validation may be delayed.

**Next action:**
- Continue using mock adapters and deterministic tests.
- Resume live-model testing when quota is available.
- Avoid unnecessary requests while the quota constraint remains unresolved.

---

## 3. Current Blocker Summary

| ID | Issue | Status |
|---|---|---|
| B-001 | Gemini API quota | Temporarily blocked |
| B-002 | Filesystem security and path validation | Open |
| B-003 | Complete LLM-backed agent implementations | In progress |
| B-004 | End-to-end orchestration integration | In progress |
| B-005 | Persistent memory across runs | Not implemented |
| B-006 | Standardized tool error and recovery policies | Partially implemented |
| B-007 | Full evaluation and task-completion criteria | Open |
| B-008 | MCP integration | Not implemented |
| B-009 | Safe code and command execution | Open |
| B-010 | GitHub operations by the agent | Future capability |

The previously outstanding automated regression tests for duplicate tool calls and basic iteration-limit behavior have now passed. Basic tool-error handling and in-memory memory behavior are also covered by tests.

---

## 4. Open Architecture Questions

### 4.1 Orchestration Framework

**Current understanding:** The project uses a custom TypeScript orchestration implementation.

**Open question:** Would LangGraph, CrewAI, or another framework provide enough value to justify introducing it?

**Next action:** Continue with the current implementation until concrete requirements demonstrate the need for another framework.

### 4.2 MCP

**Current understanding:** The current tools use an application-defined tool interface. MCP has not yet been integrated.

**Open question:** Which external tools or resources would benefit from MCP?

**Next action:** Define a small MCP integration target and document tool discovery, permissions, and error handling before implementation.

### 4.3 Safe Code Execution

**Current understanding:** Codebase inspection is available, but safe execution of arbitrary commands and generated code has not been established.

**Open question:** How should execution be isolated and restricted?

**Next action:** Research sandboxing, filesystem boundaries, command restrictions, resource limits, and network access before adding execution capabilities.

### 4.4 GitHub Integration

**Current understanding:** The agent can inspect a codebase through its available tools. Automated GitHub operations have not been established.

**Open question:** Should the agent eventually create branches, modify files, review diffs, commit changes, or open pull requests?

**Next action:** Define permission boundaries and human-approval requirements before enabling write operations.

### 4.5 Evaluation

**Current understanding:** Automated tests validate individual components, but a complete task-level evaluation strategy is not yet established.

**Open question:** How will the system determine whether an engineering task was completed correctly and safely?

**Next action:** Define measurable criteria covering task completion, code correctness, test results, security, tool usage, and final-report quality.

### 4.6 Human Approval and Guardrails

**Current understanding:** Duplicate-call prevention and iteration limits provide initial programmatic guardrails.

**Open question:** Which operations should require explicit human approval?

**Next action:** Define approval boundaries for sensitive commands, important file changes, external actions, Git operations, and deployments.

### 4.7 RAG and Persistent Memory

**Current understanding:** Basic in-memory state exists. Persistent memory and retrieval-augmented generation have not been implemented.

**Open question:** Which information needs to persist across tasks, and which project documentation or technical sources need retrieval?

**Next action:** Establish requirements and evaluate practical options before choosing a storage or retrieval architecture.

---

## 5. Architecture Decisions Reflected in the Implementation

The current implementation reflects several established decisions:

1. **Custom agent loop:** Core agent mechanics are implemented directly to make tool execution and state management easier to understand and test.
2. **Provider abstraction:** The agent uses an adapter interface to separate core logic from model-provider details.
3. **Logical agent roles:** Specialized responsibilities are defined without requiring every role to become a separate model-backed agent immediately.
4. **Programmatic guardrails:** Duplicate-call detection and iteration limits are enforced by code rather than relying only on model instructions.
5. **Mock-first testing:** Core behavior can be tested without consuming live model API quota.
6. **Bounded review and revision:** Rejected proposals can be revised, with a configured maximum number of revisions.

These decisions will be reviewed as implementation evidence and requirements evolve.

---

## 6. Next Actions

### Immediate priorities

1. Update the README to reflect the current implementation and testing status.
2. Commit the completed and tested work with clear commit messages.
3. Document architecture decisions, known limitations, and the Gemini quota constraint.
4. Validate filesystem boundaries and tool arguments.
5. Implement the remaining LLM-backed agent roles.
6. Integrate the roles into a mock-tested end-to-end orchestration flow.

### Subsequent priorities

7. Define persistent-memory requirements.
8. Establish task-level evaluation criteria and safety boundaries.
9. Design the first MCP integration.
10. Investigate safe code execution and controlled GitHub operations.
11. Resume live-model testing when the Gemini quota permits.

---

## 7. Current Project Assessment

The project has progressed beyond architecture planning. The core runner, basic memory, orchestration logic, revision loop, and planner validation have been implemented and tested.

The main remaining challenge is integrating these components into a reliable end-to-end engineering workflow while maintaining security boundaries, predictable execution, and useful evaluation.

**Current focus:** Complete the implementation of the agent roles, validate the full orchestration flow with mock adapters, document the engineering decisions, and address the remaining security and reliability gaps.

The project's guiding principle remains:

> Build it. Break it. Learn it. Ship it.
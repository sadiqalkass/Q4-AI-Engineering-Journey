# Blockers and Open Questions

## Current Status

Implementation of the Autonomous Engineering Agent has started.

The project has progressed from architecture planning into the implementation and testing of the core agent loop. Several original architecture questions have been partially answered through implementation, while other capabilities remain planned or under investigation.

Current areas requiring attention include:

- Reliable handling of tool execution errors.

- Enforcement of iteration limits.

- Validation of tool arguments and filesystem access.

- Automated testing of duplicate tool-call detection.

- Managing the Gemini API free-tier request quota during development.

## Current Implementation Status — October 10, 2026

1. Core Agent Loop

Status: Implemented; further validation required.

The agent has an iterative model interaction loop in src/agent.ts. It can receive tool calls, execute supported tools, and return their results to the model.

2. Codebase Inspection Tools

Status: Implemented; security validation pending.

The current tools include:

list_files — lists files in the codebase.

read_file — reads file contents.

search_code — searches code for a query.

Filesystem access boundaries and input validation still need to be reviewed and tested.

3. LLM Provider Architecture

Status: Partially implemented.

Gemini is the current provider. Provider adapter files for Gemini, OpenAI, and Groq exist in the project, but the alternative adapters have not yet been fully verified.

Further provider validation is deferred until the current Week 2 reliability work is completed.

4. Duplicate Tool-Call Detection

Status: Implemented; automated regression test pending.

A duplicate-call guard was added to prevent an identical tool name and argument combination from executing repeatedly during a single agent run.

A manual smoke test confirmed the expected behavior.

5. Iteration Limits

Status: Partially addressed.

The agent currently uses a code-level maximum of eight iterations. Testing showed that the model did not consistently follow a lower task-specific iteration budget supplied through instructions.

The implementation needs to enforce task-specific budgets in code where required and define how partial findings should be returned when the limit is reached.

6. Tool Error Handling

Status: Pending validation.

Tool execution errors need to be handled consistently. The agent should receive a structured error result where appropriate, allowing it to recover or explain the failure instead of unexpectedly terminating the run.

7. API Quota

Status: Temporary development constraint.

A Gemini API request returned a 429 quota error during testing. This interrupted further model-based validation.

Development can continue on documentation, deterministic tests, code review, and other work that does not require additional model requests.

The exact quota reset time and available request allowance should be verified before resuming API-based testing.



# 1. Agent Architecture

### Question

Should the system use:

- A single agent with multiple tools?
- Multiple specialized agents?
- A graph-based workflow?
- A hybrid approach?

### Status

Open

---

# 2. Orchestration

### Question

Which orchestration approach should be used?

Potential technologies include:

- LangGraph
- CrewAI
- Custom orchestration

### Status

Research Required

---

# 3. LLM Provider

### Question

Which LLM API will provide the reasoning capability?

### Status

Research Required

---

# 4. Programming Language

### Question

Should the project primarily use:

- Node.js
- Python
- A hybrid Node.js + Python architecture?

### Status

Research Required

---

# 5. Tool Calling

### Question

Should tools be implemented through:

- Native model tool/function calling?
- MCP?
- A custom tool interface?
- A combination?

### Status

Research Required

---

# 6. MCP

### Question

What role should MCP play in the project?

Potential areas include standardized access to tools, resources, and external systems.

### Status

Research Required

---

# 7. Code Execution

### Question

How can the agent safely execute code and commands?

### Important Considerations

- Sandboxing
- Permissions
- Resource limits
- Network access
- Filesystem access
- Command restrictions

### Status

Research Required

---

# 8. GitHub Integration

### Question

How should the agent interact with repositories?

Potential capabilities:

```text
Read repository
Inspect files
Create changes
Review diff
Create branch
Commit changes
Create pull request
```

### Status

Research Required

---

# 9. Memory

### Question

What information needs to persist between agent steps or tasks?

### Status

Research Required

---

# 10. RAG

### Question

Does the agent require retrieval-augmented generation?

Potential sources could include:

- Project documentation
- Framework documentation
- Technical references
- Repository knowledge

### Status

Research Required

---

# 11. Human-in-the-Loop

### Question

Which actions should require human approval?

Potential examples:

- Executing sensitive commands
- Modifying important files
- External API actions
- Git operations
- Deployments

### Status

Research Required

---

# 12. Evaluation

### Question

How will we determine whether the agent actually completed the engineering task successfully?

Potential evaluation areas:

```text
Task completion
Code correctness
Test results
Security
Efficiency
Tool usage
Final output quality
```

### Status

Research Required

---

# 13. Guardrails

### Question

How do we prevent unsafe or unintended behavior?

### Status

Research Required

---

# 14. Observability

### Question

How will we see:

- Agent decisions
- Tool calls
- Tool results
- Errors
- Retries
- State transitions
- Final outcomes?

### Status

Research Required

---

# Current Blocker Summary

## Current Implementation Blockers

### B-001 — Gemini API Quota

**Problem**

The Gemini free-tier request limit interrupted a model-based test.

**Impact**

Further live testing may be delayed until quota becomes available.

**Next Action**

Continue with documentation, local tests, and code review. Resume API-based testing when the quota permits.

**Status**

Temporarily blocked.

---

### B-002 — Tool Execution Error Handling

**Problem**

Tool failures need a consistent handling strategy so that errors can be returned to the model without unexpectedly terminating the agent run.

**Impact**

An unhandled tool error could interrupt an engineering task before the agent produces a useful result.

**Next Action**

Implement and test structured error handling around tool execution.

**Status**

Open.

---

### B-003 — Filesystem Access Validation

**Problem**

File-reading and other codebase tools must not allow unintended access outside the permitted project directory.

**Impact**

An engineering agent with filesystem access needs clear boundaries before more powerful tools are introduced.

**Next Action**

Review and validate path handling in `read_file`, `list_files`, and `search_code`. Add tests for invalid paths and attempts to access files outside the project.

**Status**

Open.

---

### B-004 — Task-Specific Iteration Limits

**Problem**

The model did not consistently respect the requested lower iteration budget supplied through the prompt.

**Impact**

The agent may use more tool calls and API requests than intended.

**Next Action**

Enforce the applicable iteration budget in application code and determine how the agent should report partial findings when the limit is reached.

**Status**

Open.

---

### B-005 — Automated Tests for Duplicate Tool Calls

**Problem**

Duplicate-call detection has passed a manual smoke test, but a repeatable automated regression test has not yet been confirmed.

**Impact**

Future changes could accidentally reintroduce repeated tool execution.

**Next Action**

Add deterministic tests for first-time execution, duplicate detection, and calls with different arguments.

**Status**

Open.

---

## Original Architecture Questions

The questions below remain part of the project's architecture record. Their status should change as implementation and research provide evidence for a decision.

### 1. Agent Architecture

**Question**

Should the complete system use a single agent with multiple tools, multiple specialized agents, a graph-based workflow, or a hybrid approach?

**Current Understanding**

The initial implementation uses a single agent loop with codebase-inspection tools. This does not settle the architecture for future specialized roles.

**Status**

Initial approach selected; future architecture remains open.

---

### 2. Orchestration

**Question**

Should orchestration use LangGraph, CrewAI, custom orchestration, or another approach?

**Current Understanding**

A custom loop is being used for the initial implementation so that the core mechanics can be understood directly.

**Status**

Custom loop selected for the current implementation; future framework adoption remains open.

---

### 3. LLM Provider

**Question**

Which LLM providers should supply the reasoning capability?

**Current Understanding**

Gemini is currently in use. Adapter files for Gemini, OpenAI, and Groq exist, but the alternative adapters have not yet been fully verified.

**Status**

Gemini in use; multi-provider validation pending.

---

### 4. Programming Language

**Question**

Should the project primarily use Node.js, Python, or a hybrid architecture?

**Current Understanding**

The current agent implementation uses TypeScript and Node.js.

**Status**

TypeScript/Node.js selected for the current implementation; future hybrid requirements remain open.

---

### 5. Tool Calling

**Question**

Should tools be implemented through native model tool calling, MCP, a custom tool interface, or a combination?

**Current Understanding**

The current implementation uses model tool calling and application-defined tools.

**Status**

Initial approach implemented; MCP integration remains open.

---

### 6. MCP

**Question**

What role should MCP play in providing standardized access to tools, resources, and external systems?

**Status**

Open — research required.

---

### 7. Code Execution

**Question**

How can the agent safely execute code and commands?

**Important Considerations**

- Sandboxing.
- Permissions.
- Resource limits.
- Network access.
- Filesystem access.
- Command restrictions.

**Current Understanding**

The current toolset supports codebase inspection. Safe execution of arbitrary code and commands has not been established.

**Status**

Open — research required before introducing broader execution capabilities.

---

### 8. GitHub Integration

**Question**

How should the agent interact with repositories?

Potential capabilities include:

- Read repository.
- Inspect files.
- Create changes.
- Review diffs.
- Create branches.
- Commit changes.
- Create pull requests.

**Status**

Open — future capability; implementation approach not yet determined.

---

### 9. Memory

**Question**

What information needs to persist between agent steps or tasks?

**Status**

Open — research required.

---

### 10. RAG

**Question**

Does the agent require retrieval-augmented generation for project documentation, framework documentation, technical references, or repository knowledge?

**Status**

Open — research required.

---

### 11. Human-in-the-Loop

**Question**

Which actions should require human approval?

Potential examples include sensitive commands, important file modifications, external API actions, Git operations, and deployments.

**Status**

Open — approval boundaries not yet defined.

---

### 12. Evaluation

**Question**

How will we determine whether the agent has successfully completed an engineering task?

Potential evaluation areas include:

- Task completion.
- Code correctness.
- Test results.
- Security.
- Efficiency.
- Tool usage.
- Final output quality.

**Status**

Open — evaluation strategy and automated tests need further definition.

---

### 13. Guardrails

**Question**

How do we prevent unsafe or unintended behavior?

**Current Understanding**

Duplicate tool-call detection has been implemented and manually tested. Other guardrails, including filesystem validation, tool-error handling, and reliable iteration limits, remain in progress or pending.

**Status**

Partially implemented; further validation required.

---

### 14. Observability

**Question**

How will we inspect agent decisions, tool calls, tool results, errors, retries, state transitions, and final outcomes?

**Status**

Open — the observability approach has not yet been fully defined.

---

## Current Blocker Summary

```text
Core Agent Loop:
Implemented

Codebase Inspection Tools:
Implemented; validation pending

Duplicate Tool-Call Detection:
Manual smoke test passed

Automated Regression Tests:
Pending

Tool Error Handling:
Pending validation

Filesystem Security:
Validation required

Iteration Limits:
Code-level limit exists; task-specific enforcement needs work

LLM Provider:
Gemini currently in use

API Quota:
Temporary development constraint

Architecture Questions:
Partially resolved; several remain open

Current Phase:
Week 2 — Reliability, Guardrails, and Testing
```

## Next Actions

1. Complete tool-error handling.
2. Validate filesystem path restrictions and tool arguments.
3. Enforce and test iteration-limit behavior.
4. Add automated tests for duplicate tool calls.
5. Run the available build and test checks.
6. Review the final code changes and update the project documentation.
7. Resume model-based testing when Gemini quota is available.

These actions will help establish a more reliable foundation before adding more advanced capabilities such as code execution, memory, RAG, MCP integration, and multi-agent orchestration.


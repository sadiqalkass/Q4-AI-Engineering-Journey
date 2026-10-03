# Blockers and Open Questions

## Current Status

There are currently no major implementation blockers because implementation has not started.

However, several architectural and technical questions must be answered before the implementation phase.

---

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

```text
Implementation Blockers:
None

Architecture Questions:
Several

Research Required:
Yes

Implementation Ready:
Not yet

Current Phase:
Understanding + Architecture
```

These questions will be resolved progressively during Week 1 before implementation begins.
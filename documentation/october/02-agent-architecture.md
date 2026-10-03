# Autonomous Engineering Agent — Architecture

## 1. Architecture Objective

The architecture is designed around a controlled agentic workflow capable of receiving a software-engineering task and progressing through planning, research, implementation, testing, security review, and final review.

---

# 2. High-Level Architecture

```text
                         ┌──────────────┐
                         │     USER     │
                         └──────┬───────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │   TASK INTAKE    │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │     PLANNER      │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │    RESEARCHER    │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │      CODER       │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │      TESTER      │
                      └────────┬─────────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │    SECURITY REVIEWER     │
                  └────────────┬─────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ FINAL REVIEWER   │
                      └────────┬─────────┘
                               │
                               ▼
                         ┌───────────┐
                         │  RESULT   │
                         └───────────┘
```

---

# 3. Supporting Infrastructure

The agents do not operate in isolation.

```text
                       ┌──────────────┐
                       │     LLM      │
                       └──────┬───────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   ORCHESTRATOR   │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
       TOOLS               STATE              MEMORY
          │                  │                  │
          ▼                  ▼                  ▼
   Files / Git /        Current Task /      Persistent
   Terminal / APIs      Plan / Results       Context
          │
          ▼
       CODEBASE
```

---

# 4. Main Data Flow

```text
User Task
    ↓
Task State
    ↓
Planner
    ↓
Plan
    ↓
Researcher
    ↓
Research Results
    ↓
Coder
    ↓
Code Changes
    ↓
Tester
    ↓
Test Results
    ↓
Security Reviewer
    ↓
Security Findings
    ↓
Final Reviewer
    ↓
Final Result
```

---

# 5. Agent Loop

The architecture should support iterative execution.

```text
              ┌───────────────┐
              │     GOAL      │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │     PLAN      │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │     ACTION    │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │  OBSERVATION  │
              └───────┬───────┘
                      ↓
                 ┌─────────┐
                 │  DONE?  │
                 └───┬─┬───┘
                   No│ │Yes
                     │ │
                     │ └────────→ RESULT
                     │
                     └──────────→ NEXT ACTION
```

---

# 6. State

The system should maintain state containing information such as:

```text
Task
Plan
Current Step
Completed Steps
Tool Calls
Tool Results
Files Modified
Test Results
Errors
Security Findings
Review Results
```

The exact implementation of state will be determined during the research phase.

---

# 7. Human-in-the-Loop

The architecture should support human intervention when required.

Potential approval points include:

```text
Code Modification
       ↓
Human Approval?
   ↙          ↘
 Yes           No
 ↓              ↓
Execute       Review / Stop
```

The exact approval policy will be defined during implementation.

---

# 8. Security Boundary

The agent should not automatically receive unrestricted access to the machine.

Potential boundaries include:

- Restricted filesystem access
- Controlled command execution
- Repository-level permissions
- Command allowlists/denylists
- Human approval for sensitive actions
- Sandboxed execution
- Tool-level permissions

These are architectural considerations and will require further investigation before implementation.

---

# 9. Failure Handling

Possible failures include:

- Invalid plan
- Missing information
- Tool failure
- Command failure
- Test failure
- Incorrect implementation
- Security issue
- Agent loop
- Unexpected tool output

The system should be designed to detect failures and determine whether to:

```text
Retry
 ↓
Modify Plan
 ↓
Request Human Input
 ↓
Stop
```

---

# 10. Architecture Principle

The system should prioritize controlled execution over unrestricted autonomy.

The agent should be able to act, but its actions should remain observable, testable, and subject to defined boundaries.
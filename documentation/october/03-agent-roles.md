# Agent Roles Specification

## Overview

The Autonomous Engineering Agent is logically divided into several responsibilities.

These responsibilities may eventually be implemented as separate agents, orchestration nodes, specialized prompts, or another architecture.

At this stage, they represent logical responsibilities rather than finalized implementation components.

---

## 1. Planner

### Responsibility

Understand the user's task and convert it into an actionable engineering plan.

### Input

```text
User Task
Repository Context
Project Requirements
```

### Output

```text
Implementation Plan
Task Breakdown
Required Tools
Expected Validation
```

### Example

```text
Task:
Add authentication.

Plan:
1. Inspect existing user model.
2. Inspect API structure.
3. Determine authentication approach.
4. Implement authentication.
5. Add tests.
6. Run tests.
7. Review security.
```

---

## 2. Researcher

### Responsibility

Gather information needed to make informed implementation decisions.

### Input

```text
Engineering Plan
Repository Context
Technical Questions
```

### Output

```text
Research Findings
Relevant Documentation
Implementation Recommendations
```

### Possible Research Areas

- Framework documentation
- Library documentation
- API documentation
- Security guidance
- Existing project patterns

---

## 3. Coder

### Responsibility

Implement the engineering task in the repository.

### Input

```text
Implementation Plan
Research Results
Repository Files
```

### Output

```text
Code Changes
Modified Files
Implementation Summary
```

### Required Capabilities

The coder may need access to tools such as:

```text
read_file
write_file
search_code
list_files
git_diff
```

---

## 4. Tester

### Responsibility

Determine whether the implementation works as expected.

### Input

```text
Code Changes
Task Requirements
Existing Tests
```

### Output

```text
Test Results
Failures
Errors
Validation Status
```

### Possible Actions

```text
Run tests
Run build
Run lint
Run application checks
Inspect failures
```

---

## 5. Security Reviewer

### Responsibility

Review the implementation for potential security problems.

### Input

```text
Code Changes
Test Results
Task Requirements
```

### Output

```text
Security Findings
Risk Information
Recommendations
```

### Example Areas

```text
Authentication
Authorization
Input Validation
Secrets
Unsafe Commands
Dependencies
Data Exposure
```

---

## 6. Final Reviewer

### Responsibility

Evaluate the overall work.

### Input

```text
Original Task
Plan
Research
Code Changes
Test Results
Security Findings
```

### Output

```text
Final Assessment
Completed Work
Remaining Issues
Final Report
```

---

# Responsibility Flow

```text
Planner
   ↓
Researcher
   ↓
Coder
   ↓
Tester
   ↓
Security Reviewer
   ↓
Final Reviewer
```

The system should allow the workflow to return to an earlier stage when a failure requires additional work.
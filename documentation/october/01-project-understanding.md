# Project 01 — Autonomous Engineering Agent

## 1. Project Overview

The Autonomous Engineering Agent is the first project of the Q4 AI Engineering Journey.

The objective is to build an AI system capable of taking a software-engineering task and progressing through the engineering process with limited human intervention.

The system should not simply generate an explanation or a piece of code. It should be capable of understanding a task, planning the work, interacting with available tools, modifying a codebase, testing its implementation, reviewing the result, and returning a final outcome.

---

# 2. The Problem

Traditional AI coding assistants are often used in a conversational way.

A developer asks:

```text
How do I implement authentication?
```

The AI responds with an explanation or code.

The developer must then:

1. Understand the response.
2. Inspect the project.
3. Modify the files.
4. Run the application.
5. Run tests.
6. Debug failures.
7. Review security.
8. Decide whether the implementation is correct.

The goal of this project is to explore how much of this engineering workflow can be performed by an AI-driven system.

---

# 3. Project Objective

The system should eventually be able to receive a meaningful software-engineering task and execute a structured workflow toward completing it.

The intended workflow is:

```text
User Task
    ↓
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
    ↓
Result
```

---

# 4. What Is an AI Agent?

For this project, an AI agent is understood as an AI-powered system that can pursue a goal by reasoning about what needs to happen, selecting actions, using tools, observing results, and continuing the workflow based on those results.

A simple language-model interaction can look like:

```text
User
 ↓
Prompt
 ↓
LLM
 ↓
Response
```

An agentic system can instead operate as:

```text
Goal
 ↓
Reason
 ↓
Plan
 ↓
Choose Action
 ↓
Use Tool
 ↓
Observe Result
 ↓
Reason Again
 ↓
Choose Next Action
 ↓
Result
```

The ability to interact with an environment through tools is an important part of the system we are designing.

---

# 5. AI Chatbot vs AI Agent

## Chatbot

```text
Input
 ↓
LLM
 ↓
Response
```

The primary interaction is conversation.

## Agent

```text
Goal
 ↓
Planning
 ↓
Action
 ↓
Observation
 ↓
Planning
 ↓
Action
 ↓
Result
```

The agent operates as part of a larger workflow and can interact with external systems.

For this project, the important distinction is not simply whether the AI is called an "agent."

The important question is:

> Can the system take meaningful actions toward completing an engineering objective?

---

# 6. What Makes Our System Agentic?

Our system is intended to contain several characteristics:

### Goal-oriented behavior

The system receives a software-engineering objective.

### Planning

The system breaks the objective into smaller tasks.

### Tool usage

The system can interact with software tools.

### State

The system maintains information about what has already happened.

### Observation

The system receives results from tools and uses those results to determine the next step.

### Iteration

The system can continue working when an action does not immediately produce the desired result.

### Evaluation

The system needs a mechanism for determining whether the task was successfully completed.

### Human oversight

Certain actions may require human approval.

---

# 7. Example Engineering Task

Example:

```text
Add authentication to this Express API and write tests for it.
```

The agent should not immediately start generating code.

It could first determine:

```text
What framework is being used?
Where is the server entry point?
Does a user model already exist?
How is authentication currently handled?
What database is being used?
Are tests already configured?
What authentication requirements exist?
```

It can then construct an implementation plan.

---

# 8. Example Agent Loop

```text
Receive Task
     ↓
Understand Task
     ↓
Create Plan
     ↓
Inspect Repository
     ↓
Research
     ↓
Implement
     ↓
Run Tests
     ↓
Observe Results
     ↓
Tests Passed?
   ↙       ↘
 No        Yes
 ↓          ↓
Analyze    Continue
Failure
 ↓
Modify Code
 ↓
Run Tests Again
     ↓
Security Review
     ↓
Final Review
     ↓
Result
```

---

# 9. Core Components

The planned system contains several major components.

## LLM

Provides the language reasoning and generation capability.

## Orchestrator

Controls the overall workflow and determines which stage should execute next.

## Agents / Agent Roles

Provide specialized responsibilities such as planning, research, coding, testing, and review.

## Tools

Allow the system to interact with the software environment.

## State

Stores relevant information about the current task and workflow.

## Memory

May allow useful information to persist beyond a single interaction.

## RAG

May provide the system with relevant external or project-specific knowledge.

## Execution Environment

Allows code to be executed and tested.

## Evaluation

Determines whether the system's work satisfies the task requirements.

## Guardrails

Restrict unsafe, invalid, or unauthorized behavior.

## Observability

Provides visibility into what the agent is doing.

---

# 10. Expected Outcome

The final October system should demonstrate that an AI-powered system can perform a meaningful software-engineering task through a structured agentic workflow.

The objective is not to create an unrestricted autonomous system.

The objective is to build a controlled engineering system that can:

```text
Understand
   ↓
Plan
   ↓
Act
   ↓
Observe
   ↓
Test
   ↓
Review
   ↓
Improve
   ↓
Report
```

---

# 11. Current Phase

Current phase:

**Week 1 — Understanding and Architecture**

No major implementation has started yet.

The current focus is understanding the system and defining its architecture before committing to implementation decisions.

---

# 12. Questions We Need to Answer

Before implementation, we need to understand:

1. What exactly qualifies as an AI agent?
2. How does an agent differ from a normal LLM application?
3. How does tool calling work?
4. How should the agent maintain state?
5. When is memory necessary?
6. When is RAG necessary?
7. How should agents be orchestrated?
8. Should we use LangGraph, CrewAI, or another approach?
9. What role can MCP play?
10. How should code execution be handled?
11. How should GitHub integration work?
12. What actions require human approval?
13. How should agent failures be handled?
14. How should the agent be evaluated?
15. How do we prevent unsafe code or commands?
16. How do we observe and debug agent behavior?

---

# 13. Success Definition

The project will be considered successful when the system can demonstrate a meaningful software-engineering workflow rather than simply generating code.

The target workflow is:

```text
Engineering Task
      ↓
Planning
      ↓
Repository Understanding
      ↓
Research
      ↓
Implementation
      ↓
Testing
      ↓
Security Review
      ↓
Final Review
      ↓
Working Result
```

The final system should also provide enough visibility into its actions for the developer to understand what happened during execution.
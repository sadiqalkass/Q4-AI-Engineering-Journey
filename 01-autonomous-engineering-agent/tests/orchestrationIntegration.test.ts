
import test from "node:test";
import assert from "node:assert/strict";

import type {
  LLMAdapter,
  LLMResponse,
  ToolDefinition,
} from "../src/llm/types.js";

import { LLMPlannerAgent } from "../src/orchestration/llmPlanner.js";
import { LLMResearcherAgent } from "../src/orchestration/llmResearcher.js";
import { LLMCoderAgent } from "../src/orchestration/llmCoder.js";
import { LLMReviewerAgent } from "../src/orchestration/llmReviewer.js";
import { Orchestrator } from "../src/orchestration/orchestrator.js";

function response(text: string): LLMResponse {
  return { text, toolCalls: [] };
}

test("orchestrates planning, research, coding, review, and revision", async () => {
  const responses = [
    response(JSON.stringify({
      steps: ["Inspect the design", "Implement validation", "Test the change"],
    })),
    response("Research findings: validate inputs and cover edge cases."),
    response(JSON.stringify({
      proposal: "Initial proposal: add basic input validation.",
      changes: [],
    })),
    response(JSON.stringify({
      approved: false,
      feedback: "The proposal needs stronger edge-case handling.",
      issues: ["Handle empty input", "Add boundary checks"],
    })),
    response(JSON.stringify({
      proposal: "Revised proposal: validate empty input and enforce boundary checks.",
      changes: [],
    })),
    response(JSON.stringify({
      approved: true,
      feedback: "The proposal addresses the identified issues.",
      issues: [],
    })),
  ];

  let calls = 0;

  const adapter: LLMAdapter = {
    async generate(
      _input: unknown,
      _tools: ToolDefinition[],
    ): Promise<LLMResponse> {
      const next = responses[calls++];

      if (!next) {
        throw new Error("Mock adapter ran out of responses.");
      }

      return next;
    },
  };

  const orchestrator = new Orchestrator({
    planner: new LLMPlannerAgent(adapter),
    researcher: new LLMResearcherAgent(adapter),
    coder: new LLMCoderAgent(adapter),
    reviewer: new LLMReviewerAgent(adapter),
    maxRevisions: 2,
  });

  const result = await orchestrator.run("Add input validation");

  assert.equal(calls, 6);
  assert.deepEqual(result.plan.steps, [
    "Inspect the design",
    "Implement validation",
    "Test the change",
  ]);
  assert.match(result.research.findings, /edge cases/);
  assert.match(result.coding.proposal, /Revised proposal/);
  assert.equal(result.review.approved, true);
  assert.deepEqual(result.review.issues, []);
  assert.equal(result.revisionCount, 1);
});

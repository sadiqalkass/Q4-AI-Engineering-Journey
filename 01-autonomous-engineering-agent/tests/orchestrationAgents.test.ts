
import test from "node:test";
import assert from "node:assert/strict";

import type {
  LLMAdapter,
  LLMResponse,
  ToolDefinition,
} from "../src/llm/types.js";

import { LLMResearcherAgent } from "../src/orchestration/llmResearcher.js";
import { LLMCoderAgent } from "../src/orchestration/llmCoder.js";
import { LLMReviewerAgent } from "../src/orchestration/llmReviewer.js";

function createAdapter(text: string, toolCalls: LLMResponse["toolCalls"] = []): LLMAdapter {
  return {
    async generate(
      _input: unknown,
      _tools: ToolDefinition[],
    ): Promise<LLMResponse> {
      return { text, toolCalls };
    },
  };
}

const plan = { steps: ["Inspect the code", "Implement the change"] };
const research = { findings: "Consider validation and edge cases." };
const coding = { proposal: "Add validation and tests." };

test("researcher rejects empty findings", async () => {
  const agent = new LLMResearcherAgent(createAdapter("   "));

  await assert.rejects(
    () => agent.run("Add validation", plan),
    /empty findings/,
  );
});

test("researcher rejects unexpected tool calls", async () => {
  const agent = new LLMResearcherAgent(
    createAdapter("Findings", [
      { id: "call-1", name: "search_code", arguments: { query: "validation" } },
    ]),
  );

  await assert.rejects(
    () => agent.run("Add validation", plan),
    /unexpected tool calls/,
  );
});



test("coder rejects an empty proposal", async () => {
  const adapter = createAdapter(
    JSON.stringify({
      proposal: "",
      changes: [],
    }),
  );

  const coder = new LLMCoderAgent(adapter);

  await assert.rejects(
    () =>
  coder.run(
    "Implement input validation",
    { steps: ["Inspect the code", "Add validation"] },
    { findings: "Validate input and cover edge cases." },
  ),
    /empty proposal/i,
  );
});



test("coder rejects unexpected tool calls", async () => {
  const agent = new LLMCoderAgent(
    createAdapter("Proposal", [
      { id: "call-1", name: "search_code", arguments: { query: "validation" } },
    ]),
  );

  await assert.rejects(
    () => agent.run("Add validation", plan, research),
    /unexpected tool calls/,
  );
});

test("reviewer rejects invalid JSON", async () => {
  const agent = new LLMReviewerAgent(createAdapter("not JSON"));

  await assert.rejects(
    () => agent.run("Add validation", plan, research, coding),
    /invalid JSON/,
  );
});

test("reviewer rejects an invalid review structure", async () => {
  const agent = new LLMReviewerAgent(
    createAdapter(JSON.stringify({
      approved: "yes",
      feedback: "Looks good",
      issues: [],
    })),
  );

  await assert.rejects(
    () => agent.run("Add validation", plan, research, coding),
    /invalid review structure/,
  );
});

test("reviewer accepts a valid review", async () => {
  const agent = new LLMReviewerAgent(
    createAdapter(JSON.stringify({
      approved: true,
      feedback: "The proposal addresses the task.",
      issues: [],
    })),
  );

  const result = await agent.run("Add validation", plan, research, coding);

  assert.deepEqual(result, {
    approved: true,
    feedback: "The proposal addresses the task.",
    issues: [],
  });
});


test("reviewer includes proposed file paths and contents in its prompt", async () => {
  let capturedPrompt = "";

  const adapter: LLMAdapter = {
    async generate(
      input: unknown,
      _tools: ToolDefinition[],
    ): Promise<LLMResponse> {
      capturedPrompt = String(input);

      return {
        text: JSON.stringify({
          approved: true,
          feedback: "The proposed changes look acceptable.",
          issues: [],
        }),
        toolCalls: [],
      };
    },
  };

  const agent = new LLMReviewerAgent(adapter);

  await agent.run(
    "Add input validation",
    plan,
    research,
    {
      proposal: "Add validation to reject empty input.",
      changes: [
        {
          path: "src/validation.ts",
          content: "export function isValid(input: string) { return input.trim().length > 0; }",
        },
      ],
    },
  );

  assert.ok(capturedPrompt.includes("Add input validation"));
  assert.ok(capturedPrompt.includes("src/validation.ts"));
  assert.ok(capturedPrompt.includes("export function isValid"));
  assert.ok(capturedPrompt.includes("Proposed file changes"));
});

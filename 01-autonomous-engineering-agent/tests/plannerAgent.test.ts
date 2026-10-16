
import test from "node:test";
import assert from "node:assert/strict";

import { LLMPlannerAgent } from "../src/orchestration/llmPlanner.js";
import type {
  LLMAdapter,
  LLMResponse,
  ToolDefinition,
} from "../src/llm/types.js";

function createAdapter(
  response: LLMResponse
): LLMAdapter {
  return {
    async generate(
      _input: unknown,
      _tools: ToolDefinition[]
    ) {
      return response;
    },
  };
}

function createResponse(text: string): LLMResponse {
  return {
    text,
    toolCalls: [],
  };
}

test("creates a plan from valid JSON", async () => {
  const adapter = createAdapter(
    createResponse(
      JSON.stringify({
        steps: [
          "Inspect the existing code",
          "Implement input validation",
          "Run the tests",
        ],
      })
    )
  );

  const planner = new LLMPlannerAgent(adapter);
  const result = await planner.run(
    "Add input validation"
  );

  assert.deepEqual(result.steps, [
    "Inspect the existing code",
    "Implement input validation",
    "Run the tests",
  ]);
});

test("rejects invalid JSON", async () => {
  const planner = new LLMPlannerAgent(
    createAdapter(createResponse("not JSON"))
  );

  await assert.rejects(
    () => planner.run("Add input validation"),
    /invalid JSON/
  );
});

test("rejects an empty plan", async () => {
  const planner = new LLMPlannerAgent(
    createAdapter(
      createResponse(JSON.stringify({ steps: [] }))
    )
  );

  await assert.rejects(
    () => planner.run("Add input validation"),
    /non-empty array/
  );
});

test("rejects unexpected tool calls", async () => {
  const planner = new LLMPlannerAgent(
    createAdapter({
      text: '{"steps":["Inspect the code"]}',
      toolCalls: [
        {
          id: "unexpected-call",
          name: "search_code",
          arguments: { query: "validation" },
        },
      ],
    })
  );

  await assert.rejects(
    () => planner.run("Add input validation"),
    /unexpected tool calls/
  );
});

test("rejects a blank task before calling the adapter", async () => {
  let called = false;

  const adapter: LLMAdapter = {
    async generate() {
      called = true;
      return createResponse('{"steps":["Inspect code"]}');
    },
  };

  const planner = new LLMPlannerAgent(adapter);

  await assert.rejects(
    () => planner.run("   "),
    /cannot be empty/
  );

  assert.equal(called, false);
});

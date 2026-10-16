
import test from "node:test";
import assert from "node:assert/strict";

import { runAgent } from "../src/agentRunner.js";
import type {
  LLMAdapter,
  LLMResponse,
  ToolCall,
  ToolDefinition,
} from "../src/llm/types.js";

const tools: ToolDefinition[] = [
  {
    name: "search_code",
    description: "Search the codebase",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
];

function createAdapter(
  responses: LLMResponse[]
): LLMAdapter {
  let index = 0;

  return {
    async generate() {
      const response = responses[index++];

      if (!response) {
        throw new Error("No mock response available");
      }

      return response;
    },
  };
}

function searchCall(
  id: string,
  query: string
): ToolCall {
  return {
    id,
    name: "search_code",
    arguments: { query },
  };
}

test("executes a tool call and returns the final answer", async () => {
  const adapter = createAdapter([
    {
      text: "",
      toolCalls: [searchCall("call-1", "jwt")],
    },
    {
      text: "Search completed successfully.",
      toolCalls: [],
    },
  ]);

  let executionCount = 0;

  const result = await runAgent(
    "Search for JWT",
    adapter,
    tools,
    async () => {
      executionCount++;
      return { matches: 3 };
    }
  );

  assert.equal(executionCount, 1);
  assert.equal(result.completed, true);
  assert.equal(result.finalText, "Search completed successfully.");
  assert.equal(result.toolCallsExecuted, 1);
  assert.equal(result.iterations, 2);
});

test("skips duplicate tool calls", async () => {
  const adapter = createAdapter([
    {
      text: "",
      toolCalls: [searchCall("call-1", "jwt")],
    },
    {
      text: "",
      toolCalls: [searchCall("call-2", "jwt")],
    },
    {
      text: "Duplicate was skipped.",
      toolCalls: [],
    },
  ]);

  let executionCount = 0;

  const result = await runAgent(
    "Test duplicate detection",
    adapter,
    tools,
    async () => {
      executionCount++;
      return { matches: 3 };
    }
  );

  assert.equal(executionCount, 1);
  assert.equal(result.toolCallsExecuted, 1);
  assert.equal(result.duplicateCallsSkipped, 1);
  assert.equal(result.completed, true);
});

test("continues when a tool throws an error", async () => {
  const adapter = createAdapter([
    {
      text: "",
      toolCalls: [searchCall("call-1", "jwt")],
    },
    {
      text: "Recovered after the tool error.",
      toolCalls: [],
    },
  ]);

  const result = await runAgent(
    "Test tool error handling",
    adapter,
    tools,
    async () => {
      throw new Error("Simulated tool failure");
    }
  );

  assert.equal(result.toolErrors, 1);
  assert.equal(result.completed, true);
  assert.equal(result.finalText, "Recovered after the tool error.");
});

test("stops at the configured iteration limit", async () => {
  const adapter = createAdapter([
    {
      text: "",
      toolCalls: [searchCall("call-1", "first")],
    },
    {
      text: "",
      toolCalls: [searchCall("call-2", "second")],
    },
  ]);

  const result = await runAgent(
    "Test iteration limit",
    adapter,
    tools,
    async () => ({ ok: true }),
    2
  );

  assert.equal(result.completed, false);
  assert.equal(result.iterations, 2);
  assert.equal(result.finalText, null);
});

test("passes provider state between model calls", async () => {
  const receivedStates: unknown[] = [];
  let index = 0;

  const adapter: LLMAdapter = {
    async generate(_input, _tools, providerState) {
      receivedStates.push(providerState);
      index++;

      if (index === 1) {
        return {
          text: "",
          toolCalls: [searchCall("call-1", "jwt")],
          providerState: { turn: 1 },
        };
      }

      return {
        text: "Provider state preserved.",
        toolCalls: [],
        providerState: { turn: 2 },
      };
    },
  };

  await runAgent(
    "Test provider state",
    adapter,
    tools,
    async () => ({ ok: true })
  );

  assert.equal(receivedStates[0], undefined);
  assert.deepEqual(receivedStates[1], { turn: 1 });
});

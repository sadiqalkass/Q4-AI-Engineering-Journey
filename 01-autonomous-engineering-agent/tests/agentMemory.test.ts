import test from "node:test";
import assert from "node:assert/strict";

import { AgentMemory } from "../src/memory/agentMemory.js";

test("stores and retrieves a remembered result", () => {
  const memory = new AgentMemory();

  memory.remember("search:jwt", {
    toolName: "search_code",
    result: { matches: 3 },
  });

  assert.equal(memory.has("search:jwt"), true);
  assert.deepEqual(memory.get("search:jwt"), {
    toolName: "search_code",
    result: { matches: 3 },
  });
});

test("returns undefined for an unknown key", () => {
  const memory = new AgentMemory();

  assert.equal(memory.get("missing"), undefined);
  assert.equal(memory.has("missing"), false);
});

test("updates an existing memory record", () => {
  const memory = new AgentMemory();

  memory.remember("search:jwt", {
    toolName: "search_code",
    result: { matches: 2 },
  });

  memory.remember("search:jwt", {
    toolName: "search_code",
    result: { matches: 5 },
  });

  assert.deepEqual(memory.get("search:jwt")?.result, {
    matches: 5,
  });
  assert.equal(memory.size, 1);
});

test("clears all remembered records", () => {
  const memory = new AgentMemory();

  memory.remember("search:jwt", {
    toolName: "search_code",
    result: { matches: 3 },
  });

  memory.remember("search:auth", {
    toolName: "search_code",
    result: { matches: 2 },
  });

  memory.clear();

  assert.equal(memory.size, 0);
  assert.equal(memory.has("search:jwt"), false);
  assert.equal(memory.has("search:auth"), false);
});


import { test } from "node:test";
import assert from "node:assert/strict";
import { MCPToolRegistry } from "../src/mcp/mcpToolRegistry.js";
import type { MCPClient } from "../src/mcp/mcpClient.js";

function createMockClient(
  toolNames: string[] = ["hello_mcp"],
) {
  const calls: Array<{
    name: string;
    args: Record<string, unknown>;
  }> = [];

  const client = {
    async listTools() {
      return {
        tools: toolNames.map((name) => ({
          name,
          description: `Test tool ${name}`,
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        })),
      };
    },

    async callTool(
      name: string,
      args: Record<string, unknown>,
    ) {
      calls.push({ name, args });

      return {
        content: [
          {
            type: "text" as const,
            text: "Mock MCP result",
          },
        ],
      };
    },
  };

  return {
    client: client as unknown as MCPClient,
    calls,
  };
}

test("registers discovered MCP tools with namespaced names", async () => {
  const registry = new MCPToolRegistry();
  const mock = createMockClient(["hello_mcp", "get_status"]);

  const definitions = await registry.registerClient(
    "q4-test",
    mock.client,
  );

  assert.deepEqual(
    definitions.map((tool) => tool.name),
    ["mcp_q4_test_hello_mcp", "mcp_q4_test_get_status"],
  );

  assert.deepEqual(registry.getToolNames(), [
    "mcp_q4_test_hello_mcp",
    "mcp_q4_test_get_status",
  ]);
});

test("routes calls to the original MCP tool name", async () => {
  const registry = new MCPToolRegistry();
  const mock = createMockClient(["hello_mcp"]);

  await registry.registerClient("q4-test", mock.client);

  await registry.callTool("mcp_q4_test_hello_mcp", {
    name: "Sadiq",
  });

  assert.deepEqual(mock.calls, [
    {
      name: "hello_mcp",
      args: { name: "Sadiq" },
    },
  ]);
});

test("rejects calls to unregistered MCP tools", async () => {
  const registry = new MCPToolRegistry();

  await assert.rejects(
    registry.callTool("mcp_unknown_tool", {}),
    /Unknown or unregistered MCP tool/,
  );
});

test("rejects MCP tool name collisions", async () => {
  const registry = new MCPToolRegistry();
  const mock = createMockClient(["hello_mcp"]);

  await registry.registerClient("q4-test", mock.client);

  await assert.rejects(
    registry.registerClient("q4-test", mock.client),
    /collision detected/,
  );
});

test("rejects names that collide after sanitization", async () => {
  const registry = new MCPToolRegistry();
  const mock = createMockClient(["hello-tool", "hello_tool"]);

  await assert.rejects(
    registry.registerClient("q4-test", mock.client),
    /collision detected/,
  );

  // Registration is atomic: no tools from a failed registration remain.
  assert.deepEqual(registry.getToolNames(), []);
});

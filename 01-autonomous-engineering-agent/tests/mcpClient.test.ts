
import { test } from "node:test";
import assert from "node:assert/strict";
import { MCPClient } from "../src/mcp/mcpClient.js";

test("MCP client discovers and calls a local server tool", async () => {
  const client = new MCPClient({
    name: "q4-agent-test-client",
    version: "1.0.0",
    command: process.execPath,
    args: [
      "--import",
      "tsx",
      "src/mcp/testServer.ts",
    ],
    cwd: process.cwd(),
  });

  try {
    await client.connect();

    const result = await client.listTools();

    assert.ok(
      result.tools.some((tool) => tool.name === "hello_mcp"),
      "Expected hello_mcp to be discovered",
    );

    const response = await client.callTool("hello_mcp", {
      name: "Sadiq",
    });

    assert.equal(response.isError, undefined);

    const greeting = response.content.find(
      (item) => item.type === "text",
    );

    assert.ok(greeting && "text" in greeting);
    assert.match(
      greeting.text,
      /Hello, Sadiq! MCP tool execution is working\./,
    );
  } finally {
    await client.close();
  }
});

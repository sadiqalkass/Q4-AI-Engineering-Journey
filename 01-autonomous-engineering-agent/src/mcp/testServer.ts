
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const server = new McpServer({
  name: "q4-mcp-test-server",
  version: "1.0.0",
});

server.registerTool(
  "hello_mcp",
  {
    description: "Return a greeting to verify MCP tool execution.",
    inputSchema: z.object({
      name: z.string().min(1).max(100),
    }),
  },
  async ({ name }) => ({
    content: [
      {
        type: "text",
        text: `Hello, ${name}! MCP tool execution is working.`,
      },
    ],
  }),
);

const transport = new StdioServerTransport();

server.connect(transport).catch((error: unknown) => {
  console.error("MCP test server failed:", error);
  process.exitCode = 1;
});

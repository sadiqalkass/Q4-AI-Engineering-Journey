import "dotenv/config";

import { createLLMAdapter } from "./llm/index.js";
import type { ToolDefinition } from "./llm/types.js";
import { listFiles } from "./tools/listFiles.js";
import { readFile } from "./tools/readFile.js";
import { searchCode } from "./tools/searchCode.js";
import { writeCode } from "./tools/writeCode.js";
import { runAgent } from "./agentRunner.js";
import { MCPClient } from "./mcp/mcpClient.js";
import { MCPToolRegistry } from "./mcp/mcpToolRegistry.js";

const adapter = createLLMAdapter();

const builtInToolDefinitions: ToolDefinition[] = [
  {
    name: "list_files",
    description: "List files and directories inside a specified directory.",
    parameters: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "The directory to inspect. Use '.' for the current project.",
        },
      },
      required: ["directory"],
      additionalProperties: false,
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a specific text file.",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "The path of the file to read.",
        },
      },
      required: ["filePath"],
      additionalProperties: false,
    },
  },
  {
    name: "search_code",
    description:
      "Search project source files for a text query. Returns matching file paths, line numbers, and snippets.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Text or identifier to search for.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  
  {
    name: "write_code",
    description:
      "Create a new file or update an existing project file. Existing files cannot be overwritten unless overwrite is explicitly true. Use only paths inside the project directory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path of the file inside the project.",
        },
        content: {
          type: "string",
          description: "Complete content to write to the file.",
        },
        overwrite: {
          type: "boolean",
          description:
            "Set true only when intentionally replacing an existing file.",
        },
      },
      required: ["path", "content"],
      additionalProperties: false,
    },
  },
];

async function main(): Promise<void> {
  const mcpClient = new MCPClient({
    name: "q4-autonomous-engineering-agent",
    version: "1.0.0",
    command: process.execPath,
    args: ["--import", "tsx", "src/mcp/testServer.ts"],
    cwd: process.cwd(),
  });

  try {
    console.log("Connecting to MCP server...");
    await mcpClient.connect();

    const registry = new MCPToolRegistry();

    const mcpToolDefinitions = await registry.registerClient(
      "q4-test",
      mcpClient,
    );

    const toolDefinitions: ToolDefinition[] = [
      ...builtInToolDefinitions,
      ...mcpToolDefinitions,
    ];

    console.log("MCP connection established.");
    console.log("Discovered MCP tools:", registry.getToolNames());

    const executeTool = async (
      name: string,
      args: Record<string, unknown>,
    ): Promise<unknown> => {
      switch (name) {
        case "list_files":
          return listFiles(String(args.directory ?? "."));

        case "read_file":
          if (typeof args.filePath !== "string" || !args.filePath.trim()) {
            throw new Error("filePath must be a non-empty string.");
          }
          return readFile(args.filePath);

        case "search_code":
          if (typeof args.query !== "string" || !args.query.trim()) {
            throw new Error("query must be a non-empty string.");
          }
          return searchCode(args.query);
          
        case "write_code":
          if (typeof args.path !== "string" || !args.path.trim()) {
            throw new Error("path must be a non-empty string.");
          }

          if (typeof args.content !== "string") {
            throw new Error("content must be a string.");
          }

          if (
            args.overwrite !== undefined &&
            typeof args.overwrite !== "boolean"
          ) {
            throw new Error("overwrite must be a boolean.");
          }

          return writeCode({
            path: args.path,
            content: args.content,
            overwrite: args.overwrite as boolean | undefined,
          });
        default:
          return registry.callTool(name, args);
      }
    };

    await runAgent(
      `Test the integrated agent tools.
      1. Call mcp_q4_test_hello_mcp with name "Sadiq".
      2. Call search_code with query "jwt".
      3. Call search_code again with the exact same arguments.
      4. Explain the MCP result and whether the duplicate search was skipped.`,
      adapter,
      toolDefinitions,
      executeTool,
    );
  } finally {
    await mcpClient.close();
    console.log("MCP connection closed.");
  }
}

main().catch((error: unknown) => {
  console.error("\nAgent failed:");
  console.error(
    error instanceof Error ? error.message : "Unexpected agent error.",
  );
  process.exitCode = 1;
});

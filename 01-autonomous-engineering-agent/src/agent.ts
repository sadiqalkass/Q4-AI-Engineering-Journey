import "dotenv/config";

import { createLLMAdapter } from "./llm/index.js";
import { ToolDefinition } from "./llm/types.js";
import { listFiles } from "./tools/listFiles.js";
import { readFile } from "./tools/readFile.js";
import { searchCode } from "./tools/searchCode.js";

const adapter = createLLMAdapter();

const toolDefinitions: ToolDefinition[] = [
  {
    name: "list_files",
    description:
      "List files and directories inside a specified directory.",
    parameters: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description:
            "The directory to inspect. Use '.' for the current project.",
        },
      },
      required: ["directory"],
      additionalProperties: false,
    },
  },
  {
  name: "read_file",
  description:
    "Read the contents of a specific text file.",
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
];

async function executeTool(
  name: string,
  args: Record<string, unknown>
) {
  switch (name) {
    case "list_files":
      return listFiles(String(args.directory ?? "."));

    case "read_file":
      return readFile(String(args.filePath));

    case "search_code":
      return searchCode(String(args.query ?? ""));

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}


function getToolCallKey(
  name: string,
  args: Record<string, unknown>
): string {
  const normalizedArgs = Object.fromEntries(
    Object.entries(args).sort(([a], [b]) => a.localeCompare(b))
  );

  return `${name}:${JSON.stringify(normalizedArgs)}`;
}

async function runAgent(task: string) {
  let input: unknown = task;

  const maxIterations = 8;
  const seenToolCalls = new Set<string>();

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    console.log(`\n--- Agent iteration ${iteration + 1} ---`);

    const response = await adapter.generate(
      input,
      toolDefinitions
    );

    if (response.toolCalls.length === 0) {
      console.log("\nAgent:\n");
      console.log(response.text);
      return;
    }

    const functionResults = [];

    for (const toolCall of response.toolCalls) {
      console.log("\nTool call:");
      console.log(toolCall.name);
      console.log(toolCall.arguments);

      const callKey = getToolCallKey(
        toolCall.name,
        toolCall.arguments
      );

      let result: unknown;

      if (seenToolCalls.has(callKey)) {
        console.warn(
          "\nDuplicate tool call detected. Skipping execution."
        );

        result = {
          error: "Duplicate tool call detected. This exact tool call has already been executed.",
          suggestion:
            "Use the previous results, inspect a different file, or try a different search query."
        };
      } else {
        seenToolCalls.add(callKey);

       
let result: unknown;

try {
  result = await executeTool(
    toolCall.name,
    toolCall.arguments
  );
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "An unexpected tool error occurred.";

  console.error(`Tool "${toolCall.name}" failed:`, message);

  result = {
    error: message,
    tool: toolCall.name,
    suggestion:
      "Review the error, correct the arguments or path if necessary, and try a different approach.",
  };
}

      }

      console.log("\nTool result:");
      console.log(result);

      functionResults.push({
        type: "function_result",
        name: toolCall.name,
        call_id: toolCall.id,
        result: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      });
    }

    input = functionResults;
  }

  throw new Error(
    "Agent stopped because maximum iterations were reached."
  );
}



runAgent(
  `This is a test of duplicate tool-call detection.

  1. Call search_code with query "jwt".
  2. Call search_code again with the exact same arguments.
  3. Do not call any other tools.
  4. After receiving the results, explain whether the duplicate call was skipped.`
).catch((error) => {
  console.error("\nAgent failed:");
  console.error(error);
});

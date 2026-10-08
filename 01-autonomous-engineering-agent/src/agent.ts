import "dotenv/config";

import { createLLMAdapter } from "./llm/index.js";
import { ToolDefinition } from "./llm/types.js";
import { listFiles } from "./tools/listFiles.js";
import { readFile } from "./tools/readFile.js";

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

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
async function runAgent(task: string) {
  let input: unknown = task;

  const maxIterations = 5;

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

      const result = await executeTool(
        toolCall.name,
        toolCall.arguments
      );

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
  "Inspect the current project. Find the package.json file, read it, and tell me what dependencies are installed."
).catch((error) => {
  console.error("\nAgent failed:");
  console.error(error);
});
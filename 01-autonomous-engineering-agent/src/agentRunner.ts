
import {
  LLMAdapter,
  ToolCall,
  ToolDefinition,
} from "./llm/types.js";
import { AgentMemory } from "./memory/agentMemory.js";

type ToolExecutor = (
  name: ToolCall["name"],
  args: Record<string, unknown>
) => Promise<unknown>;

export interface AgentRunResult {
  completed: boolean;
  finalText: string | null;
  iterations: number;
  toolCallsExecuted: number;
  duplicateCallsSkipped: number;
  toolErrors: number;
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

export async function runAgent(
  task: string,
  adapter: LLMAdapter,
  toolDefinitions: ToolDefinition[],
  executeTool: ToolExecutor,
  maxIterations = 8
): Promise<AgentRunResult> {
  let input: unknown = task;
  let providerState: unknown;

  const memory = new AgentMemory();

  let toolCallsExecuted = 0;
  let duplicateCallsSkipped = 0;
  let toolErrors = 0;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    console.log(`\n--- Agent iteration ${iteration + 1} ---`);

    const response = await adapter.generate(
      input,
      toolDefinitions,
      providerState
    );

    providerState = response.providerState;

    if (response.toolCalls.length === 0) {
      console.log("\nAgent:\n");
      console.log(response.text);

      return {
        completed: true,
        finalText: response.text,
        iterations: iteration + 1,
        toolCallsExecuted,
        duplicateCallsSkipped,
        toolErrors,
      };
    }

    const functionResults: unknown[] = [];

    for (const toolCall of response.toolCalls) {
      console.log("\nTool call:");
      console.log(toolCall.name);
      console.log(toolCall.arguments);

      const callKey = getToolCallKey(
        toolCall.name,
        toolCall.arguments
      );

      let result: unknown;

     
const previousResult = memory.get(callKey);

if (previousResult) {
  duplicateCallsSkipped++;

  console.log(
    "\nDuplicate tool call detected. Reusing remembered result."
  );

  result = previousResult.result;
} else {
  toolCallsExecuted++;

  try {
    result = await executeTool(
      toolCall.name,
      toolCall.arguments
    );
  } catch (error) {
    toolErrors++;

    const message =
      error instanceof Error
        ? error.message
        : "An unexpected tool error occurred.";

    console.error(
      `Tool "${toolCall.name}" failed:`,
      message
    );

    result = {
      error: message,
      tool: toolCall.name,
      suggestion:
        "Review the error and try a different approach.",
    };
  }

  memory.remember(callKey, {
    toolName: toolCall.name,
    result,
  });
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

  console.warn(
    `Agent reached its maximum of ${maxIterations} iterations.`
  );

  return {
    completed: false,
    finalText: null,
    iterations: maxIterations,
    toolCallsExecuted,
    duplicateCallsSkipped,
    toolErrors,
  };
}

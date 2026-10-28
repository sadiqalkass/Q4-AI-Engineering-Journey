
import "dotenv/config";
import Groq from "groq-sdk";

import type {
  LLMAdapter,
  LLMResponse,
  ToolDefinition,
} from "./types.js";

export class GroqAdapter implements LLMAdapter {
  private readonly client: Groq;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Missing GROQ_API_KEY. Add it to your environment configuration.",
      );
    }

    this.client = new Groq({ apiKey });
    this.model =
      process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";
  }

  async generate(
    input: unknown,
    tools: ToolDefinition[],
    _providerState?: unknown,
  ): Promise<LLMResponse> {
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: "user",
        content:
          typeof input === "string"
            ? input
            : JSON.stringify(input),
      },
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...(tools.length > 0
        ? {
            tools: tools.map((tool) => ({
              type: "function" as const,
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),
            tool_choice: "auto" as const,
          }
        : {}),
    });

    const message = response.choices[0]?.message;

    if (!message) {
      throw new Error("Groq returned an empty response.");
    }

    return {
      text: message.content ?? "",
      toolCalls: (message.tool_calls ?? []).map((call) => {
        if (call.type !== "function") {
          throw new Error("Groq returned an unsupported tool call.");
        }

        let args: unknown;

        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          throw new Error(
            `Groq returned invalid JSON arguments for tool "${call.function.name}".`,
          );
        }

        if (
          typeof args !== "object" ||
          args === null ||
          Array.isArray(args)
        ) {
          throw new Error(
            `Groq returned non-object arguments for tool "${call.function.name}".`,
          );
        }

        return {
          id: call.id,
          name: call.function.name,
          arguments: args as Record<string, unknown>,
        };
      }),
    };
  }
}

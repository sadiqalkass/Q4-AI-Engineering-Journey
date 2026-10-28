import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

import {
  LLMAdapter,
  LLMResponse,
  ToolDefinition,
  ToolName,
} from "./types.js";

interface GeminiProviderState {
  interactionId?: string;
}

const supportedTools = new Set<ToolName>([
  "list_files",
  "read_file",
  "search_code",
]);

function isToolName(name: string): name is ToolName {
  return supportedTools.has(name as ToolName);
}

export class GeminiAdapter implements LLMAdapter {
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Missing GEMINI_API_KEY. Add it to your environment configuration."
      );
    }

    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(
    input: unknown,
    tools: ToolDefinition[],
    providerState?: unknown
  ): Promise<LLMResponse> {
    const functionTools = tools.map((tool) => ({
      type: "function" as const,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    const state = providerState as
      | GeminiProviderState
      | undefined;

    const request: Record<string, unknown> = {
      model: "gemini-3.6-flash",
      tools: functionTools,
      input,
    };

    if (state?.interactionId) {
      request.previous_interaction_id = state.interactionId;
    }

    let response;

    try {
      response = await this.client.interactions.create(
        request as any
      );
    } catch (error) {
      const apiError = error as {
        status?: number;
        statusCode?: number;
        headers?: { get?: (name: string) => string | null };
        message?: string;
      };

      const status = apiError.status ?? apiError.statusCode;

      if (status === 429) {
        const retryAfter =
          apiError.headers?.get?.("retry-after");

        throw new Error(
          `Gemini API quota or rate limit reached. ${
            retryAfter
              ? `Retry after ${retryAfter} seconds, if the quota permits.`
              : "Check your project's model quota before retrying."
          }`
        );
      }

      throw new Error(
        `Gemini request failed${
          status ? ` (HTTP ${status})` : ""
        }: ${apiError.message ?? "Unknown provider error"}`
      );
    }

    const toolCalls: LLMResponse["toolCalls"] = [];

    for (const step of response.steps) {
      if (step.type !== "function_call") {
        continue;
      }

      if (!isToolName(step.name)) {
        throw new Error(
          `Gemini returned an unsupported tool name: ${step.name}`
        );
      }

      toolCalls.push({
        id: step.id,
        name: step.name,
        arguments:
          step.arguments as Record<string, unknown>,
      });
    }

    return {
      text: response.output_text ?? "",
      toolCalls,
      providerState: {
        interactionId: response.id,
      } satisfies GeminiProviderState,
    };
  }
}

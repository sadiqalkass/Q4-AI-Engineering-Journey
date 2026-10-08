import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

import {
  LLMAdapter,
  LLMResponse,
  ToolDefinition,
} from "./types.js";

export class GeminiAdapter implements LLMAdapter {
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async generate(
    input: unknown,
    tools: ToolDefinition[]
  ): Promise<LLMResponse> {
    const functionTools = tools.map((tool) => ({
      type: "function" as const,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    const response = await this.client.interactions.create({
      model: "gemini-3.8-flash",
      input,
      tools: functionTools,
      store: false,
    });

    const toolCalls: LLMResponse["toolCalls"] = [];

    for (const step of response.steps) {
      if (step.type === "function_call") {
        toolCalls.push({
          id: step.id,
          name: step.name,
          arguments: step.arguments as Record<string, unknown>,
        });
      }
    }

    return {
      text: response.output_text,
      toolCalls,
      providerState: response.steps,
    };
  }
}
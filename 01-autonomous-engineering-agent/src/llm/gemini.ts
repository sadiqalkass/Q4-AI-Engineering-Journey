import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

import {
  LLMAdapter,
  LLMResponse,
  ToolDefinition,
} from "./types.js";

export class GeminiAdapter implements LLMAdapter {
  private client: GoogleGenAI;
  private previousInteractionId?: string;

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

    const request: Record<string, unknown> = {
      model: "gemini-3.8-flash",
      tools: functionTools,
      input,
    };

    // Continue the existing Gemini interaction when available.
    if (this.previousInteractionId) {
      request.previous_interaction_id =
        this.previousInteractionId;
    }
    
    const response =
      await this.client.interactions.create(request as any);

    // Save this interaction so the next tool result
    // can continue from the correct Gemini state.
    this.previousInteractionId = response.id;

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
      providerState: {
        interactionId: response.id,
        steps: response.steps,
      },
    };
  }
}
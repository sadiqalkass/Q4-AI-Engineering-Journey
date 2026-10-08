import { GeminiAdapter } from "./gemini.js";
import { LLMAdapter } from "./types.js";

export function createLLMAdapter(): LLMAdapter {
  const provider = process.env.LLM_PROVIDER ?? "gemini";

  switch (provider) {
    case "gemini":
      return new GeminiAdapter();

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
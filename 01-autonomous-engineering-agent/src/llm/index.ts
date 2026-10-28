import { GeminiAdapter } from "./gemini.js";
import { GroqAdapter } from "./groq.js";
import { MockAdapter } from "./mock.js";
import type { LLMAdapter } from "./types.js";

export function createLLMAdapter(): LLMAdapter {
  const provider = (
    process.env.LLM_PROVIDER ?? "gemini"
  ).trim().toLowerCase();

  switch (provider) {
    case "gemini":
      return new GeminiAdapter();

    case "groq":
      return new GroqAdapter();

    case "mock":
      return new MockAdapter();

    default:
      throw new Error(
        `Unsupported LLM_PROVIDER "${provider}". ` +
          "Supported providers: gemini, groq, mock.",
      );
  }
}

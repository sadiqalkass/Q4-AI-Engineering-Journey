
import { GeminiAdapter } from "./gemini.js";
import { MockAdapter } from "./mock.js";
import { LLMAdapter } from "./types.js";

export function createLLMAdapter(): LLMAdapter {
  const provider = (
    process.env.LLM_PROVIDER ?? "gemini"
  ).trim().toLowerCase();

  switch (provider) {
    case "gemini":
      return new GeminiAdapter();

    case "mock":
      return new MockAdapter();

    default:
      throw new Error(
        `Unsupported LLM_PROVIDER "${provider}". ` +
          "Supported providers: gemini, mock."
      );
  }
}

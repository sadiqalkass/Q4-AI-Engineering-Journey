
import {
  LLMAdapter,
  LLMResponse,
  ToolDefinition,
} from "./types.js";

interface MockProviderState {
  step?: number;
}

export class MockAdapter implements LLMAdapter {
  async generate(
    _input: unknown,
    _tools: ToolDefinition[],
    providerState?: unknown
  ): Promise<LLMResponse> {
    const state = providerState as MockProviderState | undefined;
    const step = state?.step ?? 0;

    // First response: request a search.
    if (step === 0) {
      return {
        text: "",
        toolCalls: [
          {
            id: "mock-call-1",
            name: "search_code",
            arguments: { query: "jwt" },
          },
        ],
        providerState: { step: 1 },
      };
    }

    // Second response: intentionally repeat the same call.
    if (step === 1) {
      return {
        text: "",
        toolCalls: [
          {
            id: "mock-call-2",
            name: "search_code",
            arguments: { query: "jwt" },
          },
        ],
        providerState: { step: 2 },
      };
    }

    // Third response: finish without calling another tool.
    return {
      text:
        "Mock test completed. The agent should have executed " +
        "the first search and skipped the duplicate call.",
      toolCalls: [],
      providerState: { step: 3 },
    };
  }
}


export type ToolName = string;

export interface ToolCall {
  id: string;
  name: ToolName;
  arguments: Record<string, unknown>;
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMResponse {
  text: string;
  toolCalls: ToolCall[];
  providerState?: unknown;
}

export interface LLMAdapter {
  generate(
    input: unknown,
    tools: ToolDefinition[],
    providerState?: unknown
  ): Promise<LLMResponse>;
}

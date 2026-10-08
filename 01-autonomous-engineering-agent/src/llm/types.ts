export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type LLMResponse = {
  text?: string;
  toolCalls: ToolCall[];
  providerState?: unknown;
};

export interface LLMAdapter {
  generate(
    input: unknown,
    tools: ToolDefinition[]
  ): Promise<LLMResponse>;
}

export type ToolName = "list_files";

export interface ToolCall {
  name: ToolName;
  arguments: Record<string, unknown>;
}

import type { ToolDefinition } from "../llm/types.js";
import type { MCPClient } from "./mcpClient.js";

interface RegisteredMCPTool {
  client: MCPClient;
  originalName: string;
}

function toSafeSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/-+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");

  if (!slug) {
    throw new Error("MCP server and tool names must contain usable characters.");
  }

  return slug;
}

export class MCPToolRegistry {
  private readonly registered = new Map<string, RegisteredMCPTool>();
  private readonly reservedNames: Set<string>;

  constructor(reservedNames: string[] = [
    "list_files",
    "read_file",
    "search_code",
  ]) {
    this.reservedNames = new Set(reservedNames);
  }

  async registerClient(
    serverId: string,
    client: MCPClient,
  ): Promise<ToolDefinition[]> {
    const serverSlug = toSafeSlug(serverId);
    const { tools } = await client.listTools();

    const pending: Array<{
      exposedName: string;
      originalName: string;
      definition: ToolDefinition;
    }> = [];

    for (const tool of tools) {
      const toolSlug = toSafeSlug(tool.name);
      const exposedName = `mcp_${serverSlug}_${toolSlug}`;

      if (exposedName.length > 64) {
        throw new Error(
          `Exposed MCP tool name exceeds 64 characters: ${exposedName}`,
        );
      }

      if (
        this.reservedNames.has(exposedName) ||
        this.registered.has(exposedName) ||
        pending.some((item) => item.exposedName === exposedName)
      ) {
        throw new Error(
          `MCP tool name collision detected: ${exposedName}`,
        );
      }

      pending.push({
        exposedName,
        originalName: tool.name,
        definition: {
          name: exposedName,
          description: `[MCP: ${serverId}] ${tool.description ?? tool.name}`,
          parameters: tool.inputSchema as Record<string, unknown>,
        },
      });
    }

    // Register only after every tool name has passed validation.
    for (const item of pending) {
      this.registered.set(item.exposedName, {
        client,
        originalName: item.originalName,
      });
    }

    return pending.map((item) => item.definition);
  }

  async callTool(
    exposedName: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const registeredTool = this.registered.get(exposedName);

    if (!registeredTool) {
      throw new Error(`Unknown or unregistered MCP tool: ${exposedName}`);
    }

    return registeredTool.client.callTool(
      registeredTool.originalName,
      args,
    );
  }

  getToolNames(): string[] {
    return [...this.registered.keys()];
  }
}

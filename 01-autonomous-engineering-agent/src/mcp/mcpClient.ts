
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

export interface MCPClientOptions {
  name: string;
  version: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export class MCPClient {
  private readonly client: Client;
  private readonly transport: StdioClientTransport;
  private connected = false;

  constructor(options: MCPClientOptions) {
    this.client = new Client({
      name: options.name,
      version: options.version,
    });

    this.transport = new StdioClientTransport({
      command: options.command,
      args: options.args ?? [],
      env: options.env,
      cwd: options.cwd,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    await this.client.connect(this.transport);
    this.connected = true;
  }

  async listTools() {
    if (!this.connected) {
      throw new Error("MCP client is not connected.");
    }

    return this.client.listTools();
  }

  async callTool(
    name: string,
    args: Record<string, unknown> = {},
  ) {
    if (!this.connected) {
      throw new Error("MCP client is not connected.");
    }

    if (!name.trim()) {
      throw new Error("MCP tool name cannot be empty.");
    }

    return this.client.callTool({
      name,
      arguments: args,
    });
  }

  async close(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.client.close();
    } finally {
      this.connected = false;
    }
  }
}

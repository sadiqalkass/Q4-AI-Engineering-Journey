
export interface MemoryRecord {
  toolName: string;
  result: unknown;
}

export class AgentMemory {
  private readonly records = new Map<string, MemoryRecord>();

  get(key: string): MemoryRecord | undefined {
    return this.records.get(key);
  }

  remember(key: string, record: MemoryRecord): void {
    this.records.set(key, record);
  }

  has(key: string): boolean {
    return this.records.has(key);
  }

  get size(): number {
    return this.records.size;
  }

  clear(): void {
    this.records.clear();
  }
}

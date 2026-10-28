import type { LLMAdapter } from "../llm/types.js";
import type {
  PlanResult,
  ResearcherAgent,
  ResearchResult,
} from "./types.js";

export class LLMResearcherAgent implements ResearcherAgent {
  constructor(private readonly adapter: LLMAdapter) {}

  async run(task: string, plan: PlanResult): Promise<ResearchResult> {
    if (!task.trim()) {
      throw new Error("Researcher task cannot be empty.");
    }

    if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
      throw new Error("Researcher requires a non-empty plan.");
    }

    const prompt = `
You are the Researcher agent in an autonomous software engineering system.

Analyze the task and implementation plan. Identify relevant technical considerations,
dependencies, risks, edge cases, and useful implementation guidance.

Do not claim to have inspected files, executed commands, or verified facts that
were not provided to you. Clearly identify uncertainty.

Return only your research findings as plain text. Do not use tool calls.

Task:
${JSON.stringify(task)}

Implementation plan:
${JSON.stringify(plan.steps)}
`.trim();

    const response = await this.adapter.generate(prompt, []);

    if (response.toolCalls.length > 0) {
      throw new Error("Researcher returned unexpected tool calls.");
    }

    const findings = response.text.trim();

    if (!findings) {
      throw new Error("Researcher returned empty findings.");
    }

    return { findings };
  }
}

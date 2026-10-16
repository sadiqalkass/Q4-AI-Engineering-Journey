
import type { LLMAdapter } from "../llm/types.js";
import type {
  PlannerAgent,
  PlanResult,
} from "./types.js";

export class LLMPlannerAgent implements PlannerAgent {
  constructor(
    private readonly adapter: LLMAdapter
  ) {}

  async run(task: string): Promise<PlanResult> {
    if (!task.trim()) {
      throw new Error("Planner task cannot be empty.");
    }

    const prompt = `
You are the Planner agent in an autonomous software
engineering system.

Analyze the user's task and break it into a practical,
ordered sequence of implementation steps.

Rules:
- Focus on the requested task.
- Make each step concrete and actionable.
- Do not claim to have executed any step.
- Return only valid JSON, without Markdown fences.
- Use exactly this JSON structure:
  {"steps":["First step","Second step"]}

User task:
${JSON.stringify(task)}
`.trim();

    const response = await this.adapter.generate(
      prompt,
      []
    );

    if (response.toolCalls.length > 0) {
      throw new Error(
        "Planner returned unexpected tool calls."
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(response.text);
    } catch {
      throw new Error(
        "Planner returned invalid JSON."
      );
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("steps" in parsed) ||
      !Array.isArray(parsed.steps) ||
      parsed.steps.length === 0 ||
      !parsed.steps.every(
        (step: unknown) =>
          typeof step === "string" &&
          step.trim().length > 0
      )
    ) {
      throw new Error(
        "Planner response must contain a non-empty array of steps."
      );
    }

    return {
      steps: parsed.steps.map(
        (step: string) => step.trim()
      ),
    };
  }
}

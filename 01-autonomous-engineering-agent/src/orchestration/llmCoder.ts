
import type { LLMAdapter } from "../llm/types.js";
import type {
  CoderAgent,
  CodingResult,
  PlanResult,
  ResearchResult,
  RevisionContext,
} from "./types.js";

export class LLMCoderAgent implements CoderAgent {
  constructor(private readonly adapter: LLMAdapter) {}

  async run(
    task: string,
    plan: PlanResult,
    research: ResearchResult,
    revision?: RevisionContext,
  ): Promise<CodingResult> {
    if (!task.trim()) {
      throw new Error("Coder task cannot be empty.");
    }

    if (!plan.steps.length) {
      throw new Error("Coder requires a non-empty plan.");
    }

    if (!research.findings.trim()) {
      throw new Error("Coder requires research findings.");
    }

    const prompt = `
You are the Coder agent in an autonomous software engineering system.

Return ONLY valid JSON, without Markdown fences, using this structure:
{
  "proposal": "Explain the implementation",
  "changes": [
    {
      "path": "src/example.ts",
      "content": "Complete file content",
      "overwrite": false
    }
  ]
}

Rules:
- Every change must contain a project-relative file path and complete file content.
- Do not use absolute paths or paths containing traversal outside the project.
- Do not include Markdown fences around file content.
- Set overwrite to false for new files.
- Never set overwrite to true. Existing-file replacement requires separate authorization.
- Include an empty changes array if no file changes are needed.
- The proposal must explain the intended changes.
- Do not claim that files have already been modified or tests have run.

Task:
${JSON.stringify(task)}

Plan:
${JSON.stringify(plan.steps)}

Research:
${JSON.stringify(research.findings)}

${revision ? `
Revision attempt: ${revision.attempt}
Previous proposal:
${JSON.stringify(revision.previousProposal)}

Reviewer feedback:
${JSON.stringify(revision.feedback)}

Issues to address:
${JSON.stringify(revision.issues)}

Revise the proposal and its file changes to address the review issues.
` : "This is the initial proposal."}
`.trim();

    const response = await this.adapter.generate(prompt, []);

    if (response.toolCalls.length > 0) {
      throw new Error("Coder returned unexpected tool calls.");
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(response.text);
    } catch {
      throw new Error("Coder returned invalid JSON.");
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("proposal" in parsed) ||
      typeof parsed.proposal !== "string"
) {
  throw new Error("Coder returned an invalid coding structure.");
}

if (!parsed.proposal.trim()) {
  throw new Error("Coder returned an empty proposal.");
}

if (!("changes" in parsed) || !Array.isArray(parsed.changes)) {
  throw new Error("Coder returned an invalid coding structure.");
}

    for (const change of parsed.changes) {
      if (
        typeof change !== "object" ||
        change === null ||
        !("path" in change) ||
        typeof change.path !== "string" ||
        !change.path.trim() ||
        !("content" in change) ||
        typeof change.content !== "string" ||
        ("overwrite" in change && change.overwrite !== false)
      ) {
        throw new Error(
          "Coder returned an invalid or unauthorized file change.",
        );
      }
    }

    return {
      proposal: parsed.proposal.trim(),
      changes: parsed.changes.map((change) => ({
        path: change.path,
        content: change.content,
        overwrite: false,
      })),
    };
  }
}

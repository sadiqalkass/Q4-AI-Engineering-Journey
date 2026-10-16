
import type {
  CoderAgent,
  OrchestrationResult,
  PlannerAgent,
  ResearcherAgent,
  ReviewerAgent,
  RevisionContext,
} from "./types.js";

export interface OrchestratorDependencies {
  planner: PlannerAgent;
  researcher: ResearcherAgent;
  coder: CoderAgent;
  reviewer: ReviewerAgent;
  maxRevisions?: number;
}

export class Orchestrator {
  private readonly maxRevisions: number;

  constructor(
    private readonly agents: OrchestratorDependencies
  ) {
    this.maxRevisions = agents.maxRevisions ?? 2;

    if (
      !Number.isInteger(this.maxRevisions) ||
      this.maxRevisions < 0
    ) {
      throw new Error(
        "maxRevisions must be a non-negative integer."
      );
    }
  }

  async run(task: string): Promise<OrchestrationResult> {
    if (!task.trim()) {
      throw new Error("Task cannot be empty.");
    }

    const plan = await this.agents.planner.run(task);

    if (plan.steps.length === 0) {
      throw new Error("Planner returned an empty plan.");
    }

    const research = await this.agents.researcher.run(
      task,
      plan
    );

    let coding = await this.agents.coder.run(
      task,
      plan,
      research
    );

    let review = await this.agents.reviewer.run(
      task,
      plan,
      research,
      coding
    );

    let revisionCount = 0;

    while (
      !review.approved &&
      revisionCount < this.maxRevisions
    ) {
      revisionCount++;

      const revision: RevisionContext = {
        previousProposal: coding.proposal,
        feedback: review.feedback,
        issues: [...review.issues],
        attempt: revisionCount,
      };

      coding = await this.agents.coder.run(
        task,
        plan,
        research,
        revision
      );

      review = await this.agents.reviewer.run(
        task,
        plan,
        research,
        coding
      );
    }

    return {
      task,
      plan,
      research,
      coding,
      review,
      revisionCount,
    };
  }
}

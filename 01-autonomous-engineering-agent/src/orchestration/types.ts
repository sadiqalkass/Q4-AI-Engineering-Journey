
export interface PlanResult {
  steps: string[];
}

export interface ResearchResult {
  findings: string;
}

export interface CodeChange {
  path: string;
  content: string;
  overwrite?: boolean;
}

export interface CodingResult {
  proposal: string;
  changes?: CodeChange[];
}


export interface RevisionContext {
  previousProposal: string;
  feedback: string;
  issues: string[];
  attempt: number;
}

export interface ReviewResult {
  approved: boolean;
  feedback: string;
  issues: string[];
}

export interface PlannerAgent {
  run(task: string): Promise<PlanResult>;
}

export interface ResearcherAgent {
  run(
    task: string,
    plan: PlanResult
  ): Promise<ResearchResult>;
}

export interface CoderAgent {
  run(
    task: string,
    plan: PlanResult,
    research: ResearchResult,
    revision?: RevisionContext
  ): Promise<CodingResult>;
}

export interface ReviewerAgent {
  run(
    task: string,
    plan: PlanResult,
    research: ResearchResult,
    coding: CodingResult
  ): Promise<ReviewResult>;
}

export interface OrchestrationResult {
  task: string;
  plan: PlanResult;
  research: ResearchResult;
  coding: CodingResult;
  review: ReviewResult;
  revisionCount: number;
}

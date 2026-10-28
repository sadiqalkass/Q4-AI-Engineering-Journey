import "dotenv/config";

import { createLLMAdapter } from "../llm/index.js";
import { LLMPlannerAgent } from "./llmPlanner.js";
import { LLMResearcherAgent } from "./llmResearcher.js";
import { LLMCoderAgent } from "./llmCoder.js";
import { LLMReviewerAgent } from "./llmReviewer.js";
import { Orchestrator } from "./orchestrator.js";

async function main(): Promise<void> {
  const adapter = createLLMAdapter();

  const orchestrator = new Orchestrator({
    planner: new LLMPlannerAgent(adapter),
    researcher: new LLMResearcherAgent(adapter),
    coder: new LLMCoderAgent(adapter),
    reviewer: new LLMReviewerAgent(adapter),

    // Keep the first live run short.
    maxRevisions: 1,

    // Dry run only: never write generated files.
    applyChanges: async (changes) => {
      console.log("\nDRY RUN: No files will be written.");
      console.log(
        "Proposed file paths:",
        changes.map((change) => change.path),
      );

      return { dryRun: true, count: changes.length };
    },
  });

  const task =
    process.argv.slice(2).join(" ").trim() ||
    "Create a new file named USAGE.md containing a concise usage guide. Do not modify any existing files.";

  const result = await orchestrator.run(task);

  console.log("\n=== ORCHESTRATION RESULT ===");
  console.log("Task:", result.task);
  console.log("\nPlan:");
  console.log(JSON.stringify(result.plan, null, 2));
  console.log("\nResearch:");
  console.log(result.research.findings);
  console.log("\nCoding proposal:");
  console.log(result.coding.proposal);
  console.log("\nReview:");
  console.log(JSON.stringify(result.review, null, 2));
  console.log("\nRevisions:", result.revisionCount);
  console.log("Approved:", result.review.approved);
}

main().catch((error: unknown) => {
  console.error("Orchestration failed:", error);
  process.exitCode = 1;
});

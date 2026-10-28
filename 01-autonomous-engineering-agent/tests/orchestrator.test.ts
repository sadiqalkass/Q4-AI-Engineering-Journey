
import test from "node:test";
import assert from "node:assert/strict";

import { Orchestrator } from "../src/orchestration/orchestrator.js";
import type {
  OrchestratorDependencies,
} from "../src/orchestration/orchestrator.js";

function createAgents(
  events: string[]
): OrchestratorDependencies {
  return {
    planner: {
      async run(task) {
        events.push("planner");

        assert.equal(task, "Add input validation");

        return {
          steps: [
            "Inspect existing validation",
            "Propose the change",
            "Review the result",
          ],
        };
      },
    },

    researcher: {
      async run(task, plan) {
        events.push("researcher");

        assert.equal(task, "Add input validation");
        assert.equal(plan.steps.length, 3);

        return {
          findings: "Validation currently is missing.",
        };
      },
    },

    coder: {
      async run(task, plan, research) {
        events.push("coder");

        assert.equal(plan.steps.length, 3);
        assert.match(research.findings, /missing/);

        return {
          proposal: "Validate input before processing.",
        };
      },
    },

    reviewer: {
      async run(task, plan, research, coding) {
        events.push("reviewer");

        assert.equal(task, "Add input validation");
        assert.ok(plan.steps.length > 0);
        assert.ok(research.findings.length > 0);
        assert.ok(coding.proposal.length > 0);

        return {
          approved: true,
          feedback: "The proposal looks good.",
          issues: [],
        };
      },
    },
  };
}

test("runs agents in the correct order", async () => {
  const events: string[] = [];
  const orchestrator = new Orchestrator(
    createAgents(events)
  );

  const result = await orchestrator.run(
    "Add input validation"
  );

  assert.deepEqual(events, [
    "planner",
    "researcher",
    "coder",
    "reviewer",
  ]);

  assert.equal(result.review.approved, true);
  assert.equal(
    result.coding.proposal,
    "Validate input before processing."
  );
});

test("rejects an empty task", async () => {
  const orchestrator = new Orchestrator(
    createAgents([])
  );

  await assert.rejects(
    () => orchestrator.run("   "),
    /Task cannot be empty/
  );
});

test("rejects an empty plan", async () => {
  const events: string[] = [];
  const agents = createAgents(events);

  agents.planner = {
    async run() {
      events.push("planner");

      return { steps: [] };
    },
  };

  const orchestrator = new Orchestrator(agents);

  await assert.rejects(
    () => orchestrator.run("Add input validation"),
    /empty plan/
  );

  assert.deepEqual(events, ["planner"]);
});

test("preserves a rejected review in the result", async () => {
  const events: string[] = [];
  const agents = createAgents(events);

  agents.reviewer = {
    async run() {
      events.push("reviewer");

      return {
        approved: false,
        feedback: "More tests are needed.",
        issues: ["Missing edge-case coverage"],
      };
    },
  };

  const orchestrator = new Orchestrator(agents);
  const result = await orchestrator.run(
    "Add input validation"
  );

  assert.equal(result.review.approved, false);
  assert.match(result.review.feedback, /tests/);
  assert.deepEqual(result.review.issues, [
    "Missing edge-case coverage",
  ]);
});

test("revises a rejected proposal and gets approval", async () => {
  const events: string[] = [];
  const agents = createAgents(events);
  let coderCalls = 0;
  let reviewerCalls = 0;

  agents.coder = {
    async run(task, plan, research, revision) {
      coderCalls++;

      if (!revision) {
        return { proposal: "Initial proposal" };
      }

      assert.equal(
        revision.previousProposal,
        "Initial proposal"
      );
      assert.match(revision.feedback, /validation/);
      assert.deepEqual(revision.issues, [
        "Missing edge-case handling",
      ]);
      assert.equal(revision.attempt, 1);

      return { proposal: "Revised proposal" };
    },
  };

  agents.reviewer = {
    async run(task, plan, research, coding) {
      reviewerCalls++;

      if (reviewerCalls === 1) {
        return {
          approved: false,
          feedback: "Improve input validation.",
          issues: ["Missing edge-case handling"],
        };
      }

      assert.equal(coding.proposal, "Revised proposal");

      return {
        approved: true,
        feedback: "Revision accepted.",
        issues: [],
      };
    },
  };

  const result = await new Orchestrator(agents).run(
    "Add input validation"
  );

  assert.equal(coderCalls, 2);
  assert.equal(reviewerCalls, 2);
  assert.equal(result.revisionCount, 1);
  assert.equal(result.review.approved, true);
  assert.equal(result.coding.proposal, "Revised proposal");
});

test("stops when the revision limit is reached", async () => {
  const agents = createAgents([]);
  let coderCalls = 0;
  let reviewerCalls = 0;

  agents.maxRevisions = 1;

  agents.coder = {
    async run(task, plan, research, revision) {
      coderCalls++;

      if (revision) {
        assert.equal(revision.attempt, 1);
      }

      return {
        proposal: `Proposal ${coderCalls}`,
      };
    },
  };

  agents.reviewer = {
    async run() {
      reviewerCalls++;

      return {
        approved: false,
        feedback: "Further improvements are required.",
        issues: ["Unresolved issue"],
      };
    },
  };

  const result = await new Orchestrator(agents).run(
    "Add input validation"
  );

  assert.equal(coderCalls, 2);
  assert.equal(reviewerCalls, 2);
  assert.equal(result.revisionCount, 1);
  assert.equal(result.review.approved, false);
  assert.deepEqual(result.review.issues, [
    "Unresolved issue",
  ]);
});


test("rejects an invalid revision limit", () => {
  const agents = createAgents([]);

  agents.maxRevisions = -1;

  assert.throws(
    () => new Orchestrator(agents),
    /non-negative integer/
  );
});

test("propagates planner errors and stops orchestration", async () => {
  const events: string[] = [];
  const agents = createAgents(events);

  agents.planner = {
    async run() {
      events.push("planner");
      throw new Error("Planner service unavailable.");
    },
  };

  const orchestrator = new Orchestrator(agents);

  await assert.rejects(
    () => orchestrator.run("Add input validation"),
    /Planner service unavailable/
  );

  assert.deepEqual(events, ["planner"]);
});

test("applies changes only after the reviewer approves", async () => {
  const events: string[] = [];
  const agents = createAgents(events);

  agents.coder = {
    async run() {
      return {
        proposal: "Create a validation helper.",
        changes: [
          {
            path: "src/validation-helper.ts",
            content: "export const valid = true;\n",
          },
        ],
      };
    },
  };

  agents.applyChanges = async (changes) => {
    events.push("applyChanges");
    assert.equal(changes.length, 1);
    assert.equal(changes[0].path, "src/validation-helper.ts");
    return [{ success: true }];
  };

  const result = await new Orchestrator(agents).run(
    "Add input validation",
  );

  assert.equal(result.review.approved, true);
  assert.equal(events.at(-1), "applyChanges");
});

test("never applies changes when the final review rejects them", async () => {
  const events: string[] = [];
  const agents = createAgents(events);
  let applyCalls = 0;

  agents.maxRevisions = 1;

  agents.coder = {
    async run() {
      return {
        proposal: "Proposed validation helper.",
        changes: [
          {
            path: "src/validation-helper.ts",
            content: "export const valid = true;\n",
          },
        ],
      };
    },
  };

  agents.reviewer = {
    async run() {
      return {
        approved: false,
        feedback: "Validation is incomplete.",
        issues: ["Missing edge cases"],
      };
    },
  };

  agents.applyChanges = async () => {
    applyCalls++;
  };

  const result = await new Orchestrator(agents).run(
    "Add input validation",
  );

  assert.equal(result.review.approved, false);
  assert.equal(result.revisionCount, 1);
  assert.equal(applyCalls, 0);
});

test("does not invoke the applier when approved coding has no changes", async () => {
  const agents = createAgents([]);
  let applyCalls = 0;

  agents.coder = {
    async run() {
      return {
        proposal: "No file changes are required.",
        changes: [],
      };
    },
  };

  agents.applyChanges = async () => {
    applyCalls++;
  };

  const result = await new Orchestrator(agents).run(
    "Add input validation",
  );

  assert.equal(result.review.approved, true);
  assert.equal(applyCalls, 1);
});


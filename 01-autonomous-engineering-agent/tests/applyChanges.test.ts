
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { applyChanges } from "../src/orchestration/applyChanges.js";

async function createTempProject() {
  return fs.mkdtemp(path.join(os.tmpdir(), "q4-agent-test-"));
}

test("creates a new file inside the project", async () => {
  const root = await createTempProject();

  try {
    await fs.mkdir(path.join(root, "src"), { recursive: true });
    const results = await applyChanges(
      [{ path: "src/helper.ts", content: "export const answer = 42;" }],
      root,
    );

    assert.equal(results.length, 1);
    assert.equal(
      await fs.readFile(path.join(root, "src/helper.ts"), "utf8"),
      "export const answer = 42;",
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("refuses to overwrite an existing file", async () => {
  const root = await createTempProject();

  try {
    await fs.writeFile(path.join(root, "existing.ts"), "original");

    await assert.rejects(
      applyChanges(
        [{ path: "existing.ts", content: "replacement" }],
        root,
      ),
      /File already exists/,
    );

    assert.equal(
      await fs.readFile(path.join(root, "existing.ts"), "utf8"),
      "original",
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("rejects paths outside the project", async () => {
  const root = await createTempProject();

  try {
    await assert.rejects(
      applyChanges([{ path: "../outside.ts", content: "unsafe" }], root),
      /Access denied/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("rejects changes that request overwriting", async () => {
  const root = await createTempProject();

  try {
    await assert.rejects(
      applyChanges(
        [{ path: "existing.ts", content: "unsafe", overwrite: true }],
        root,
      ),
      /separate authorization/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("rejects an invalid changes collection", async () => {
  const root = await createTempProject();

  try {
    await assert.rejects(
      applyChanges(null as never, root),
      /must be an array/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

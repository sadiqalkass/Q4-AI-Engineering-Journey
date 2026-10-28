import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { listFiles } from "../src/tools/listFiles.js";

test("listFiles lists entries inside the project", async () => {
  const entries = await listFiles(".");
  assert.ok(Array.isArray(entries));
  assert.ok(entries.every((entry) =>
    typeof entry.name === "string" &&
    (entry.type === "file" || entry.type === "directory")
  ));
});

test("listFiles rejects directories outside the project", async () => {
  const outsideDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "agent-outside-")
  );

  try {
    await assert.rejects(
      listFiles(outsideDirectory),
      /Access denied/
    );
  } finally {
    await fs.rm(outsideDirectory, { recursive: true, force: true });
  }
});

test("listFiles rejects a file instead of a directory", async () => {
  const projectRoot = await fs.realpath(process.cwd());
  const packageFile = path.join(projectRoot, "package.json");

  await assert.rejects(
    listFiles(packageFile),
    /not a directory/
  );
});
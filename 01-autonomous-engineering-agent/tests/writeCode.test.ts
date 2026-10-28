
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { writeCode } from "../src/tools/writeCode.js";

const temporaryRoots: string[] = [];

async function createRoot(): Promise<string> {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "q4-write-code-test-"),
  );

  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) =>
      fs.rm(root, { recursive: true, force: true }),
    ),
  );
});

test("creates a new file inside the project", async () => {
  const root = await createRoot();

  await fs.mkdir(path.join(root, "src"));

  const result = await writeCode(
    { path: "src/example.ts", content: "export const value = 42;\n" },
    root,
  );

  assert.equal(result.success, true);
  assert.equal(result.action, "created");
  assert.equal(
    await fs.readFile(path.join(root, "src/example.ts"), "utf-8"),
    "export const value = 42;\n",
  );
});

test("refuses to overwrite an existing file by default", async () => {
  const root = await createRoot();
  const file = path.join(root, "example.ts");

  await fs.writeFile(file, "original");

  await assert.rejects(
    writeCode({ path: "example.ts", content: "replacement" }, root),
    /already exists/,
  );

  assert.equal(await fs.readFile(file, "utf-8"), "original");
});

test("overwrites an existing file when explicitly permitted", async () => {
  const root = await createRoot();
  const file = path.join(root, "example.ts");

  await fs.writeFile(file, "original");

  const result = await writeCode(
    { path: "example.ts", content: "replacement", overwrite: true },
    root,
  );

  assert.equal(result.success, true);
  assert.equal(result.action, "updated");
  assert.equal(await fs.readFile(file, "utf-8"), "replacement");
});

test("rejects paths that escape the project root", async () => {
  const root = await createRoot();

  await assert.rejects(
    writeCode({ path: "../outside.txt", content: "unsafe" }, root),
    /inside the project directory/,
  );
});

test("rejects attempts to write to the project root itself", async () => {
  const root = await createRoot();

  await assert.rejects(
    writeCode({ path: ".", content: "unsafe" }, root),
    /inside the project directory/,
  );
});

test("rejects a symlink pointing outside the project", async (t) => {
  const root = await createRoot();
  const outsideRoot = await createRoot();

  const outsideFile = path.join(outsideRoot, "outside.txt");
  const linkPath = path.join(root, "linked.txt");

  await fs.writeFile(outsideFile, "protected");

  try {
    await fs.symlink(outsideFile, linkPath, "file");
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    if (
      process.platform === "win32" &&
      (code === "EPERM" || code === "EACCES" || code === "ENOSYS")
    ) {
      t.skip("File symlink creation is not permitted in this environment.");
      return;
    }

    throw error;
  }

  await assert.rejects(
    writeCode(
      { path: "linked.txt", content: "malicious", overwrite: true },
      root,
    ),
    /symlinks/,
  );

  assert.equal(await fs.readFile(outsideFile, "utf-8"), "protected");
});

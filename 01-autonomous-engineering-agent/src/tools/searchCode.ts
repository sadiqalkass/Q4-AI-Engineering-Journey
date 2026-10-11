import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
]);

const IGNORED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".lock",
]);

const MAX_FILES_TO_SCAN = 500;
const MAX_RESULTS = 50;
const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

export async function searchCode(query: string) {
  if (!query.trim()) {
    throw new Error("Search query cannot be empty.");
  }

  const matches: Array<{
    filePath: string;
    line: number;
    content: string;
  }> = [];

  let filesScanned = 0;
  let truncated = false;

  async function walk(directory: string): Promise<void> {
    if (truncated) return;

    const entries = await readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (truncated) return;

      const fullPath = path.join(directory, entry.name);

      if (entry.isSymbolicLink()) continue;

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;

        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (IGNORED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        continue;
      }

      if (filesScanned >= MAX_FILES_TO_SCAN) {
        truncated = true;
        return;
      }

      filesScanned++;

      try {
        const stats = await import("node:fs/promises").then(
          ({ stat }) => stat(fullPath)
        );

        if (stats.size > MAX_FILE_SIZE) continue;

        const content = await readFile(fullPath, "utf8");
        const lines = content.split(/\r?\n/);

        for (let index = 0; index < lines.length; index++) {
          if (
            lines[index]
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            matches.push({
              filePath: path.relative(ROOT_DIR, fullPath),
              line: index + 1,
              content: lines[index].trim().slice(0, 300),
            });

            if (matches.length >= MAX_RESULTS) {
              truncated = true;
              return;
            }
          }
        }
      } catch {
        // Skip unreadable or non-text files.
      }
    }
  }

  await walk(ROOT_DIR);

  return {
    query,
    filesScanned,
    totalMatchesReturned: matches.length,
    truncated,
    matches,
  };
}
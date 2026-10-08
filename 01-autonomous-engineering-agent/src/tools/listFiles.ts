import fs from "node:fs/promises";
import path from "node:path";

export async function listFiles(directory: string = ".") {
  const absolutePath = path.resolve(directory);

  const entries = await fs.readdir(absolutePath, {
    withFileTypes: true,
  });

  return entries.map((entry) => ({
    name: entry.name,
    type: entry.isDirectory() ? "directory" : "file",
  }));
}
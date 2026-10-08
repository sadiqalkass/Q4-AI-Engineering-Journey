import fs from "node:fs/promises";
import path from "node:path";

export async function readFile(filePath: string) {
  const absolutePath = path.resolve(filePath);

  const content = await fs.readFile(absolutePath, "utf-8");

  return {
    path: filePath,
    content,
  };
}
import fs from "node:fs/promises";
import path from "node:path";

export async function readFile(filePath: string) {
  const projectRoot = await fs.realpath(process.cwd());
  const requestedPath = path.resolve(projectRoot, filePath);

  // Resolve symlinks before checking the final path.
  const absolutePath = await fs.realpath(requestedPath);

  const relativePath = path.relative(projectRoot, absolutePath);

  const isOutsideProject =
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath);

  if (isOutsideProject || relativePath === "") {
    throw new Error(
      "Access denied: the requested file must be inside the project directory."
    );
  }

  const stats = await fs.stat(absolutePath);

  if (!stats.isFile()) {
    throw new Error("The requested path is not a file.");
  }

  const content = await fs.readFile(absolutePath, "utf-8");

  return {
    path: relativePath,
    content,
  };
}

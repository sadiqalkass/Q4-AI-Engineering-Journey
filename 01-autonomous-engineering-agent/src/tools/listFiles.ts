
import fs from "node:fs/promises";
import path from "node:path";

export async function listFiles(directory: string = ".") {
  const projectRoot = await fs.realpath(process.cwd());
  const requestedPath = path.resolve(projectRoot, directory);
  const absolutePath = await fs.realpath(requestedPath);

  const relativePath = path.relative(projectRoot, absolutePath);

  const isOutsideProject =
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath);

  if (isOutsideProject) {
    throw new Error(
      "Access denied: the requested directory must be inside the project directory."
    );
  }

  const stats = await fs.stat(absolutePath);

  if (!stats.isDirectory()) {
    throw new Error("The requested path is not a directory.");
  }

  const entries = await fs.readdir(absolutePath, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => !entry.isSymbolicLink())
    .map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
    }));
}

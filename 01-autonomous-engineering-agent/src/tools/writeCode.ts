
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

interface WriteCodeOptions {
  path: string;
  content: string;
  overwrite?: boolean;
}

function isOutsideRoot(root: string, target: string): boolean {
  const relative = path.relative(root, target);

  return (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  );
}

export async function writeCode(
  { path: filePath, content, overwrite = false }: WriteCodeOptions,
  projectRootInput: string = process.cwd(),
) {
  if (typeof filePath !== "string" || !filePath.trim()) {
    throw new Error("A file path is required.");
  }

  if (typeof content !== "string") {
    throw new Error("File content must be a string.");
  }

  if (typeof overwrite !== "boolean") {
    throw new Error("overwrite must be a boolean.");
  }

  const projectRoot = await fs.realpath(projectRootInput);
  const requestedPath = path.resolve(projectRoot, filePath);

  if (
    isOutsideRoot(projectRoot, requestedPath) ||
    requestedPath === projectRoot
  ) {
    throw new Error(
      "Access denied: the file must be inside the project directory.",
    );
  }

  const requestedParent = path.dirname(requestedPath);
  const realParent = await fs.realpath(requestedParent);

  if (isOutsideRoot(projectRoot, realParent)) {
    throw new Error(
      "Access denied: the parent directory must be inside the project.",
    );
  }

  const targetPath = path.join(realParent, path.basename(requestedPath));

  let existing: Awaited<ReturnType<typeof fs.lstat>> | undefined;

  try {
    existing = await fs.lstat(targetPath);
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  if (existing?.isSymbolicLink()) {
    throw new Error("Access denied: writing through symlinks is prohibited.");
  }

  if (existing && !existing.isFile()) {
    throw new Error("The requested path is not a regular file.");
  }

  if (existing && !overwrite) {
    throw new Error(
      `File already exists: ${path.relative(projectRoot, targetPath)}. Set overwrite to true to replace it.`,
    );
  }

  const relativePath = path.relative(projectRoot, targetPath);
  const bytesWritten = Buffer.byteLength(content, "utf-8");

  // New files use exclusive creation, preventing accidental overwrites.
  if (!existing) {
    const handle = await fs.open(targetPath, "wx");

    try {
      await handle.writeFile(content, "utf-8");
    } catch (error) {
      await fs.rm(targetPath, { force: true });
      throw error;
    } finally {
      await handle.close();
    }

    return {
      success: true,
      path: relativePath,
      action: "created",
      bytesWritten,
    };
  }

  // Existing files are replaced atomically via a temporary sibling file.
  const tempPath = path.join(
    realParent,
    `.write-code-${randomUUID()}.tmp`,
  );

  try {
    await fs.writeFile(tempPath, content, {
      encoding: "utf-8",
      flag: "wx",
    });

    await fs.rename(tempPath, targetPath);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }

  return {
    success: true,
    path: relativePath,
    action: "updated",
    bytesWritten,
  };
}

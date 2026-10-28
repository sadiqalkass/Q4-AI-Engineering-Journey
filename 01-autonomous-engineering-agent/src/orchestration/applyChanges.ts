
import { writeCode } from "../tools/writeCode.js";
import type { CodeChange } from "./types.js";

export async function applyChanges(
  changes: CodeChange[],
  projectRoot: string = process.cwd(),
) {
  if (!Array.isArray(changes)) {
    throw new Error("Code changes must be an array.");
  }

  const results = [];

  for (const change of changes) {
    if (
      !change ||
      typeof change.path !== "string" ||
      !change.path.trim() ||
      typeof change.content !== "string"
    ) {
      throw new Error("Invalid code change.");
    }

    // The coder cannot authorize overwriting existing files.
    if (change.overwrite === true) {
      throw new Error(
        `Overwriting files requires separate authorization: ${change.path}`,
      );
    }

    results.push(
      await writeCode(
        {
          path: change.path,
          content: change.content,
          overwrite: false,
        },
        projectRoot,
      ),
    );
  }

  return results;
}

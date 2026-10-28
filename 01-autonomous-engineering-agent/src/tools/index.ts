import { listFiles } from "./listFiles.js";
import { readFile } from "./readFile.js";
import { searchCode } from "./searchCode.js";
import { writeCode } from "./writeCode.js";

export const tools = {
  list_files: listFiles,
  read_file: readFile,
  search_code: searchCode,
  write_code: writeCode,
};

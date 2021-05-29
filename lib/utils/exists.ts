import { constants } from "fs";
import { access } from "fs/promises";

export async function exists(path: string) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

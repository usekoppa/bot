import { readFileSync } from "fs";
import { readFile } from "fs/promises";

export async function readJson<T = unknown>(path: string): Promise<T> {
  const fileContents = await readFile(path, { encoding: "utf-8" });
  const data = JSON.parse(fileContents);

  return data;
}

export function readJsonSync<T = unknown>(path: string): T {
  const fileContents = readFileSync(path, { encoding: "utf-8" });
  const data = JSON.parse(fileContents);

  return data;
}

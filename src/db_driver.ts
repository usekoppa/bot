import { createLogger } from "@utils/logger";

import { MongoClient } from "mongodb";
import Papr from "papr";

export let client: MongoClient;

export const papr = new Papr();

const log = createLogger("db");

const credentialsRegex = /mongodb:\/\/(?:(.+:.+)@)?[^@]+:(?:\d{4}|\d{2})/g;

export async function connect(
  url: `mongodb://${`${string}:${string}@` | ""}${string}:${number}`,
  dbName: string
) {
  const credMatch = credentialsRegex.exec(url) ?? void 0;
  const displayUrl =
    typeof credMatch?.[1] !== "undefined"
      ? url.slice(0, url.indexOf(credMatch[1])) +
        "*".repeat(credMatch[1].length) +
        url.slice(url.indexOf(credMatch[1]) + credMatch[1].length)
      : url;

  log.info("Connecting to MongoDB", { url: displayUrl });
  client = await MongoClient.connect(url);
  log.info("Successfully connected to MongoDB");

  papr.initialize(client.db(dbName));

  await papr.updateSchemas();
}

export function disconnect() {
  log.info("Disconnecting from MongoDB");
  return client.close();
}

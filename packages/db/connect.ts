import { PathLike } from "fs";

import { createLogger } from "@utils/logger";

import { ConnectionOptions, createConnection } from "typeorm";

import { CustomSimpleConsoleLogger } from "./db_logger";
import { getEntities } from "./entities";

const log = createLogger("db");

export async function connect(path: PathLike) {
  log.info("Connecting to database");

  const conn = await createConnection({
    type: "better-sqlite3",
    database: path,
    entities: getEntities(),
    logger: new CustomSimpleConsoleLogger(log, "all"),
    logging: true,
  } as ConnectionOptions);
  log.info("Connected to database");

  return conn;
}

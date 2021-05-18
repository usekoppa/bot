import { PathLike } from "fs";

import { createLogger } from "@utils/logger";

import { Container } from "typedi";
import { Connection, ConnectionOptions, createConnection } from "typeorm";

import { CustomSimpleConsoleLogger } from "./db_logger";

const log = createLogger("db");

export async function connect(path: PathLike) {
  log.info("Connecting to database");
  const conn = await createConnection({
    type: "better-sqlite3",
    database: path,
    logger: new CustomSimpleConsoleLogger(log, ["warn", "error"]),
  } as ConnectionOptions);
  log.info("Connected to database");

  Container.set(Connection, conn);

  return conn;
}

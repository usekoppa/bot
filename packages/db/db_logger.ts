// Copyright (C) typeorm - MIT License
// Original: https://github.com/typeorm/typeorm/blob/1e1595e4c561995c60eef60426ef4f198d8b48cb/src/logger/SimpleConsoleLogger.ts

/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Logger as UtilLogger } from "@utils/logger";

import { Logger, LoggerOptions, QueryRunner } from "typeorm";

/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events and does not use syntax highlighting.
 */
export class CustomSimpleConsoleLogger implements Logger {
  #log: UtilLogger;
  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(log: UtilLogger, private options?: LoggerOptions) {
    this.#log = log;
  }

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  /**
   * Logs query and parameters used in it.
   */
  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    if (
      this.options === "all" ||
      this.options === true ||
      (Array.isArray(this.options) && this.options.indexOf("query") !== -1)
    ) {
      const sql =
        query +
        (parameters && parameters.length
          ? " -- PARAMETERS: " + this.stringifyParams(parameters)
          : "");
      this.#log.debug("query" + ": " + sql);
    }
  }

  /**
   * Logs query that is failed.
   */
  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner
  ) {
    if (
      this.options === "all" ||
      this.options === true ||
      (Array.isArray(this.options) && this.options.indexOf("error") !== -1)
    ) {
      const sql =
        query +
        (parameters && parameters.length
          ? " -- PARAMETERS: " + this.stringifyParams(parameters)
          : "");
      this.#log.pureError(`query failed: ` + sql);
      this.#log.pureError(error);
    }
  }

  /**
   * Logs query that is slow.
   */
  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner
  ) {
    const sql =
      query +
      (parameters && parameters.length
        ? " -- PARAMETERS: " + this.stringifyParams(parameters)
        : "");
    this.#log.warn(`query is slow: ` + sql);
    this.#log.warn(`execution time: ` + time);
  }

  /**
   * Logs events from the schema build process.
   */
  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    if (
      this.options === "all" ||
      (Array.isArray(this.options) && this.options.indexOf("schema") !== -1)
    ) {
      console.debug(message);
    }
  }

  /**
   * Logs events from the migrations run process.
   */
  logMigration(message: string, _queryRunner?: QueryRunner) {
    console.debug(message);
  }

  /**
   * Perform logging using given logger, or by default to the console.
   * Log has its own level and message.
   */
  log(
    level: "log" | "info" | "warn",
    message: any,
    _queryRunner?: QueryRunner
  ) {
    switch (level) {
      case "log":
        if (
          this.options === "all" ||
          (Array.isArray(this.options) && this.options.indexOf("log") !== -1)
        )
          this.#log.debug(message);
        break;
      case "info":
        if (
          this.options === "all" ||
          (Array.isArray(this.options) && this.options.indexOf("info") !== -1)
        )
          this.#log.info(message);
        break;
      case "warn":
        if (
          this.options === "all" ||
          (Array.isArray(this.options) && this.options.indexOf("warn") !== -1)
        )
          this.#log.warn(message);
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Protected Methods
  // -------------------------------------------------------------------------

  /**
   * Converts parameters to a string.
   * Sometimes parameters can have circular objects and therefor we are handle this case too.
   */
  protected stringifyParams(parameters: any[]) {
    try {
      return JSON.stringify(parameters);
    } catch (error) {
      // most probably circular objects in parameters
      return parameters;
    }
  }
}

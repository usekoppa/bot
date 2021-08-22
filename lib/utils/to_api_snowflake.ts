import { Snowflake as DJSSnowflake } from "discord.js";
import { Snowflake } from "discord-api-types";

export function toAPISnowflake(djsSnowflake: DJSSnowflake) {
  return djsSnowflake as Snowflake;
}

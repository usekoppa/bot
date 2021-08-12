// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Snowflake } from "discord.js";

declare module "discord.js" {
  export type Snowflake = `${bigint}`;
}

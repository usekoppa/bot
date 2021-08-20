import { Client } from "discord.js";

import { config } from "./config";

const client = new Client(config.bot.clientOptions);

export function getClient() {
  return client;
}

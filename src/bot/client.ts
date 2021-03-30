import { config } from "@utils/config";

import { Client, Intents } from "discord.js";

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES];

const client = new Client({ intents });

export function registerEvents() {
  clientEvents();
}

function clientEvents() {
  client.on("ready", () => {
    client.user?.setActivity(`Epsilon - ${config.bot.prefix}help`);

    console.log("Logged in and ready to serve as", client.user?.tag);
  });
}

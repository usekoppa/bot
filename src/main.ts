import "./register_aliases";

import { config } from "@utils/config";

import { Client, Intents, MessageOptions } from "discord.js";

import * as commands from "./commands";

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES];

const client = new Client({ intents });



// eslint-disable-next-line @typescript-eslint/no-floating-promises
client.login(config.bot.token);

import { Client, ClientOptions, Intents } from "discord.js";
import { Service } from "typedi";

export const clientOptions: ClientOptions = {
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
};

@Service()
export class KoppaClient extends Client {
  constructor() {
    super(clientOptions);
  }
}

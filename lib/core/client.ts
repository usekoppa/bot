import { Client, ClientOptions, Intents } from "discord.js-light";
import { Service } from "typedi";

export const clientOptions: ClientOptions = {
  ws: {
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
  },
};

@Service()
export class KoppaClient extends Client {
  constructor() {
    super(clientOptions);
  }

  // // @ts-expect-error: Skid protection pretty much, saying its for security is a bit of a stretch.
  // public get token() {
  //   return null;
  // }

  // // eslint-disable-next-line @typescript-eslint/no-empty-function
  // public set token(_) {}
}

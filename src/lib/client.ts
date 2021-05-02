import { createLogger } from "@utils/logger";

import { Client, ClientOptions, Intents } from "discord.js";
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

const startTime = Date.now();

@Service()
export class KoppaClient extends Client {
  private log = createLogger("client");

  constructor() {
    super(clientOptions);
  }

  // @ts-expect-error: Skid protection pretty much, saying its for security is a bit of a stretch.
  public get token() {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public set token(_) {}

  public login(token?: string | undefined) {
    const endTime = Date.now() - startTime;
    this.log.info(`Loaded services in ~${endTime}ms`);
    return super.login(token);
  }
}

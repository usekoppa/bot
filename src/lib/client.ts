import { Client, ClientOptions, Intents } from "discord.js";
import { Service } from "typedi";

export const clientOptions: ClientOptions = {
  ws: { intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] },
};

@Service()
export class KoppaClient extends Client {
  constructor() {
    super(clientOptions);
  }

  // @ts-expect-error: We do this for the sake of security.
  public get token() {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public set token(_) {}
}

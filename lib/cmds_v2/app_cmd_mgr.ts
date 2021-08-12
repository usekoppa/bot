import { REST } from "@discordjs/rest";
import { ApplicationCommandData } from "discord.js";
import { Routes, Snowflake } from "discord-api-types/v9";

export class ApplicationCommandManager {
  #rest: REST;

  constructor(private clientID: Snowflake, token: string) {
    this.#rest = new REST({ version: "9" }).setToken(token);
  }

  registerGuildCommands(
    guildID: Snowflake,
    commands: ApplicationCommandData[]
  ) {
    return this.#register(this.#routeURI(guildID), commands);
  }

  #routeURI(guildID?: Snowflake) {
    if (typeof guildID !== "undefined") {
      return Routes.applicationGuildCommands(this.clientID, guildID);
    } else {
      return Routes.applicationCommands(this.clientID);
    }
  }

  async #register(route: `/${string}`, commands: ApplicationCommandData[]) {
    await this.#rest.put(route, { body: commands });
  }
}

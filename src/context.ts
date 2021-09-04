import { Command, CommandContext } from "@cmds";
import { createLogger, Logger } from "@utils/logger";
import { createEmbed, EmbedColours } from "@ux/embeds";

import { CommandInteraction } from "discord.js";

// eslint-disable-next-line @typescript-eslint/ban-types
class Context<A = {}> implements CommandContext<A> {
  args = {} as A;
  log = createLogger("cmd", { childNames: [this.command.name] });

  constructor(
    public command: Command<A>,
    public interaction: CommandInteraction
  ) {}

  reply(
    title: string,
    description: string,
    opts?: { ephemeral?: boolean; colour?: EmbedColours; footer?: string }
  ) {
    const embed = createEmbed({ author: this.interaction.user, ...opts })
      .setTitle(title)
      .setDescription(description)
      .setColor(opts?.colour ?? EmbedColours.Primary);

    return this.interaction.reply({
      embeds: [embed],
      ephemeral: opts?.ephemeral,
    });
  }
}

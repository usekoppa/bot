import { Registry } from "@lib/cmds/registry";

import { MessageEmbed } from "discord.js";
import { Container } from "typedi";

const registry = Container.get(Registry);

// TODO: Make the embeds look nicer
registry.add({
  name: "ping",
  aliases: ["p"],
  run({ msg }) {
    const pingTime = Math.abs(Date.now() - msg.createdTimestamp);

    return new MessageEmbed()
      .setTitle(":ping_pong: Pong!")
      .setDescription(`It took **${pingTime}ms** to send this message.`);
  },
});

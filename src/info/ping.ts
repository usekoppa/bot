import { KoppaClient } from "@lib/client";
import { Registry } from "@lib/cmds/registry";

import { MessageEmbed } from "discord.js";
import { Container } from "typedi";

const registry = Container.get(Registry);
const client = Container.get(KoppaClient);

// TODO: Make this look better.
registry.add({
  name: "ping",
  aliases: ["p"],
  run({ msg }) {
    const pingTime = Math.abs(
      Date.now() - msg.createdTimestamp - client.ws.ping
    );

    return new MessageEmbed()
      .setTitle(":ping_pong: Pong!")
      .setDescription(`It took **${pingTime}ms* to send this message.`);
  },
});

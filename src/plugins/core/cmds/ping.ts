import { Category } from "@cmds/categories";
import { KoppaClient } from "@core/client";
import { createEmbed } from "@ux/embeds";

import { Container } from "typedi";

import { CorePlugin } from "..";

const client = Container.get(KoppaClient);

CorePlugin.command({
  name: "ping",
  aliases: ["p", "latency"],
  category: Category.Information,
  description: "Tells you if the bot is working and the latent response time",
  async run({ msg }) {
    const m = await msg.channel.send("Ping?");
    const pingTime = Math.abs(m.createdTimestamp - msg.createdTimestamp);

    const respEmbed = createEmbed({
      author: msg.author,
      footerNote: `Latency: ${client.ws.ping}ms`,
    })
      .setTitle(":ping_pong: Pong!")
      .setDescription(`It took **${pingTime}ms** to send this message.`);

    await m.edit("", respEmbed);
  },
});

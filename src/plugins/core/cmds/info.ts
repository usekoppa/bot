import { join } from "path";

import { Category } from "@cmds/categories";
import { CommandRegistry } from "@cmds/registry";
import { KoppaClient } from "@core/client";
import { readJsonSync } from "@utils/read_json";
import { createEmbed } from "@ux/embeds";

import ms from "ms";
import { Container } from "typedi";

import { CorePlugin } from "..";

const registry = Container.get(CommandRegistry);
const client = Container.get(KoppaClient);

const { version } = readJsonSync<{ version: string }>(
  join(process.cwd(), "package.json")
);

CorePlugin.command({
  name: "info",
  aliases: ["about", "statistics", "stats"],
  category: Category.Information,
  description: "Tells you about the bot & provides some statistics",
  run(ctx) {
    const respEmbed = createEmbed({ author: ctx.msg.author })
      .setTitle(":robot: About Koppa")
      .setDescription(
        `Koppa v${version} ~ By [zorbyte](https://github.com/zorbyte) & contributors (\`${ctx.prefix}credits\`)`
      );

    const statistics =
      `**Servers (cached):** ${client.guilds.cache.size}\n` +
      `**Users (cached):** ${client.users.cache.size}\n` +
      `**Commands:** ${registry.size}\n` +
      `**Uptime:** ${ms(process.uptime() * 1000)}`;
    respEmbed.addField("Statistics", statistics);

    const thumb = client.user!.avatarURL({ format: "png", size: 512 });
    if (thumb !== null) respEmbed.setThumbnail(thumb);

    return respEmbed;
  },
});

import { parameter } from "@args/parameter";
import { stringTransformer } from "@args/transformers/string";
import { getUsageString } from "@args/usage";
import { Category, categoryEmojis } from "@cmds/categories";
import { Command } from "@cmds/command";
import { CommandRegistry } from "@cmds/registry";
import { blank } from "@ux/blank";
import { createEmbed } from "@ux/embeds";

import { MessageEmbed } from "discord.js-light";
import { Container } from "typedi";

import { CorePlugin } from "..";

const registry = Container.get(CommandRegistry);

const unmappedCategoryEmojis = new Set<string>();

CorePlugin.command({
  name: "help",
  usage: [
    parameter("command", stringTransformer, {
      optional: true,
      aliases: ["cmd"],
    }),
  ],
  aliases: ["h", "commands", "cmds", "usage"],
  description: "Provides a list of commands to use with the bot",
  run(ctx) {
    const { command } = ctx.args;
    if (typeof command !== "undefined") {
      if (!registry.has(command)) return buildHelpMenu();
      const cmd = registry.find(command)!;
      return buildCommandHelp(cmd);
    } else {
      return buildHelpMenu();
    }

    function buildCommandHelp(cmd: Command) {
      const emb = createEmbed(ctx.msg)
        .setTitle(
          `\`${cmd.name}${cmd.usage ? ` ${getUsageString(cmd.usage)}` : ""}\``
        )
        .setDescription(cmd.description)
        .addField("Category", cmd.category, true);

      if (Array.isArray(cmd.aliases) && cmd.aliases.length > 0) {
        emb.addField("Aliases", `\`${cmd.aliases.join("`, `")}\``, true);
      }

      return emb;
    }

    function buildHelpMenu(): MessageEmbed {
      const emb = createEmbed({
        author: ctx.msg.author,
        footerNote: `For help on how to interpret commands, run '${ctx.prefix}man syntax'`,
      })
        .setTitle(":question: Help")
        .setDescription(
          `Use \`${ctx.prefix}help [command]\` for more help on a specific command\n${blank}`
        );

      // Explicitly defined so that there is an order.
      const categoryInfos: Record<Category, string> = {
        [Category.Information]: "",
        [Category.Moderation]: "",
        [Category.Tools]: "",
        [Category.Fun]: "",
      };

      for (const cmd of registry) {
        let cmdInfo = `\`${cmd.name}`;

        const formattedAliases =
          Array.isArray(cmd.aliases) && cmd.aliases.length > 0
            ? ` (${cmd.aliases
                .sort()
                .sort((a, b) => a.length - b.length)
                .slice(0, 2)
                .join(", ")}${cmd.aliases.length > 2 ? "..." : ""})`
            : "";

        cmdInfo += formattedAliases;
        cmdInfo += `\`: ${cmd.description}`;

        const categoryInfo = categoryInfos[cmd.category];
        const lineBreak = categoryInfo !== "" ? "\n" : "";
        categoryInfos[cmd.category] = `${categoryInfo}${lineBreak}${cmdInfo}`;
      }

      let i = 0;
      const infosEntries = Object.entries(categoryInfos);
      // eslint-disable-next-line prefer-const
      for (let [category, info] of infosEntries) {
        i++;

        let emoji = categoryEmojis.get(category as Category) ?? "";
        if (emoji === "" && !unmappedCategoryEmojis.has(category)) {
          ctx.log.warn(`Category ${category} does not have an emoji assigned`);
          unmappedCategoryEmojis.add(category);
        } else {
          emoji += " ";
        }

        if (info === "") continue;
        if (i < infosEntries.length) info += `\n${blank}`;

        emb.addField(`${emoji}${category}`, info);
      }

      return emb;
    }
  },
});

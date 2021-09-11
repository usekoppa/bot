// This is a temporary file just so we can test out application commands.

import { ApplicationCommandManager, Command, CommandContext } from "@cmds";
import { EventManager } from "@events";
import { toAPISnowflake } from "@utils/to_api_snowflake";
import { Button } from "@ux/button";
import { createEmbed } from "@ux/embeds";

import { Collection, MessageActionRow, SnowflakeUtil } from "discord.js";
import ms from "ms";

import { getClient } from "./client";
import { config } from "./config";

const client = getClient();

export function testCommands() {
  const sayCmd = new Command()
    .setName("say")
    .setDescription("It repeats what you tell it to.")
    .addStringOption(opt =>
      opt.setName("msg").setDescription("The message to send")
    )
    .addRunner(async ctx => {
      await ctx.interaction.reply(ctx.args.msg);
    });

  const pingCmd = new Command()
    .setName("ping")
    .setDescription("Pings the bot and tests latency")
    .addRunner(async ctx => {
      // Send "Koppa is thinking..." notifier.
      const reply = await ctx.interaction.deferReply({ fetchReply: true });
      const embed = createEmbed({
        author: ctx.interaction.user,
        footer: `Latency: ${ms(
          client.ws.shards.get(ctx.interaction.guild?.shardId ?? 0)?.manager
            ?.ping ?? 0
        )}`,
      })
        .setTitle(":ping_pong: Pong!")
        .setDescription(
          `It took **${ms(
            Math.abs(
              SnowflakeUtil.deconstruct(reply.id).timestamp -
                ctx.interaction.createdTimestamp -
                client.ws.ping
            )
          )}** to respond.`
        );

      await ctx.interaction.editReply({ embeds: [embed] });
    });

  const testButtons = new Command()
    .setName("test")
    .setDescription("Tests functionality of the bot")
    .addSubcommand(subcmd =>
      subcmd
        .setName("buttons")
        .setDescription("Tests buttons")
        .addRunner(async ctx => {
          const btn = new Button()
            .setName("test")
            .setEmoji("🎉")
            .setMaxClicks(20)
            .onClick(async i => {
              await i.followUp("clicked");
            });

          const row = new MessageActionRow().addComponents(btn);

          const msg = await ctx.interaction.reply({
            content: "hi",
            components: [row],
            fetchReply: true,
          });

          btn._execute(client, msg);
        })
    );

  const m = new ApplicationCommandManager(
    toAPISnowflake(config.bot.clientId),
    config.bot.token
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = new Collection<string, Command<any>>()
    .set(sayCmd.name, sayCmd)
    .set(pingCmd.name, pingCmd)
    .set(testButtons.name, testButtons as Command);

  void Promise.all(
    ["511547945871474699", "833205130131406908", "782769848740610058"]
      .map(toAPISnowflake)
      .map(id => {
        return m.registerGuildCommands(id, [...cmds.values()]);
      })
  );

  EventManager.on("guildCreate", ctx => {
    ctx.log.info("Added to guild, registering commands", {
      guildId: ctx.guild.id,
    });

    m.registerGuildCommands(toAPISnowflake(ctx.guild.id), [
      ...cmds.values(),
    ]).catch(err => {
      ctx.log.error("Failed to register guild commands", err);
    });
  });

  EventManager.on("interactionCreate", async ctx => {
    if (!ctx.interaction.isCommand()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cmdCtx = { ...ctx, args: {} } as CommandContext<any>;
    const cmd = cmds.get(ctx.interaction.commandName);
    await cmd?._executeStack(cmdCtx);
  });
}

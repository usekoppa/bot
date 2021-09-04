// This is a temporary file just so we can test out application commands.

import { ApplicationCommandManager, Command, CommandContext } from "@cmds";
import { EventManager } from "@events";
import { toAPISnowflake } from "@utils/to_api_snowflake";

import { Collection, SnowflakeUtil } from "discord.js";
import ms from "ms";

import { getClient } from "./client";
import { config } from "./config";

const client = getClient();
const evManager = new EventManager(client);

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
      const reply = await ctx.interaction.deferReply({ fetchReply: true });
      await ctx.interaction.editReply(
        `:ping_pong: Pong! Took **\`${ms(
          Math.abs(
            SnowflakeUtil.deconstruct(reply.id).timestamp -
              ctx.interaction.createdTimestamp -
              client.ws.ping
          )
        )}\`**.\n:heartbeat: Heartbeat latency **\`${ms(
          client.ws.shards.get(ctx.interaction.guild?.shardId ?? 0)?.manager
            ?.ping ?? 0
        )}\`**.`
      );
    });

  const m = new ApplicationCommandManager(
    toAPISnowflake(config.bot.clientId),
    config.bot.token
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = new Collection<string, Command<any>>()
    .set(sayCmd.name, sayCmd)
    .set(pingCmd.name, pingCmd);

  void Promise.all(
    ["511547945871474699", "833205130131406908", "782769848740610058"]
      .map(toAPISnowflake)
      .map(id => {
        return m.registerGuildCommands(id, [...cmds.values()]);
      })
  );

  evManager.add({
    type: "on",
    name: "guildCreate",
    run(ctx) {
      ctx.log.info("Added to guild, registering commands", {
        guildId: ctx.guild.id,
      });

      m.registerGuildCommands(toAPISnowflake(ctx.guild.id), [
        ...cmds.values(),
      ]).catch(err => {
        ctx.log.error("Failed to register guild commands", err);
      });
    },
  });

  evManager.add({
    type: "on",
    name: "interactionCreate",
    async run(ctx) {
      if (!ctx.interaction.isCommand()) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cmdCtx = { ...ctx, args: {} } as CommandContext<any>;
      const cmd = cmds.get(ctx.interaction.commandName);
      await cmd?._executeStack(cmdCtx);
    },
  });
}

import { ApplicationCommandManager } from "@cmds/application_command_manager";
import { Command } from "@cmds/command";
import { CommandContext } from "@cmds/command_context";
import { connect } from "@db/connect";
import { EventManager } from "@events";
import { level } from "@utils/debug";
import { createLogger, setProdMode } from "@utils/logger";
import { toAPISnowflake } from "@utils/to_api_snowflake";

import {
  Collection,
  MessageActionRow,
  MessageButton,
  SnowflakeUtil,
} from "discord.js";
import ms from "ms";

// import { dispatcher } from "../lib/old/cmds_old/dispatcher";
import { getClient } from "./client";
import { config } from "./config";

setProdMode(!config.dev);

const client = getClient();
// const plManager = new PluginManager();
const log = createLogger();
const evManager = new EventManager(client);

export async function bootstrap() {
  try {
    const startTime = Date.now();
    //  await plManager.load(join(__dirname, "plugins"));
    // if (config.hpr) plManager.watch();
    testCommands();
    setupClientHandlers(startTime);
    await connect("./koppa.db");
    log.info("Logging into Discord");
    await client.login(config.bot.token);
  } catch (err) {
    log.error("Failed to bootstrap", err);
    process.exit(1);
  }
}

function testCommands() {
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

  // If anyone checks the commit history: THIS IS A JOKE
  const likesLoliCmd = new Command()
    .setName("likesloli")
    .setDescription("checks if a user likes loli")
    .addUserOption(opt =>
      opt.setName("user").setDescription("the user to ask if they like loli")
    )
    .addRunner(async ctx => {
      const yesBtn = new MessageButton()
        .setCustomId("loli_yes")
        .setLabel("Yes!")
        .setStyle("SUCCESS")
        .setEmoji("😩");

      const noBtn = new MessageButton()
        .setCustomId("loli_no")
        .setLabel("No")
        .setStyle("DANGER")
        .setEmoji("😢");

      const row = new MessageActionRow({ components: [yesBtn, noBtn] });

      const r = await ctx.interaction.reply({
        content: `Hey <@${ctx.args.user.id}>! Do you like loli?`,
        components: [row],
      });

      ctx.interaction.channel
        ?.createMessageComponentCollector({
          max: 1,
          maxComponents: 1,
          time: 10000,
          filter(int) {
            return (
              int.user.id === ctx.args.user.id &&
              int.isButton() &&
              (int.customId === "loli_no" || int.customId === "loli_yes")
            );
          },
        })
        .on("collect", async int => {
          await int.update({
            content:
              int.customId === "loli_yes"
                ? "you are a tasteful individual"
                : "think of the children!?!?!? :weary:",
            components: [],
          });
        })
        .on("end", async (_, reason) => {
          if (reason === "time") {
            await ctx.interaction.editReply({
              content: "too late bitch",
              components: [],
            });
          }
        });
    });

  const touchCmd = new Command()
    .setName("touch")
    .setDescription("Allows you to touch something")
    .addRunner(async ctx => {
      const cumBtn = new MessageButton()
        .setCustomId("cum")
        .setLabel("touch me")
        .setEmoji("😩")
        .setStyle("PRIMARY");

      const row = new MessageActionRow().addComponents(cumBtn);

      const r = await ctx.interaction.reply({
        fetchReply: true,
        content: "lets have sex",
        components: [row],
      });

      ctx.interaction.channel
        ?.createMessageComponentCollector({
          maxUsers: 1,
          time: 3000,
          filter(int) {
            return (
              int.message.id === r.id &&
              int.isButton() &&
              int.customId === "cum"
            );
          },
        })
        .on("collect", int => {
          if (int.user.id !== ctx.interaction.user.id) {
            void int.reply({
              content:
                ":x: bitch not ur button to press dumb fag, use the cmd urself",
              ephemeral: true,
            });
          } else {
            void int.reply({
              content: "I came :sweat_drops::weary::eggplant:",
              ephemeral: true,
            });
          }
        })
        .on("end", () => {
          const newBtn = cumBtn.setDisabled(true);

          void ctx.interaction.editReply({
            content: "no more cum left",
            components: [new MessageActionRow().addComponents(newBtn)],
          });
        });
    });

  const m = new ApplicationCommandManager(
    config.bot.clientId,
    config.bot.token
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = new Collection<string, Command<any>>()
    .set(sayCmd.name, sayCmd)
    .set(pingCmd.name, pingCmd)
    .set(touchCmd.name, touchCmd)
    .set(likesLoliCmd.name, likesLoliCmd);

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
      const cmdCtx = { ...ctx, args: {} } as CommandContext<any>;
      const cmd = cmds.get(ctx.interaction.commandName);
      await cmd?._executeStack(cmdCtx);
    },
  });
}

function setupClientHandlers(startTime: number) {
  evManager.add({
    type: "once",
    name: "ready",
    run(ctx) {
      if (client.isReady()) {
        ctx.log.info("First login completed", {
          time: `~${ms(Date.now() - startTime)}`,
        });
      } else {
        // Something is very wrong if we reach this place.
        ctx.log.pureError(
          "I literally have no idea what happened to get us here, but it happened"
        );

        // This is so dumb that I'd rather terminate the program than keep going on from here.
        process.exit(0xb00b6);
      }
    },
  });

  evManager.add({
    type: "on",
    name: "ready",
    run(ctx) {
      ctx.log.info("Logged into Discord", {
        id: client.user?.id,
        tag: client.user?.tag,
      });

      setStatus();
    },
  });

  if (level >= 3) {
    evManager.add({
      type: "on",
      name: "debug",
      run(ctx) {
        ctx.log.debug("Discord.js debug log emitted", { info: ctx.info });
      },
    });
  }

  /* evManager.add({
    type: "on",
    name: "messageCreate",
    run: dispatcher(config.bot.prefix, config.bot.reportsChannelId),
  });*/

  evManager.add({
    type: "on",
    name: "warn",
    run(ctx) {
      ctx.log.warn(ctx.info);
    },
  });

  evManager.add({
    type: "on",
    name: "error",
    run(ctx) {
      ctx.log.error("Client emitted an error", ctx.error);
    },
  });

  evManager.add({
    type: "on",
    name: "shardReconnecting",
    run(ctx) {
      ctx.log.warn(`Shard is reconnecting`, { shardId: ctx.shardId });
    },
  });
}

function setStatus() {
  // TODO(@zorbyte): Make this more dynamic.
  client.user?.setActivity(`Koppa - /say`);
}

process.on("warning", warn => {
  log.warn("The process issued a warning");
  log.warn(warn);
});

process.on("uncaughtException", error =>
  log.error("An uncaught exception occurred", error)
);

process.on("unhandledRejection", reason => {
  log.pureError("An unhandled rejection occurred");
  if (typeof reason !== "undefined" && reason !== null) {
    log.pureError(reason);
  } else {
    log.warn(
      "No additional information was provided in the unhanded rejection"
    );
  }
});

import { extractContentStrings } from "../lib/parser/content";
import { KoppaClient } from "@core/client";
import { EventContext } from "@core/context";
import { createErrorEmbed } from "@ux/embeds";

import { Message, MessageOptions, TextChannel } from "discord.js";
import { Container } from "typedi";

import { CommandContext } from "./context";
import { CommandRegistry } from "./registry";

const registry = Container.get(CommandRegistry);
const client = Container.get(KoppaClient);

export function dispatcher(defaultPrefix: string, reportsChannelId: string) {
  return async function handler(ctx: EventContext<"message">) {
    const { msg, log } = ctx;
    try {
      // Ensures the user is not a bot to prevent spam and also ensures we only handle messages that begin with the bot
      // prefix.
      if (
        msg.author.bot ||
        !msg.content.toLowerCase().startsWith(defaultPrefix.toLowerCase())
      )
        return;

      // TODO(@zorbyte): Get the prefix from the guild doc.
      const prefix = defaultPrefix;

      const [callKey, content] = extractContentStrings(prefix, msg.content);

      const cmd = registry.find(callKey);
      if (typeof cmd === "undefined") return;
      const cmdLog = log.child(cmd.name);
      cmdLog.debug("Command has been called", { callKey, content });

      try {
        const ctx: CommandContext = {
          msg,
          cmd,
          content,
          callKey,
          prefix,
          log,
          args: {},
        };

        // const { args, error } = parse(ctxNoArgs, cmd.usage, content);

        // if (error) {
        //   // TODO: Send a nice embed.
        //   const argErrorEmb = createEmbed({
        //     author: msg.author,
        //     footerNote: `For more information, run '${prefix}man syntax'`,
        //   })
        //     .setTitle("Argument error")
        //     .setColor(EmbedColours.Error)
        //     .setDescription(
        //       `The argument \`${error.name}\` for command **${cmd.name}** was incorrect:\n${error.reason}`
        //     );

        //   return void msg.channel.send(argErrorEmb);
        // }

        const output = await cmd.run(ctx);
        await handleOutput(msg, output).catch(err =>
          log.error("Failed to handle output", err)
        );
      } catch (err) {
        log.error("Failed to execute", err);

        try {
          void msg.channel.send(createErrorEmbed(msg));
          const reportsChannel = await client.channels.fetch(reportsChannelId);
          if (reportsChannel.isText()) {
            void reportsChannel.send(createErrorEmbed(msg, err));
          }
          // eslint-disable-next-line no-empty
        } catch {}
      }
    } catch (err) {
      log.error("Failed to handle message event", err);
    }
  };
}

async function handleOutput(
  msg: Message,
  output: Parameters<TextChannel["send"]>[0]
) {
  if (typeof output === "undefined") return;
  if (Array.isArray(output)) {
    return await msg.channel.send(...(output as [MessageOptions]));
  }

  await msg.channel.send(output);
}

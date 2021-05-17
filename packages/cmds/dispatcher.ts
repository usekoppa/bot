import { Logger } from "@utils/logger";
import { createErrorEmbed } from "@ux/embeds";

import { Message, MessageOptions, TextChannel } from "discord.js";
import { Container } from "typedi";

import { Registry } from "./registry";

const registry = Container.get(Registry);

export function dispatcher(defaultPrefix: string) {
  return async function handler(msg: Message, log: Logger) {
    try {
      // Ensures the user is not a bot to prevent spam and also ensures we only handle msgs that begin with the bot prefix.
      if (msg.author.bot || !msg.content.startsWith(defaultPrefix)) return;

      const [callKey, args] = extractFromCommandString(
        defaultPrefix,
        msg.content
      );

      const cmd = registry.find(callKey);
      if (typeof cmd === "undefined") return;
      const cmdLog = log.child(cmd.name);
      cmdLog.debug("Command has been called", { callKey, args });

      try {
        const output = await cmd.run({ msg, args, callKey, log });
        await handleOutput(msg, output).catch(err =>
          log.error("Failed to handle output", err)
        );
      } catch (err) {
        log.error("Failed to execute", err);

        try {
          void msg.channel.send(createErrorEmbed(msg, err));
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

function extractFromCommandString(
  prefix: string,
  cmdStr: string
): [callKey: string, args: string[]] {
  const [callKey, ...args] = cmdStr
    .slice(prefix.length)
    .toLowerCase()
    .trim()
    .split(/ /g);

  return [callKey, args];
}

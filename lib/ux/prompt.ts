import { CommandContext } from "@cmds/context";
import { Logger } from "@utils/logger";
import { compose } from "@view/composer";
import { button, embed } from "@view/pieces";

import { Message } from "discord.js";

import { createEmbed } from "./embeds";

interface PromptState {
  question: string;
}

const view = compose<PromptState, boolean>(
  embed(
    ctx =>
      createEmbed({ author: ctx.msg.author }).setDescription(
        ctx.state.question
      ),
    {
      deleteOnCleanup: true,
    }
  ),
  button("✅", ctx => ctx.resolve(true)),
  button("❌", ctx => ctx.resolve(false))
);

export async function prompt(
  ctx: CommandContext,
  question: string
): Promise<boolean>;
export async function prompt(
  msg: Message,
  log: Logger,
  question: string
): Promise<boolean>;
export async function prompt(
  msgOrCtx: Message | CommandContext,
  logOrQuestion: Logger | string,
  question?: string
) {
  let msg: Message;
  let log: Logger;
  let q: string;
  if (msgOrCtx instanceof Message) {
    msg = msgOrCtx;
    log = logOrQuestion as Logger;
    q = question!;
  } else {
    msg = msgOrCtx.msg;
    log = msgOrCtx.log;
    q = logOrQuestion as string;
  }

  const { result } = await view.run(msg, log, { question: q });
  return result;
}

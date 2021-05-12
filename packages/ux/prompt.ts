import { RunnerOpts } from "@cmds/registry";
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
  opts: RunnerOpts,
  question: string
): Promise<boolean>;
export async function prompt(
  msg: Message,
  log: Logger,
  question: string
): Promise<boolean>;
export async function prompt(
  msgOrOpts: Message | RunnerOpts,
  logOrQuestion: Logger | string,
  question?: string
) {
  let msg: Message;
  let log: Logger;
  let q: string;
  if (msgOrOpts instanceof Message) {
    msg = msgOrOpts;
    log = logOrQuestion as Logger;
    q = question!;
  } else {
    msg = msgOrOpts.msg;
    log = msgOrOpts.log;
    q = logOrQuestion as string;
  }

  const { result } = await view.run(msg, log, { question: q });
  return result;
}

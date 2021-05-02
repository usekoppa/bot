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

export async function prompt(msg: Message, question: string) {
  const { result } = await view.run(msg, { question });
  return result;
}

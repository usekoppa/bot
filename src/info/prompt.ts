// import { KoppaClient } from "@lib/client";
import { Registry } from "@lib/cmds/registry";
import { createGenericResponse } from "@lib/msg_ux/embeds";
import { compose } from "@lib/msg_ux/view/composer";
import { button } from "@lib/msg_ux/view/pieces/button";
import { embed } from "@lib/msg_ux/view/pieces/embed";

import { Container } from "typedi";

const registry = Container.get(Registry);
// const client = Container.get(KoppaClient);

interface State {
  test: boolean;
}

const prompt = compose<State, boolean>(
  embed(ctx => {
    return createGenericResponse({ author: ctx.msg.author }).setTitle("sup g");
  }),
  button("✅", ctx => {
    ctx.resolve(true);
    const { msg } = ctx.getPieceState(embed);
    void msg.edit("button was clicked!");
    void msg.suppressEmbeds();
  }),
  button("❌", ctx => {
    ctx.resolve(false);
    const { msg } = ctx.getPieceState(embed);
    void msg.edit("button was clicked!");
    void msg.suppressEmbeds();
  })
);

registry.add({
  name: "prompt",
  async run({ msg }) {
    const { result } = await prompt.run(msg, { test: true });
    return `the result was \`${result.toString()}\``;
  },
});

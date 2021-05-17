import { Registry } from "@cmds/registry";
import { createEmbed } from "@ux/embeds";
import { compose } from "@view/composer";
import { button, embed } from "@view/pieces";

import { Container } from "typedi";

const registry = Container.get(Registry);

const c = compose<Record<string, unknown>, boolean>(
  embed(ctx =>
    createEmbed({
      author: ctx.msg.author,
    }).setDescription("This is a child prompt.")
  ),
  button("✅", ctx => ctx.resolve(true)),
  button("❌", ctx => ctx.resolve(false))
);

const p = compose<Record<string, unknown>, boolean>(
  embed(ctx =>
    createEmbed({
      author: ctx.msg.author,
    }).setDescription("This test's a child prompt.")
  ),
  button("✅", async ctx => {
    const res = await ctx.child(c);
    ctx.resolve(res);
  }),
  button("❌", ctx => ctx.resolve(false))
);

registry.add({
  name: "child",
  aliases: ["c"],
  async run(opts) {
    const res = await p.run(opts.msg, opts.log, {});
    if (res) {
      return "you said yes";
    } else {
      return "I guess it's a no";
    }
  },
});

import { Asyncable } from "@utils/util_types";

import { Message, MessageEmbed } from "discord.js";

import { Context } from "../context";
import { Piece } from "../piece";

export const kEmbed = Symbol("view.pieces.embed");

export interface EmbedState {
  msg: Message;
}

type EmbedFn<S, V> = (ctx: Context<S, V>) => Asyncable<MessageEmbed>;

export function embed<S, V>(fn: EmbedFn<S, V>) {
  const embed: Piece<S, V, EmbedState> = {
    id: kEmbed,
    configure(use) {
      use(async ctx => {
        const emb = await fn(ctx);
        const state = ctx.getPieceState(embed);
        state.msg = await ctx.msg.channel.send(emb);
      });
    },
  };

  return embed;
}

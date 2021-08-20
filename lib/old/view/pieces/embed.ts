import { Asyncable } from "@utils/types";

import { Message, MessageEmbed } from "discord.js";

import { Context } from "../context";
import { Piece } from "../piece";

export const kEmbed = Symbol("view.pieces.embed");

interface EmbedOpts {
  deleteOnCleanup: boolean;
}

export interface EmbedState {
  msg?: Message;
  opts: EmbedOpts;
}

type EmbedFn<S, V> = (ctx: Context<S, V>) => Asyncable<MessageEmbed>;

export function embed<S, V>(
  fn: EmbedFn<S, V>,
  opts: EmbedOpts = { deleteOnCleanup: false }
) {
  const piece: Piece<S, V, EmbedState> = {
    id: kEmbed,
    initialState: { opts },
    configure(use) {
      use(async ctx => {
        const state = ctx.getPieceState(piece)!;
        const emb = await fn(ctx);
        if (typeof state.msg === "undefined") {
          state.msg = await ctx.msg.channel.send(emb);
        } else {
          state.msg = await state.msg.edit(emb);
        }
      });
    },
    async cleanup(ctx) {
      const { msg } = ctx.getPieceState(piece)!;
      if (opts.deleteOnCleanup) {
        await msg!.delete();
      } else {
        await msg!.suppressEmbeds();
      }
    },
  };

  return piece;
}

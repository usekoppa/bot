import { createGenericResponse, GenericResponseOpts } from "@lib/msg_ux/embeds";
import { Asyncable } from "@utils/util_types";

import { Message, MessageEmbed } from "discord.js";

import { Context } from "../context";
import { Piece } from "../piece";

export const kEmbed = Symbol("view.pieces.embed");

export interface EmbedState {
  msg: Message;
}

type EmbedFn<S, V> = (
  ctx: Context<S, V>,
  embed: MessageEmbed
) => Asyncable<void>;

export function embed<S, V>(opts: GenericResponseOpts, fn: EmbedFn<S, V>) {
  const embed: Piece<S, V, EmbedState> = {
    id: kEmbed,
    configure(use) {
      use(async ctx => {
        const emb =
          typeof opts === "object"
            ? createGenericResponse(opts)
            : new MessageEmbed();

        await fn(ctx, emb);

        const state = ctx.getPieceState(embed);
        state.msg = await ctx.msg.channel.send(emb);
      });
    },
  };

  return embed;
}

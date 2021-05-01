/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { KoppaClient } from "@lib/client";

import { Message, ReactionCollector, User } from "discord.js";
import { Container } from "typedi";

import { Context } from "../context";
import { Piece } from "../piece";
import { Middleware } from "../view";

import { embed } from "./embed";

export interface ButtonState {
  activeEmojis: string[];
  emojis: string[];
  msg?: Message;
  collector?: ReactionCollector;
  deleteMode: boolean;
}

const client = Container.get(KoppaClient);

const kButton = Symbol("view.pieces.button");

export function button<S, R>(
  emoji: string,
  fn: Middleware<S, R>
): Piece<S, R, ButtonState> {
  const piece: Piece<S, R, ButtonState> = {
    id: kButton,
    initialState: {
      activeEmojis: [],
      emojis: [],
      deleteMode: false,
    },
    configure: (use, state, view) => {
      if (state.emojis.length === 20) {
        throw new Error("Can not have >20 buttons on a message");
      }

      const emojiIdx = state.emojis.push(emoji);

      // Gets the message to add the reactions to.
      use(getMessageForMenu);

      // Only add these middlewares if the piece hasn't been added in the past.
      if (!view.pieces.has(kButton)) {
        use(setupEmojiCollector, deleteMode);
      }

      use(react.bind(null, emojiIdx), handle);
    },
    cleanup(ctx) {
      const state = ctx.getPieceState(button);
      state.collector?.stop("cleanup");
      void state.msg!.reactions.removeAll();
    },
  };

  // Check if we should use delete mode:
  // delete mode is when clearing all the reactions
  // is more efficient than deleting the ones that are
  // different from the current menu.
  async function deleteMode(ctx: Context<S, R>) {
    const state = ctx.getPieceState(piece);
    const configState = ctx.getPieceConfigState(piece);
    const totalMatching = state.activeEmojis.reduce((prev, cur, i) => {
      // Use config time, as it is actually the
      // this is the final initial state
      return cur === configState.emojis[i] ? prev + 1 : 0;
    }, 0);

    if (
      state.activeEmojis.length !== 0 &&
      totalMatching < Math.round(state.emojis.length * 0.75)
    ) {
      state.deleteMode = true;
      await state.msg!.reactions.removeAll();
    }
  }

  function setupEmojiCollector(ctx: Context<S, R>) {
    const state = ctx.getPieceState(piece);
    const collector = (state.collector = state.msg!.createReactionCollector(
      (_, user: User) => user.id !== client.user?.id
    ));

    collector.setMaxListeners(2 + state.emojis.length);
  }

  function getMessageForMenu(ctx: Context<S, R>) {
    const embedState = ctx.getPieceState(embed);

    if (!embedState) {
      return ctx.reject(new Error("Can not use buttons without embed"));
    }

    ctx.getPieceState(button).msg = embedState.msg;
  }

  function handle(ctx: Context<S, R>) {
    const state = ctx.getPieceState(piece);
    // TODO(@voltexene): Handle disposals.

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    state.collector!.on("collect", async (reaction, user) => {
      // TODO(@voltexene): Allow more configuration options.
      if (
        ReactionCollector.key(reaction) !== emoji ||
        user.id !== ctx.msg.author.id
      ) {
        await reaction.remove().catch(ctx.reject);
        return;
      }

      fn(ctx);
    });
  }

  async function react(idx: number, ctx: Context<S, R>) {
    const state = ctx.getPieceState(piece);
    const activeEmoji = state.activeEmojis[idx];
    if (!state.deleteMode && activeEmoji !== emoji) {
      if (typeof activeEmoji !== undefined) {
        await state.msg!.reactions.cache.get(activeEmoji)?.remove();
      }
    }

    void state.msg!.react(emoji);
  }

  return piece;
}

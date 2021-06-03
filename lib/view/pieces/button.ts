import { KoppaClient } from "@core/client";

import { Message, ReactionCollector, User } from "discord.js-light";
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
  hasChildren: boolean;
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
    factory: button,
    initialState: {
      activeEmojis: [],
      emojis: [],
      hasChildren: false,
      deleteMode: false,
    },
    configure: (use, state, view) => {
      if (state.emojis.length === 20) {
        throw new Error("Can not have >20 buttons on a message");
      }

      const emojiIdx = state.emojis.push(emoji) - 1;

      use(ctx => (ctx.getPieceState(piece)!.hasChildren = ctx.isChild));

      // Gets the message to add the reactions to and clear the existing reactions that use the same emoji
      // of users that are not the client user.
      use(getMessageForMenu, clearOtherUsersReactions);

      // Only add these middlewares if the piece hasn't been added in the past.
      if (!view.has(piece)) use(setupEmojiCollector, deleteMode);

      use(react.bind(null, emojiIdx), handle);
    },
    cleanup(ctx) {
      const state = ctx.getPieceState(piece)!;
      const embedState = ctx.getPieceState(embed)!;
      state.collector?.stop("cleanup");

      // This avoids a 404 DiscordAPIError for the message that would no longer
      // exist at this point.
      if (!embedState.opts.deleteOnCleanup) {
        void state.msg!.reactions.removeAll().catch(ctx.reject);
      }
    },
  };

  function getMessageForMenu(ctx: Context<S, R>) {
    const embedState = ctx.getPieceState(embed);

    // This pretty much assures that the embed state is defined at this point.
    if (!embedState) {
      return ctx.reject(new Error("Can not use buttons without embed"));
    }

    ctx.getPieceState(piece)!.msg = embedState.msg;
  }

  async function clearOtherUsersReactions(ctx: Context<S, R>) {
    const state = ctx.getPieceState(piece)!;
    for (const emoji of state.activeEmojis) {
      const reaction = state.msg!.reactions.cache.get(emoji);
      (await reaction?.users.fetch())?.forEach(u => {
        if (u.id !== client.user?.id) void reaction?.users.remove(u.id);
      });
    }
  }

  // Check if we should use delete mode:
  // delete mode is when clearing all the reactions
  // is more efficient than deleting the ones that are
  // different from the current menu.
  async function deleteMode(ctx: Context<S, R>) {
    const state = ctx.getPieceState(piece)!;
    const configState = ctx.getConfiguredPieceState(piece)!;
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
    const state = ctx.getPieceState(piece)!;
    if (typeof state.collector === "undefined") {
      const collector = (state.collector = state.msg!.createReactionCollector(
        (_, user: User) => user.id !== client.user?.id
      ));

      collector.setMaxListeners(2 + state.emojis.length);
    }
  }

  function handle(ctx: Context<S, R>) {
    const state = ctx.getPieceState(piece)!;
    // TODO(@zorbyte): Handle disposals.

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    state.collector!.on("collect", async (reaction, user) => {
      // TODO(@zorbyte): Allow more configuration options.
      const reactionEmoji = ReactionCollector.key(reaction);
      if (
        user.id !== ctx.msg.author.id ||
        !state.activeEmojis.includes(reactionEmoji)
      ) {
        return await reaction.remove().catch(ctx.reject);
      }

      if (reactionEmoji === emoji && state.activeEmojis.includes(emoji)) {
        try {
          fn(ctx);
        } catch (err) {
          ctx.reject(err);
        }
      }
    });
  }

  function react(idx: number, ctx: Context<S, R>) {
    const state = ctx.getPieceState(piece)!;
    const activeEmoji = state.activeEmojis[idx];
    if (!state.deleteMode && activeEmoji !== emoji) {
      if (typeof activeEmoji !== "undefined") {
        void state.msg!.reactions.cache.get(activeEmoji)?.remove();
        state.activeEmojis.splice(idx, 1);
      } else {
        state.activeEmojis.push(emoji);
      }
    }

    void state.msg!.react(emoji);
  }

  return piece;
}

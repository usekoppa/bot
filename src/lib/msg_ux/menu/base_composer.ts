// A Message View.

import { Asyncable } from "@utils/util_types";

import { Message, Snowflake } from "discord.js";

interface StaticState<S, V> {
  buttonEmojis: string[];
  pieces: Piece<S, V>[];
}

type ConfigureHook<S, V> = (staticState: StaticState<S, V>) => void;

// State specific to a single view.
interface InternalState {
  id: number;
}

// This state is transitive; it is the same object for all views regardless of their location in tree.
interface TransitiveState {
  msg?: Message;
  activeButtons: ([emoji: string, viewID: number] | undefined)[];

  // Used for granting subtrees IDs.
  counter: number;
}

interface InitHookState<S, V> {
  state: S;
  staticState: StaticState<S, V>;
  internalState: InternalState;
  transitiveState: TransitiveState & { msg: Message };
}

type InitHook<S, V> = (state: InitHookState<S, V>) => Asyncable<void>;

type DefaultState = Record<string | number | symbol, unknown>;

interface Context<S, V> {
  state: S extends never ? DefaultState : S;
  resolve(...args: V extends never ? [value?: V] : [value: V]): Promise<void>;
  rejects(reason?: unknown): Promise<void>;
  stop(collector: "reactions" | "messages"): Promise<void>;
}

type RunHook<S, V> = (ctx: Context<S, V>) => Asyncable<void>;

interface Piece<S, V> {
  type: symbol;
  configure?: ConfigureHook<S, V>;
  init?: InitHook<S, V>;
  run?: RunHook<S, V>;
}

interface View<S, V> {
  configureAsChild: InitHook<S, V>;
  run(
    channelID: Snowflake,
    ...args: S extends unknown
      ? [initialState?: DefaultState]
      : [initialState: S]
  ): Promise<V>;
}

export function compose<S = never, V = never>(...pieces: Piece<S, V>[]) {
  const staticState: StaticState<S, V> = {
    buttonEmojis: [],
    pieces,
  };

  const internalState: InternalState = {
    id: 0,
  };

  let transitiveState: TransitiveState = {
    activeButtons: Array(20).fill(void 0),
    counter: 0,
  };

  for (const piece of pieces) {
    piece.configure?.(staticState);
  }

  const view: View<S, V> = {
    configureAsChild({ transitiveState: newTransState }) {
      transitiveState = newTransState;
      internalState.id = transitiveState.counter;
    },
    run(channelID: Snowflake, initialState = {}) {
      // TODO(@zorbyte): Do all of this lol.
      return Promise.resolve(({ channelID, initialState } as unknown) as V);
    },
  };

  return view;
}

//function use(hook: "reaction"): void;
// function use(hook: "message"): void {}

const kButtonPiece = Symbol("pieces.button");
const kButtonMapper = Symbol("pieces.button.mapper");
export function button<S, V>(emoji: string, run: RunHook<S, V>): Piece<S, V> {
  return {
    type: kButtonPiece,
    configure(staticState) {
      staticState.buttonEmojis.push(emoji);
      const btnMapper = staticState.pieces.find(p => p.type === kButtonMapper);
      if (!btnMapper) addButtonMapper(staticState);
    },
    run,
  };
}

function addButtonMapper<S, V>(staticState: StaticState<S, V>) {
  const firstBtnPieceIdx = staticState.pieces.findIndex(
    p => p.type === kButtonPiece
  );

  const buttonMapper: Piece<S, V> = {
    type: kButtonMapper,
    async init({ internalState, transitiveState, staticState }) {
      let overlapEnd = transitiveState.activeButtons.length;
      let currentlyHasOverlap = true;
      const oldActiveButtons = transitiveState.activeButtons;
      transitiveState.activeButtons = transitiveState.activeButtons.flatMap(
        (btn, idx) => {
          const emoji = staticState.buttonEmojis[idx];
          if (emoji && btn) {
            const [existingEmoji] = btn;
            if (existingEmoji === emoji && currentlyHasOverlap) {
              overlapEnd = idx;
            }
          } else {
            currentlyHasOverlap = false;
          }

          if (emoji) {
            return [[emoji, internalState.id]];
          } else {
            return [];
          }
        }
      );

      let reactStartPoint = overlapEnd;
      if (overlapEnd <= staticState.buttonEmojis.length - 1) {
        for (let i = oldActiveButtons.length; overlapEnd < i; i--) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const [emoji] = oldActiveButtons[i]!;
          await transitiveState.msg.reactions.cache.get(emoji)?.remove();
        }
      } else {
        reactStartPoint = 0;
        await transitiveState.msg.reactions.removeAll();
      }

      for (let i = reactStartPoint; i < staticState.buttonEmojis.length; i++) {
        const emoji = staticState.buttonEmojis[i];
        void transitiveState.msg.react(emoji);
      }
    },
  };

  staticState.pieces.splice(firstBtnPieceIdx, 0, buttonMapper);
}

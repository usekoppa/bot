import { Asyncable } from "@utils/types";

import {
  BaseMessageComponent,
  ButtonInteraction,
  Client,
  Collection,
  EmojiIdentifierResolvable,
  EmojiResolvable,
  InteractionCollector,
  Message,
} from "discord.js";
import type { RawMessageData } from "discord.js/typings/rawDataTypes";

import { MessageButtonStyles } from "./message_button_styles";

type LinkButton = Omit<
  Button,
  | "setStyle"
  | "customId"
  | "setTimeLimit"
  | "onClick"
  | "setMaxClicks"
  | "stop"
  | "onTimeLimit"
  | "onFinished"
  | "_execute"
> & {
  style: MessageButtonStyles.LINK;
  url: string;
};

type OnClickHandler = (interaction: ButtonInteraction) => Asyncable<void>;
type OnEndHandler = (
  collected: Collection<string, ButtonInteraction>
) => Asyncable<void>;

// 15 minutes in ms, which is the maximum time an interaction token is valid.
const FIFTEEN_MINS = 900_000;

// The default timer length, 2 mins in ms.
const TWO_MINS = 120_000;

export class Button extends BaseMessageComponent {
  customId?: string;
  disabled = false;
  emoji?: EmojiResolvable;
  label!: string;
  style: MessageButtonStyles = MessageButtonStyles.PRIMARY;
  readonly type = "BUTTON";
  url?: string;

  #maxClicks = 1;
  #time = TWO_MINS;
  #onClickHdlr?: OnClickHandler;
  #collector?: InteractionCollector<ButtonInteraction>;
  #onEnd?: OnEndHandler;
  #onTimerFinish?: OnEndHandler;

  constructor() {
    super();
  }

  setName(name: string) {
    this.label = name;
    this.customId = name.toLowerCase();
    return this;
  }

  setDisabled(disabled?: boolean) {
    this.disabled = disabled ?? true;
    return this;
  }

  setEmoji(emoji: EmojiIdentifierResolvable) {
    this.emoji = emoji;
    return this;
  }

  setStyle(style: MessageButtonStyles) {
    this.style = style;
    return this;
  }

  setURL(url: string) {
    this.customId = void 0;
    this.url = url;
    this.style = MessageButtonStyles.LINK;
    return this as unknown as LinkButton;
  }

  setMaxClicks(max: number) {
    this.#maxClicks = max;
    return this;
  }

  setTimeLimit(time: number) {
    if (time > FIFTEEN_MINS) {
      throw new RangeError("Time limit can not be > 15 minutes");
    }

    this.#time = time;
    return this;
  }

  _execute(client: Client, msg: Message | RawMessageData) {
    if (!(msg instanceof Message)) msg = new Message(client, msg);
    if (typeof this.#onClickHdlr === "undefined") {
      throw new Error("On Click handler not set");
    }

    this.#collector = msg.createMessageComponentCollector({
      time: this.#time,
      max: this.#maxClicks,
      componentType: "BUTTON",
      filter: interaction => {
        void interaction.deferUpdate();
        // Custom id is guaranteed to exist since creating the button would be impossible
        // without setting it, the Discord API would throw a fit otherwise.
        return interaction.customId === this.customId!;
      },
    });

    this.#collector.on("collector", this.#onClickHdlr);
    this.#collector.on("end", (collected, reason) => {
      if (reason === "time") return this.#onTimerFinish?.(collected);
      this.#onEnd?.(collected);
    });
  }

  onClick(hdlr: OnClickHandler) {
    this.#onClickHdlr = hdlr;
    return this;
  }

  stop(reason?: string) {
    if (typeof this.#onClickHdlr === "undefined") return;

    this.#collector?.off(
      "collect",
      // Blame crap discord.js types. :/
      this.#onClickHdlr as (...args: unknown[]) => void
    );

    this.#collector?.stop(reason);
  }

  onFinished(handler: OnEndHandler) {
    this.#onEnd = handler;
    return this;
  }

  onTimeLimit(handler: OnEndHandler) {
    this.#onTimerFinish = handler;
    return this;
  }

  toJSON(): unknown {
    throw new Error("Method not implemented.");
  }
}

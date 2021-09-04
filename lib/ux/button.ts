import {
  Client,
  EmojiIdentifierResolvable,
  EmojiResolvable,
  Message,
} from "discord.js";
import type { RawMessageData } from "discord.js/typings/rawDataTypes";

import { ComponentType } from "./component_type";
import { MessageButtonStyles } from "./message_button_styles";

type LinkButton = Exclude<Button, "setStyle" | "customId"> & {
  style: MessageButtonStyles.LINK;
  url: string;
};

export class Button {
  customId?: string;
  disabled = false;
  emoji?: EmojiResolvable;
  label!: string;
  style: MessageButtonStyles = MessageButtonStyles.PRIMARY;
  readonly type = ComponentType.Button;
  url?: string;

  #maxClicks = 1;

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

  _execute(client: Client, msg: Message | RawMessageData) {
    if (!(msg instanceof Message)) msg = new Message(client, msg);
    msg.createMessageComponentCollector({
      maxComponents: this.#maxClicks,
      filter: interaction => {
        return (
          interaction.isButton() && interaction.customId === this.customId!
        );
      },
    });
  }

  onClick() {
    // TODO: Add an on click handler.
  }

  toJSON(): unknown {
    throw new Error("Method not implemented.");
  }
}

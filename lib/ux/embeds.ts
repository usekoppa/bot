import { inspect } from "util";

import { Message, MessageEmbed, User } from "discord.js";

import { getAvatarURL } from "./avatars";

export const enum EmbedColours {
  Primary = 0x4fcdb9,
  Warning = 0xebb723,
  Error = 0xe32b2b,
  CriticalError = 0xa62626,
}

export interface EmbedOpts {
  author?: User;
  footer?: string;
}

export function createEmbed(opts: EmbedOpts) {
  let footerStr = "";
  if (opts.author) {
    footerStr = `Ran by ${opts.author.tag}`;
    if (opts.footer) footerStr += " | ";
  }

  if (opts.footer) footerStr += opts.footer;

  const res = new MessageEmbed().setColor(EmbedColours.Primary);
  if (footerStr) {
    res.setFooter(footerStr, opts.author ? getAvatarURL(opts.author) : void 0);
  }

  return res;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createErrorEmbed(msg: Message, err?: any) {
  const errEmb = createEmbed(msg)
    .setTitle(":x: Something went wrong!")
    .setColor(EmbedColours.Error);

  if (typeof err !== "undefined") {
    const trueErr = err instanceof Error ? err : new Error(err);
    errEmb.setDescription("```" + inspect(trueErr) + "```");
  } else {
    errEmb.setDescription("This incident has been reported");
  }

  return errEmb;
}

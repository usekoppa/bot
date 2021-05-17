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
  footerNote?: string;
}

export function createEmbed(opts: EmbedOpts) {
  let footerStr = "";
  if (opts.author) {
    footerStr = `Ran by ${opts.author.tag}`;
    if (opts.footerNote) footerStr += " | ";
  }

  if (opts.footerNote) footerStr += opts.footerNote;

  const res = new MessageEmbed().setColor(EmbedColours.Primary);
  if (footerStr) {
    res.setFooter(footerStr, opts.author ? getAvatarURL(opts.author) : void 0);
  }

  return res;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createErrorEmbed(msg: Message, err: any) {
  const trueErr = err instanceof Error ? err : new Error(err);
  return createEmbed({
    author: msg.author,
    footerNote: "This incident has been reported",
  })
    .setTitle(":x: Something went wrong!")
    .setColor(EmbedColours.Error)
    .setDescription("```" + `${trueErr.name}: ${trueErr.message}` + "```");
}

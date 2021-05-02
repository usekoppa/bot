import { MessageEmbed, User } from "discord.js";

import { getAvatarURL } from "./avatars";

export const enum EmbedColours {
  Primary = 0x4fcdb9,
  Warning = 0xebb723,
  Error = 0xe32b2b,
  CriticalError = 0xa62626,
}

export interface EmbedOpts {
  colour?: EmbedColours;
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

  const res = new MessageEmbed().setColor(opts.colour ?? EmbedColours.Primary);
  if (footerStr) {
    res.setFooter(footerStr, opts.author ? getAvatarURL(opts.author) : void 0);
  }

  return res;
}

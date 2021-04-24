// Utilities for use in commands.

import { MessageEmbed, User } from "discord.js";

import { getAvatarURL } from "./avatars";

export const enum EmbedColours {
  Primary = 0x4fcdb9,
  Warning = 0xebb723,
  Error = 0xe32b2b,
  CriticalError = 0xa62626,
}

export function createGenericResponse(author: User, extraInfo?: string) {
  let footerStr = `Ran by ${author.tag}`;
  if (extraInfo) {
    footerStr += ` | ${extraInfo}`;
  }

  return new MessageEmbed()
    .setColor(EmbedColours.Primary)
    .setFooter(footerStr, getAvatarURL(author));
}

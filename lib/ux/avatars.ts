import { User } from "discord.js-light";

export const DEFAULT_AVATAR_URL =
  "https://cdn.discordapp.com/embed/avatars/0.png";

export function getAvatarURL(user: User) {
  return user.avatarURL({ dynamic: true }) ?? DEFAULT_AVATAR_URL;
}

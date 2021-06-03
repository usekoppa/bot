import { Parser } from "@parser/parser";

import { GuildMember, User } from "discord.js-light";

export function userParser(member: false): User;
export function userParser(member: true): GuildMember;
export function userParser(member = true): User | GuildMember | undefined {}

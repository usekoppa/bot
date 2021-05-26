/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnionToTuple } from "@utils/types";

import {
  Channel,
  CloseEvent,
  Collection,
  Guild,
  GuildEmoji,
  GuildMember,
  Invite,
  Message,
  MessageReaction,
  PartialDMChannel,
  PartialGuildMember,
  PartialMessage,
  PartialUser,
  Presence,
  RateLimitData,
  Role,
  Snowflake,
  Speaking,
  TextChannel,
  User,
  VoiceState,
} from "discord.js";

export interface ClientEvents {
  channelCreate: { channel: Channel };
  channelDelete: { channel: Channel | PartialDMChannel };
  channelPinsUpdate: { channel: Channel | PartialDMChannel; time: Date };
  channelUpdate: { oldChannel: Channel | undefined; newChannel: Channel };
  debug: { info: string };
  warn: { info: string };
  // disconnect: [any, number];
  emojiCreate: { emoji: GuildEmoji };
  emojiDelete: { emoji: GuildEmoji };
  emojiUpdate: { oldEmoji: GuildEmoji; newEmoji: GuildEmoji };
  error: { reason: Error };
  guildBanAdd: { guild: Guild; user: User };
  guildBanRemove: { guild: Guild; user: User };
  guildCreate: { guild: Guild };
  guildDelete: { guild: Guild };
  guildUnavailable: { guild: Guild };
  guildIntegrationsUpdate: { guild: Guild };
  guildMemberAdd: { member: GuildMember };
  guildMemberAvailable: { member: GuildMember | PartialGuildMember };
  guildMemberRemove: { member: GuildMember | PartialGuildMember };
  guildMembersChunk: {
    members: Collection<Snowflake, GuildMember>;
    guild: Guild;
    chunk: { count: number; index: number; nonce: string | undefined };
  };
  guildMemberSpeaking: {
    member: GuildMember | PartialGuildMember;
    speaking: Readonly<Speaking>;
  };
  guildMemberUpdate: {
    oldMember: GuildMember | PartialGuildMember | undefined;
    newMember: GuildMember;
  };
  guildUpdate: { oldGuild: Guild; newGuild: Guild };
  inviteCreate: { invite: Invite };
  inviteDelete: { invite: Invite };
  message: { msg: Message };
  messageDelete: { msg: Message | PartialMessage };
  messageReactionRemoveAll: { msg: Message | PartialMessage };
  messageReactionRemoveEmoji: { reaction: MessageReaction };
  messageDeleteBulk: { msgs: Collection<Snowflake, Message | PartialMessage> };
  messageReactionAdd: { reaction: MessageReaction; user: User | PartialUser };
  messageReactionRemove: {
    reaction: MessageReaction;
    user: User | PartialUser;
  };
  messageUpdate: {
    oldMsg: Message | PartialMessage | undefined;
    newMsg: Message | PartialMessage;
  };
  presenceUpdate: { oldPresence: Presence | undefined; newPresence: Presence };
  rateLimit: { rateLimit: RateLimitData };
  ready: Record<string, any>;
  invalidated: Record<string, any>;
  roleCreate: { role: Role };
  roleDelete: { role: Role };
  roleUpdate: { oldRole: Role; newRole: Role };
  typingStart: {
    channel: Channel | PartialDMChannel;
    user: User | PartialUser;
  };
  userUpdate: { oldUser: User | PartialUser; newUser: User };
  voiceStateUpdate: { oldState: VoiceState; newState: VoiceState };
  webhookUpdate: { channel: TextChannel };
  shardDisconnect: { event: CloseEvent; id: number };
  shardError: { reason: Error; id: number };
  shardReady: { id: number; unavailableGuilds: Set<Snowflake> | undefined };
  shardReconnecting: { id: number };
  shardResume: { id: number; replayedEvents: number };
}

type ClientEventMap = {
  [E in keyof ClientEvents]: UnionToTuple<keyof ClientEvents[E]>;
};

export const clientEventMap: ClientEventMap = {
  channelCreate: ["channel"],
  channelDelete: ["channel"],
  channelPinsUpdate: ["channel", "time"],
  channelUpdate: ["oldChannel", "newChannel"],
  debug: ["info"],
  warn: ["info"],
  emojiCreate: ["emoji"],
  emojiDelete: ["emoji"],
  emojiUpdate: ["oldEmoji", "newEmoji"],
  error: ["reason"],
  guildBanAdd: ["guild", "user"],
  guildBanRemove: ["guild", "user"],
  guildCreate: ["guild"],
  guildDelete: ["guild"],
  guildUnavailable: ["guild"],
  guildIntegrationsUpdate: ["guild"],
  guildMemberAdd: ["member"],
  guildMemberAvailable: ["member"],
  guildMemberRemove: ["member"],
  guildMembersChunk: ["guild", "members", "chunk"],
  guildMemberSpeaking: ["member", "speaking"],
  guildMemberUpdate: ["oldMember", "newMember"],
  guildUpdate: ["oldGuild", "newGuild"],
  inviteCreate: ["invite"],
  inviteDelete: ["invite"],
  message: ["msg"],
  messageDelete: ["msg"],
  messageReactionRemoveAll: ["msg"],
  messageReactionRemoveEmoji: ["reaction"],
  messageDeleteBulk: ["msgs"],
  // @ts-expect-error Typescript is broken.
  messageReactionAdd: ["reaction", "user"],
  // @ts-ignore Same reason as before.
  messageReactionRemove: ["reaction", "user"],
  messageUpdate: ["oldMsg", "newMsg"],
  presenceUpdate: ["oldPresence", "newPresence"],
  rateLimit: ["rateLimit"],
  ready: [""],
  invalidated: [""],
  roleCreate: ["role"],
  roleDelete: ["role"],
  roleUpdate: ["oldRole", "newRole"],
  typingStart: ["channel", "user"],
  userUpdate: ["oldUser", "newUser"],
  voiceStateUpdate: ["oldState", "newState"],
  webhookUpdate: ["channel"],
  shardDisconnect: ["event", "id"],
  shardError: ["reason", "id"],
  shardReady: ["id", "unavailableGuilds"],
  shardReconnecting: ["id"],
  shardResume: ["id", "replayedEvents"],
};

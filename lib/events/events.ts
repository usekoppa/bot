/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnionToTuple } from "@utils/types";

import {
  ApplicationCommand,
  Client,
  CloseEvent,
  Collection,
  DMChannel,
  Guild,
  GuildBan,
  GuildChannel,
  GuildEmoji,
  GuildMember,
  Interaction,
  InvalidRequestWarningData,
  Invite,
  Message,
  MessageReaction,
  PartialGuildMember,
  PartialMessage,
  PartialMessageReaction,
  PartialUser,
  Presence,
  RateLimitData,
  Role,
  Snowflake,
  StageInstance,
  Sticker,
  TextBasedChannels,
  TextChannel,
  ThreadChannel,
  ThreadMember,
  Typing,
  User,
  VoiceState,
} from "discord.js";

export interface Events {
  applicationCommandCreate: { command: ApplicationCommand };
  applicationCommandDelete: { command: ApplicationCommand };
  applicationCommandUpdate: {
    oldCommand: ApplicationCommand | null;
    newCommand: ApplicationCommand;
  };
  channelCreate: { channel: GuildChannel };
  channelDelete: { channel: DMChannel | GuildChannel };
  channelPinsUpdate: { channel: TextBasedChannels; date: Date };
  channelUpdate: {
    oldChannel: DMChannel | GuildChannel;
    newChannel: DMChannel | GuildChannel;
  };
  debug: { info: string };
  warn: { info: string };
  emojiCreate: { emoji: GuildEmoji };
  emojiDelete: { emoji: GuildEmoji };
  emojiUpdate: { oldEmoji: GuildEmoji; newEmoji: GuildEmoji };
  error: { error: Error };
  guildBanAdd: { ban: GuildBan };
  guildBanRemove: { ban: GuildBan };
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
    data: { count: number; index: number; nonce: string | undefined };
  };
  guildMemberUpdate: {
    oldMember: GuildMember | PartialGuildMember;
    newMember: GuildMember;
  };
  guildUpdate: { oldGuild: Guild; newGuild: Guild };
  inviteCreate: { invite: Invite };
  inviteDelete: { invite: Invite };
  messageCreate: { message: Message };
  messageDelete: { message: Message | PartialMessage };
  messageReactionRemoveAll: { message: Message | PartialMessage };
  messageReactionRemoveEmoji: {
    reaction: MessageReaction | PartialMessageReaction;
  };
  messageDeleteBulk: {
    messages: Collection<Snowflake, Message | PartialMessage>;
  };
  messageReactionAdd: {
    message: MessageReaction | PartialMessageReaction;
    user: User | PartialUser;
  };
  messageReactionRemove: {
    reaction: MessageReaction | PartialMessageReaction;
    user: User | PartialUser;
  };
  messageUpdate: {
    oldMessage: Message | PartialMessage;
    newMessage: Message | PartialMessage;
  };
  presenceUpdate: { oldPresence: Presence | null; newPresence: Presence };
  rateLimit: { rateLimitData: RateLimitData };
  invalidRequestWarning: {
    invalidRequestWarningData: InvalidRequestWarningData;
  };
  ready: { client: Client<true> };
  invalidated: Record<string, never>;
  roleCreate: { role: Role };
  roleDelete: { role: Role };
  roleUpdate: { oldRole: Role; newRole: Role };
  threadCreate: { thread: ThreadChannel };
  threadDelete: { thread: ThreadChannel };
  threadListSync: { threads: Collection<Snowflake, ThreadChannel> };
  threadMemberUpdate: { oldMember: ThreadMember; newMember: ThreadMember };
  threadMembersUpdate: {
    oldMembers: Collection<Snowflake, ThreadMember>;
    mewMembers: Collection<Snowflake, ThreadMember>;
  };
  threadUpdate: { oldThread: ThreadChannel; newThread: ThreadChannel };
  typingStart: { typing: Typing };
  userUpdate: { oldUser: User | PartialUser; newUser: User };
  voiceStateUpdate: { oldState: VoiceState; newState: VoiceState };
  webhookUpdate: { channel: TextChannel };
  interactionCreate: { interaction: Interaction };
  shardDisconnect: { closeEvent: CloseEvent; shardId: number };
  shardError: { error: Error; shardId: number };
  shardReady: {
    shardId: number;
    unavailableGuilds: Set<Snowflake> | undefined;
  };
  shardReconnecting: { shardId: number };
  shardResume: { shardId: number; replayedEvents: number };
  stageInstanceCreate: { stageInstance: StageInstance };
  stageInstanceUpdate: {
    oldStageInstance: StageInstance | null;
    newStageInstance: StageInstance;
  };
  stageInstanceDelete: { stageInstance: StageInstance };
  stickerCreate: { sticker: Sticker };
  stickerDelete: { sticker: Sticker };
  stickerUpdate: { oldSticker: Sticker; newSticker: Sticker };
}

export type EventsMap = {
  [E in keyof Events]: UnionToTuple<keyof Events[E]>;
};

// This allows us to reduce an array of arguments that the client event emitter
// supplies into an object which ultimately becomes the context.
export const eventsMap: EventsMap = {
  applicationCommandCreate: ["command"],
  applicationCommandDelete: ["command"],
  applicationCommandUpdate: ["oldCommand", "newCommand"],
  channelCreate: ["channel"],
  channelDelete: ["channel"],
  channelPinsUpdate: ["channel", "date"],
  channelUpdate: ["oldChannel", "newChannel"],
  debug: ["info"],
  warn: ["info"],
  emojiCreate: ["emoji"],
  emojiDelete: ["emoji"],
  emojiUpdate: ["oldEmoji", "newEmoji"],
  error: ["error"],
  guildBanAdd: ["ban"],
  guildBanRemove: ["ban"],
  guildCreate: ["guild"],
  guildDelete: ["guild"],
  guildIntegrationsUpdate: ["guild"],
  guildMemberAdd: ["member"],
  guildMemberAvailable: ["member"],
  guildMemberRemove: ["member"],
  guildMemberUpdate: ["oldMember", "newMember"],
  guildMembersChunk: ["guild", "members", "data"],
  guildUnavailable: ["guild"],
  guildUpdate: ["oldGuild", "newGuild"],
  inviteCreate: ["invite"],
  inviteDelete: ["invite"],
  messageCreate: ["message"],
  messageDelete: ["message"],
  messageDeleteBulk: ["messages"],
  messageReactionAdd: ["message", "user"],
  // @ts-ignore Some dumb ts error here for some reason.
  messageReactionRemove: ["user", "reaction"],
  messageReactionRemoveAll: ["message"],
  messageReactionRemoveEmoji: ["reaction"],
  messageUpdate: ["oldMessage", "newMessage"],
  presenceUpdate: ["oldPresence", "newPresence"],
  rateLimit: ["rateLimitData"],
  invalidRequestWarning: ["invalidRequestWarningData"],
  ready: ["client"],
  invalidated: [""],
  roleCreate: ["role"],
  roleDelete: ["role"],
  roleUpdate: ["oldRole", "newRole"],
  threadCreate: ["thread"],
  threadDelete: ["thread"],
  threadListSync: ["threads"],
  threadMemberUpdate: ["oldMember", "newMember"],
  threadMembersUpdate: ["oldMembers", "mewMembers"],
  threadUpdate: ["oldThread", "newThread"],
  typingStart: ["typing"],
  userUpdate: ["oldUser", "newUser"],
  voiceStateUpdate: ["oldState", "newState"],
  webhookUpdate: ["channel"],
  interactionCreate: ["interaction"],
  shardDisconnect: ["closeEvent", "shardId"],
  shardError: ["error", "shardId"],
  shardReady: ["shardId", "unavailableGuilds"],
  shardReconnecting: ["shardId"],
  shardResume: ["shardId", "replayedEvents"],
  stageInstanceCreate: ["stageInstance"],
  stageInstanceDelete: ["stageInstance"],
  stageInstanceUpdate: ["oldStageInstance", "newStageInstance"],
  stickerCreate: ["sticker"],
  stickerDelete: ["sticker"],
  stickerUpdate: ["oldSticker", "newSticker"],
};

import { Client, ColorResolvable, EmbedBuilder, Message, TextChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { Giveaway } from './Giveaway';
import { JsonStorage } from './storage/JsonStorage';
import { ManagerOptions, Participant } from './types';

// Giveaway actions
import { deleteGiveaway } from './actions/delete';
import { editGiveaway } from './actions/edit';
import { endGiveaway } from './actions/end';
import { getLeaderboard, sendLeaderboard } from './actions/leaderboard';
import { listGiveaways } from './actions/list';
import { pauseGiveaway } from './actions/pause';
import { rerollGiveaway } from './actions/reroll';
import { resumeGiveaway } from './actions/resume';
import { startGiveaway } from './actions/start';
import { generateTranscript } from './actions/transcript';

// Collectors
import { createCollectorForGiveaway } from './collectors/createCollectorForGiveaway';
import { restoreCollectors } from './collectors/restoreCollectors';
import { syncParticipantsFromReactions } from './collectors/syncParticipants';

export interface GiveawayEvents {
  participantJoined: (participant: Participant, giveaway: Giveaway) => void;
  participantLeft: (participant: Participant, giveaway: Giveaway) => void;
  entryFailed: (participant: Participant, giveaway: Giveaway, reason: string | { code: 'notInRequiredGuild'; guildName?: string; inviteURL?: string; guildIcon?: string } | { code: 'invalidInvite'; inviteURL?: string } | { code: 'missingRequiredRole'; roleId: string }) => void;
  giveawayWon: (winners: Participant[], giveaway: Giveaway) => void;
  giveawayRerolled: (newWinners: Participant[], giveaway: Giveaway) => void;
  entryAfterEnd: (participant: Participant, giveaway: Giveaway) => void;
}

export declare interface GiveawaysManager {
  on<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
  once<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
  off<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
  emit<U extends keyof GiveawayEvents>(event: U, ...args: Parameters<GiveawayEvents[U]>): boolean;
}

export class GiveawaysManager extends EventEmitter {
  public client: Client;
  public storage: JsonStorage;
  public giveaways: Giveaway[] = [];
  private collectors: Map<string, any> = new Map();

  public defaults: {
    botsCanWin: boolean;
    embedColor: ColorResolvable;
    embedColorEnd: ColorResolvable;
    checkInterval: number;
    type: 'reaction' | 'button';
    emoji: string;
  };

  public messages: Record<string, string>;
  public lastChance?: {
    enabled: boolean;
    content: string;
    threshold: number;
    embedColor: ColorResolvable;
  };
  public pauseOptions?: {
    isPaused: boolean;
    content: string;
    unpauseAfter: number | null;
    embedColor: ColorResolvable;
    infiniteDurationText: string;
  };

  constructor(client: Client, options: ManagerOptions) {
    super();
    this.client = client;
    this.storage = new JsonStorage(options.storage);

    // Default giveaway options
    this.defaults = {
      botsCanWin: options.defaults?.botsCanWin ?? false,
      embedColor: options.defaults?.embedColor ?? '#FF0000',
      embedColorEnd: options.defaults?.embedColorEnd ?? '#000000',
      checkInterval: options.defaults?.checkInterval ?? 1000,
      type: options.defaults?.type ?? 'reaction',
      emoji: options.defaults?.emoji ?? '🎉',
    };

    // Default messages for giveaways
    this.messages = options.messages ?? {
      giveaway: '🎉 Giveaway 🎉',
      giveawayEnded: '🎉 Giveaway Ended 🎉',
      drawing: 'Ends at: {this.timestamp}',
      winnerCount: '{this.winnerCount}',
      inviteToParticipate: 'React with 🎉 to join!',
      winMessage: 'Congrats {winners}, you won {this.prize}!\n{this.messageURL}',
      embedFooter: '{this.winnerCount} winner(s)',
      noWinner: 'No valid participants for {this.prize}.',
      hostedBy: 'Hosted by: {this.hostedBy}',
      winners: 'Winner"s":',
      endedAt: 'Ended at',
      enterGiveaway: 'You joined the giveaway!',
      leaveGiveaway: 'You left the giveaway!',
    };

    // Last chance options
    this.lastChance = {
      enabled: options.lastChance?.enabled ?? true,
      content: options.lastChance?.content ?? '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
      threshold: options.lastChance?.threshold ?? 10_000,
      embedColor: options.lastChance?.embedColor ?? this.defaults.embedColor,
    };

    // Pause options
    this.pauseOptions = {
      isPaused: options.pauseOptions?.isPaused ?? false,
      content: options.pauseOptions?.content ?? '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
      unpauseAfter: options.pauseOptions?.unpauseAfter ?? null,
      embedColor: options.pauseOptions?.embedColor ?? '#FFFF00',
      infiniteDurationText: options.pauseOptions?.infiniteDurationText ?? '`NEVER`',
    };

    // Load existing giveaways from storage
    this.giveaways = this.storage.all().map(g => new Giveaway(g, this));

    // Regularly check for ending giveaways
    setInterval(() => this.checkGiveaways(), this.defaults.checkInterval);

    // Restore collectors after bot restart
    setTimeout(() => restoreCollectors(this), 5000);
  }

  async start(channel: TextChannel, options: any, managerOverrides?: Partial<ManagerOptions>) {
    // Merge default settings with overrides
    const mergedDefaults = { ...this.defaults, ...managerOverrides?.defaults };
    const mergedLastChance = {
      enabled: managerOverrides?.lastChance?.enabled ?? this.lastChance?.enabled ?? true,
      content: managerOverrides?.lastChance?.content ?? this.lastChance?.content ?? '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
      threshold: managerOverrides?.lastChance?.threshold ?? this.lastChance?.threshold ?? 10000,
      embedColor: managerOverrides?.lastChance?.embedColor ?? this.lastChance?.embedColor ?? this.defaults.embedColor,
    };
    const mergedPauseOptions = {
      isPaused: managerOverrides?.pauseOptions?.isPaused ?? this.pauseOptions?.isPaused ?? false,
      content: managerOverrides?.pauseOptions?.content ?? this.pauseOptions?.content ?? '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
      unpauseAfter: managerOverrides?.pauseOptions?.unpauseAfter ?? this.pauseOptions?.unpauseAfter ?? null,
      embedColor: managerOverrides?.pauseOptions?.embedColor ?? this.pauseOptions?.embedColor ?? '#FFFF00',
      infiniteDurationText: managerOverrides?.pauseOptions?.infiniteDurationText ?? this.pauseOptions?.infiniteDurationText ?? '`NEVER`',
    };
    const mergedMessages = managerOverrides?.messages ?? this.messages;

    // Create a temporary manager instance
    const tempManager = Object.create(this) as GiveawaysManager;

    // Apply custom settings
    tempManager.defaults = mergedDefaults;
    tempManager.lastChance = mergedLastChance;
    tempManager.pauseOptions = mergedPauseOptions;
    tempManager.messages = mergedMessages;

    // If server has custom storage, use it
    if (managerOverrides) {
      const guildId = (channel.guild?.id || 'global').toString();
      const storagePath = `./giveaways/${guildId}.json`; // Can switch to MongoStorage if needed
      tempManager.storage = new JsonStorage(storagePath);
    }

    // Determine type and emoji for giveaway
    const giveawayType = options.type ?? tempManager.defaults.type;
    const giveawayEmoji = options.emoji ?? tempManager.defaults.emoji;

    // Start the giveaway with server-specific settings
    const giveaway = await startGiveaway(tempManager, channel, {
      ...options,
      type: giveawayType,
      emoji: giveawayEmoji,
    });

    // Save giveaway to server storage
    tempManager.save();

    return giveaway;
  }

  async end(messageId: string) {
    return endGiveaway(this, messageId);
  }

  pause(messageId: string) {
    this.removeCollector(messageId);
    return pauseGiveaway(this, messageId);
  }

  async resume(messageId: string, newEndAt?: number) {
    const result = await resumeGiveaway(this, messageId, newEndAt);
    const giveaway = this.giveaways.find(g => g.data.messageId === messageId);
    if (giveaway && !giveaway.data.ended) {
      try {
        const channel = this.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
        if (channel) {
          const msg = await channel.messages.fetch(messageId).catch(() => null);
          if (msg) await createCollectorForGiveaway(this, giveaway, msg);
        }
      } catch (error) {
        console.error(`Failed to recreate collector after resume:`, error);
      }
    }
    return result;
  }

  edit(messageId: string, options: { prize?: string; winnerCount?: number; addTime?: number }) {
    return editGiveaway(this, messageId, options);
  }

  delete(messageId: string) {
    this.removeCollector(messageId);
    return deleteGiveaway(this, messageId);
  }

  list(status?: 'active' | 'paused' | 'ended') {
    return listGiveaways(this, status);
  }

  reroll(messageId: string, winnerCount?: number) {
    return rerollGiveaway(this, messageId, winnerCount);
  }

  leaderboard(type: 'entries' | 'wins' = 'entries', top = 10) {
    return getLeaderboard(this, type, top);
  }

  sendLeaderboard(channel: TextChannel, type: 'entries' | 'wins' = 'entries', top = 10) {
    return sendLeaderboard(this, channel, type, top);
  }

  async generateTranscript(messageId: string, outputDir?: string) {
    try {
      const filePath = await generateTranscript(this, messageId, { outputDir });
      return filePath;
    } catch (error) {
      console.error(`Failed to generate transcript for giveaway ${messageId}:`, error);
      throw error;
    }
  }

  save() {
    this.storage.saveAll(this.giveaways.map(g => g.data));
  }

  async createCollectorForGiveaway(giveaway: Giveaway, msg: Message) {
    this.removeCollector(giveaway.data.messageId);
    await createCollectorForGiveaway(this, giveaway, msg);
  }

  async syncParticipantsFromReactions(giveaway: Giveaway, msg: Message) {
    await syncParticipantsFromReactions(this, giveaway, msg);
  }

  private removeCollector(messageId: string) {
    const collector = this.collectors.get(messageId);
    if (collector) {
      collector.stop();
      this.collectors.delete(messageId);
    }
  }

  private async checkGiveaways() {
    const now = Date.now();

    for (const g of this.giveaways) {
      if (g.data.ended || g.data.paused) continue;

      try {
        // Attempt to fetch server-specific settings from database
        const GuildGiveawaySettings = require('@database/giveawaySchema');
        const guildSettings = await GuildGiveawaySettings.findOne({ guildId: g.data.guildId }).catch(() => null);

        // Determine lastChance settings by priority
        const lc = g.data.lastChance ?? guildSettings?.lastChance ?? this.lastChance;

        // Trigger lastChance if enabled and not triggered yet
        if (lc?.enabled && !g.data.lastChanceTriggered && g.data.endAt - now <= lc.threshold) {
          const channel = this.client.channels.cache.get(g.data.channelId);
          if (!channel || !channel.isTextBased()) continue;

          const msg = await channel.messages.fetch(g.data.messageId!).catch(() => null);
          if (!msg) continue;

          // Use lastChance color from giveaway, server, or default
          const embedColor = lc.embedColor ?? guildSettings?.lastChance?.embedColor ?? this.defaults.embedColor;

          const embed = EmbedBuilder.from(msg.embeds[0]).setColor(embedColor as ColorResolvable);
          await msg.edit({ content: lc.content, embeds: [embed] });

          g.data.lastChanceTriggered = true;
          this.save();
        }

        // End giveaway if time has passed
        if (g.data.endAt <= now) await this.end(g.data.messageId!);
      } catch (err) {
        console.error('Last chance update failed:', err);
      }
    }
  }
}

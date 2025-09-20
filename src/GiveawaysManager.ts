import { Client, ColorResolvable, EmbedBuilder, Message, TextChannel } from 'discord.js';

import { EventEmitter } from 'events';
import { Giveaway } from './Giveaway';
import { JsonStorage } from './storage/JsonStorage';
import { ManagerOptions, Participant } from './types';

// Actions for giveaways
import { deleteGiveaway } from './actions/delete';
import { editGiveaway } from './actions/edit';
import { endGiveaway } from './actions/end';
import { getLeaderboard, sendLeaderboard } from './actions/leaderboard';
import { listGiveaways } from './actions/list';
import { pauseGiveaway } from './actions/pause';
import { rerollGiveaway } from './actions/reroll';
import { resumeGiveaway } from './actions/resume';
import { startGiveaway } from './actions/start';

// Collectors to handle reactions or buttons
import { createCollectorForGiveaway } from './collectors/createCollectorForGiveaway';
import { restoreCollectors } from './collectors/restoreCollectors';
import { syncParticipantsFromReactions } from './collectors/syncParticipants';

/**
 * Events emitted by the GiveawaysManager
 */
export interface GiveawayEvents {
  /** When a participant joins a giveaway */
  giveawayJoin: (participant: Participant, giveaway: Giveaway) => void;
  /** When a participant leaves a giveaway */
  giveawayLeave: (participant: Participant, giveaway: Giveaway) => void;
  /** When a user tries to enter but fails validation */
  giveawayInvalidEntry: (userId: string, giveaway: Giveaway) => void;
}

/**
 * EventEmitter typings for GiveawaysManager
 */
export declare interface GiveawaysManager {
  on<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
  once<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
  off<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
  emit<U extends keyof GiveawayEvents>(event: U, ...args: Parameters<GiveawayEvents[U]>): boolean;
}

/**
 * Main class for managing giveaways
 */
export class GiveawaysManager extends EventEmitter {
  public client: Client; // Discord client instance
  public storage: JsonStorage; // Storage handler for giveaways
  public giveaways: Giveaway[] = []; // Array of all giveaways
  private collectors: Map<string, any> = new Map(); // Active collectors for giveaways

  // Default settings for giveaways
  public defaults: {
    botsCanWin: boolean;
    embedColor: ColorResolvable;
    embedColorEnd: ColorResolvable;
    checkInterval: number;
    type: 'reaction' | 'button';
    emoji: string;
  };

  public messages: Record<string, string>; // Messages for giveaway notifications
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

  /**
   * Constructor
   * @param client Discord client
   * @param options Manager configuration options
   */
  constructor(client: Client, options: ManagerOptions) {
    super();
    this.client = client;
    this.storage = new JsonStorage(options.storage);

    // Set default options with fallback values
    this.defaults = {
      botsCanWin: options.defaults?.botsCanWin ?? false,
      embedColor: options.defaults?.embedColor ?? '#FF0000',
      embedColorEnd: options.defaults?.embedColorEnd ?? '#000000',
      checkInterval: options.defaults?.checkInterval ?? 1000,
      type: options.defaults?.type ?? 'reaction',
      emoji: options.defaults?.emoji ?? '🎉',
    };

    // Default messages
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

    // Last chance settings
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

    // Load all giveaways from storage
    this.giveaways = this.storage.all().map(g => new Giveaway(g, this));

    // Check giveaways periodically
    setInterval(() => this.checkGiveaways(), this.defaults.checkInterval);

    // Restore collectors after initialization
    setTimeout(() => restoreCollectors(this), 5000);
  }

  /**
   * Start a new giveaway
   */
  async start(channel: TextChannel, options: any, managerOverrides?: Partial<ManagerOptions>) {
    // Merge defaults and overrides
    const mergedDefaults = { ...this.defaults, ...managerOverrides?.defaults };
    const mergedLastChance = {
      enabled: managerOverrides?.lastChance?.enabled ?? this.lastChance?.enabled ?? true,
      content:
        managerOverrides?.lastChance?.content ??
        this.lastChance?.content ??
        '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
      threshold: managerOverrides?.lastChance?.threshold ?? this.lastChance?.threshold ?? 10000,
      embedColor:
        managerOverrides?.lastChance?.embedColor ??
        this.lastChance?.embedColor ??
        this.defaults.embedColor,
    };
    const mergedPauseOptions = {
      isPaused: managerOverrides?.pauseOptions?.isPaused ?? this.pauseOptions?.isPaused ?? false,
      content:
        managerOverrides?.pauseOptions?.content ??
        this.pauseOptions?.content ??
        '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
      unpauseAfter:
        managerOverrides?.pauseOptions?.unpauseAfter ?? this.pauseOptions?.unpauseAfter ?? null,
      embedColor:
        managerOverrides?.pauseOptions?.embedColor ?? this.pauseOptions?.embedColor ?? '#FFFF00',
      infiniteDurationText:
        managerOverrides?.pauseOptions?.infiniteDurationText ??
        this.pauseOptions?.infiniteDurationText ??
        '`NEVER`',
    };
    const mergedMessages = managerOverrides?.messages ?? this.messages;

    const tempManager = Object.create(this) as GiveawaysManager;
    tempManager.defaults = mergedDefaults;
    tempManager.lastChance = mergedLastChance;
    tempManager.pauseOptions = mergedPauseOptions;
    tempManager.messages = mergedMessages;

    const giveawayType = options.type ?? tempManager.defaults.type;
    const giveawayEmoji = options.emoji ?? tempManager.defaults.emoji;

    return startGiveaway(tempManager, channel, {
      ...options,
      type: giveawayType,
      emoji: giveawayEmoji,
    });
  }

  /** End a giveaway */
  async end(messageId: string) {
    this.removeCollector(messageId);
    return endGiveaway(this, messageId);
  }

  /** Pause a giveaway */
  pause(messageId: string) {
    this.removeCollector(messageId);
    return pauseGiveaway(this, messageId);
  }

  /** Resume a paused giveaway */
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

  /** Edit giveaway details */
  edit(messageId: string, options: { prize?: string; winnerCount?: number; addTime?: number }) {
    return editGiveaway(this, messageId, options);
  }

  /** Delete a giveaway */
  delete(messageId: string) {
    this.removeCollector(messageId);
    return deleteGiveaway(this, messageId);
  }

  /** List giveaways by status */
  list(status?: 'active' | 'paused' | 'ended') {
    return listGiveaways(this, status);
  }

  /** Reroll winners */
  reroll(messageId: string, winnerCount?: number) {
    return rerollGiveaway(this, messageId, winnerCount);
  }

  /** Get leaderboard */
  leaderboard(type: 'entries' | 'wins' = 'entries', top = 10) {
    return getLeaderboard(this, type, top);
  }

  /** Send leaderboard to a channel */
  sendLeaderboard(channel: TextChannel, type: 'entries' | 'wins' = 'entries', top = 10) {
    return sendLeaderboard(this, channel, type, top);
  }

  /** Save all giveaways to storage */
  save() {
    this.storage.saveAll(this.giveaways.map(g => g.data));
  }

  /** Create a collector for a giveaway */
  async createCollectorForGiveaway(giveaway: Giveaway, msg: Message) {
    this.removeCollector(giveaway.data.messageId);
    await createCollectorForGiveaway(this, giveaway, msg);
  }

  /** Sync participants from reactions */
  async syncParticipantsFromReactions(giveaway: Giveaway, msg: Message) {
    await syncParticipantsFromReactions(this, giveaway, msg);
  }

  /** Remove active collector */
  private removeCollector(messageId: string) {
    const collector = this.collectors.get(messageId);
    if (collector) {
      collector.stop();
      this.collectors.delete(messageId);
    }
  }

  /** Periodically check all giveaways */
  private async checkGiveaways() {
    const now = Date.now();
    for (const g of this.giveaways) {
      if (g.data.ended || g.data.paused) continue;

      // Last chance notification
      if (
        this.lastChance?.enabled &&
        !g.data.lastChanceTriggered &&
        g.data.endAt - now <= this.lastChance.threshold
      ) {
        try {
          const channel = this.client.channels.cache.get(g.data.channelId) as TextChannel;
          if (!channel) continue;
          const msg = await channel.messages.fetch(g.data.messageId!).catch(() => null);
          if (!msg) continue;

          const embed = EmbedBuilder.from(msg.embeds[0]).setColor(
            this.lastChance?.embedColor ?? this.defaults.embedColor
          );
          await msg.edit({ content: this.lastChance.content, embeds: [embed] });

          g.data.lastChanceTriggered = true;
          this.save();
        } catch (err) {
          console.error('Last chance update failed:', err);
        }
      }

      // End giveaway if time reached
      if (g.data.endAt <= now) await this.end(g.data.messageId!);
    }
  }
}

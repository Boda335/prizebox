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
  giveawayPaused: (giveaway: Giveaway) => void;
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
    embedColor: ColorResolvable;
    pausedAt?: number;
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
      embedColor: options.pauseOptions?.embedColor ?? '#FFFF00',
      infiniteDurationText: options.pauseOptions?.infiniteDurationText ?? '`INFINITY`',
    };

    // Load existing giveaways from storage
    this.giveaways = this.storage.all().map(g => new Giveaway(g, this));

    // Regularly check for ending giveaways
    setInterval(() => this.checkGiveaways(), this.defaults.checkInterval);

    // Restore collectors after bot restart
    setTimeout(() => restoreCollectors(this), 5000);
  }

  async start(channel: TextChannel, options: any, managerOverrides?: Partial<ManagerOptions>) {
    // Merge manager defaults with overrides
    const activeDefaults = deepMerge(this.defaults, managerOverrides?.defaults || {});
    const activeLastChance = deepMerge(this.lastChance!, managerOverrides?.lastChance || {});
    const activePauseOptions = deepMerge(this.pauseOptions!, managerOverrides?.pauseOptions || {});
    const activeMessages = deepMerge(this.messages, managerOverrides?.messages || {});

    // Create temporary manager instance with merged options
    const tempManager = Object.create(this) as GiveawaysManager;
    tempManager.defaults = activeDefaults;
    tempManager.lastChance = activeLastChance;
    tempManager.pauseOptions = activePauseOptions;
    tempManager.messages = activeMessages;
    tempManager.storage = this.storage;

    const giveawayType = options.type ?? activeDefaults.type;
    const giveawayEmoji = options.emoji ?? activeDefaults.emoji;

    const giveaway = await startGiveaway(tempManager, channel, {
      ...options,
      type: giveawayType,
      emoji: giveawayEmoji,
    });

    tempManager.save();
    return giveaway;
  }

  async end(messageId: string) {
    return endGiveaway(this, messageId);
  }

  pause(messageId: string, unpauseAfter?: number) {
    this.removeCollector(messageId);
    return pauseGiveaway(this, messageId, unpauseAfter);
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
      return await generateTranscript(this, messageId, { outputDir });
    } catch (error) {
      console.error(`Failed to generate transcript for giveaway ${messageId}:`, error);
      throw error;
    }
  }

  save() {
    const giveawaysByGuild: Record<string, any[]> = {};
    this.giveaways.forEach(g => {
      if (!giveawaysByGuild[g.data.guildId]) giveawaysByGuild[g.data.guildId] = [];
      giveawaysByGuild[g.data.guildId].push(g.data);
    });
    this.storage.setAllGiveaways(giveawaysByGuild);
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
      // Auto-resume paused giveaway if unpauseAfter is set
      if (g.data.paused && g.data.pauseOptions?.unpauseAfter) {
        if (now >= g.data.pauseOptions.unpauseAfter) {
          await this.resume(g.data.messageId);
        }
        continue;
      }

      if (g.data.ended) continue;

      try {
        const lc = g.data.lastChance ?? this.lastChance;

        // LAST CHANCE FEATURE
        if (lc?.enabled && !g.data.lastChanceTriggered && g.data.endAt - now <= lc.threshold) {
          const channel = this.client.channels.cache.get(g.data.channelId);
          if (!channel || !channel.isTextBased()) continue;

          const msg = await channel.messages.fetch(g.data.messageId!).catch(() => null);
          if (!msg) continue;

          const embedColor = lc.embedColor ?? this.defaults.embedColor;
          const embed = EmbedBuilder.from(msg.embeds[0]).setColor(embedColor as ColorResolvable);
          await msg.edit({ content: lc.content, embeds: [embed] });

          g.data.lastChanceTriggered = true;
          this.save();
        }

        // End giveaway if time has passed
        if (g.data.endAt <= now) {
          await this.end(g.data.messageId!);
        }
      } catch (err) {
        console.error('Check giveaway failed:', err);
      }
    }
  }
}

function deepMerge<T>(base: T, override: Partial<T>): T {
  const result = { ...base };

  for (const key in override) {
    if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
      result[key] = deepMerge(result[key], override[key] as any);
    } else if (override[key] !== undefined) {
      result[key] = override[key] as any;
    }
  }

  return result;
}

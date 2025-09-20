import { ColorResolvable } from 'discord.js';

/**
 * Represents a participant in a giveaway.
 */
export interface Participant {
  /** Discord user ID */
  id: string;
  /** Discord username */
  username: string;
  /** Optional global name (can be null) */
  globalName?: string | null;
  /** URL to user's avatar */
  avatar: string;

  /** Number of entries the participant has in giveaways */
  entries?: number;
  /** Number of wins this participant has */
  wins?: number;
}

/**
 * Tracks user statistics.
 */
export interface UserStats {
  /** Total entries of the user */
  entries: number;
  /** Total wins of the user */
  wins: number;
}

/**
 * Stores statistics of all users in a guild.
 * Key is user ID, value is UserStats
 */
export interface GuildStats {
  [userId: string]: UserStats;
}

/**
 * Overall storage structure for giveaways and user stats.
 */
export interface StorageData {
  /** List of all giveaways */
  giveaways: GiveawayData[];
  /** User statistics by guild */
  userStats: {
    [guildId: string]: GuildStats;
  };
}

/**
 * Represents a single giveaway.
 */
export interface GiveawayData {
  /** ID of the giveaway message */
  messageId: string;
  /** ID of the channel where giveaway is posted */
  channelId: string;
  /** Guild (server) ID */
  guildId: string;
  /** Prize description */
  prize: string;
  /** Start timestamp (ms) */
  startAt: number;
  /** End timestamp (ms) */
  endAt: number;
  /** Has the giveaway ended */
  ended: boolean;
  /** Is the giveaway currently paused */
  paused: boolean;
  /** List of winner IDs */
  winnerIds: string[];
  /** List of participants */
  participants: Participant[];
  /** ID of the giveaway host */
  hostId: string;
  /** Number of winners */
  winnerCount: number;
  /** Type of giveaway: reaction-based or button-based */
  type: 'reaction' | 'button';
  /** Emoji used for reactions */
  emoji: string;
  /** Whether the last-chance message has been triggered */
  lastChanceTriggered?: boolean;
}

/**
 * Options for configuring the giveaway manager.
 */
export interface ManagerOptions {
  /** Path to storage file */
  storage: string;

  /** Custom messages for giveaways */
  messages?: Record<string, string>;

  /** Default settings for all giveaways */
  defaults?: {
    /** Can bots win giveaways? */
    botsCanWin?: boolean;
    /** Default embed color */
    embedColor?: ColorResolvable;
    /** Embed color when giveaway ends */
    embedColorEnd?: ColorResolvable;
    /** Default emoji for giveaways */
    emoji?: string;
    /** Default type of giveaway */
    type?: 'reaction' | 'button';
    /** Interval for checking giveaways (ms) */
    checkInterval?: number;
  };

  /** Last chance settings */
  lastChance?: {
    /** Enable last chance messages */
    enabled?: boolean;
    /** Content of last chance message */
    content?: string;
    /** Threshold in ms before end to trigger last chance */
    threshold?: number;
    /** Embed color for last chance */
    embedColor?: ColorResolvable;
  };

  /** Pause-related settings */
  pauseOptions?: {
    /** Is the giveaway paused by default */
    isPaused?: boolean;
    /** Content to display when paused */
    content?: string;
    /** Automatically unpause after specified time (ms), null = never */
    unpauseAfter?: number | null;
    /** Embed color for paused message */
    embedColor?: ColorResolvable;
    /** Text to display for infinite duration paused giveaways */
    infiniteDurationText?: string;
  };

  /** Whether to run in test mode */
  isTest?: boolean;
}

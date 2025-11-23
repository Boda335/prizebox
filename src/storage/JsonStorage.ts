import fs from 'fs';
import path from 'path';
import { BaseStorage } from './BaseStorage';
import { GiveawayData, StorageData, UserStats } from '../types';

/**
 * JsonStorage class handles reading and writing giveaways and user stats to a JSON file.
 * Modified to store giveaways per guild (server) as an array.
 */
export class JsonStorage extends BaseStorage {
  private file: string; // Path to the JSON file
  private data: StorageData; // In-memory storage of data

  constructor(file: string) {
    super();
    this.file = file;

    // Ensure the directory exists
    const dir = path.dirname(this.file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let rawData: string | null = null;

    // Load existing data if file exists
    if (fs.existsSync(this.file)) {
      try {
        rawData = fs.readFileSync(this.file, 'utf-8');
        const parsed = JSON.parse(rawData || '{}');

        // Ensure all fields exist
        this.data = {
          // giveaways is now an object where each key is a guildId and value is an array of giveaways
          giveaways: typeof parsed.giveaways === 'object' && parsed.giveaways !== null ? parsed.giveaways : {},
          // userStats stays the same
          userStats: typeof parsed.userStats === 'object' && parsed.userStats !== null ? parsed.userStats : {},
        };
      } catch (err) {
        console.error('[JsonStorage] Error parsing JSON:', err);
        this.data = { giveaways: {}, userStats: {} };
      }
    } else {
      this.data = { giveaways: {}, userStats: {} };
    }

    // Save back to file in case of missing fields
    this.saveAll();
  }

  /** Get all giveaways from all guilds */
  all(): GiveawayData[] {
    // Flatten all giveaways arrays into a single array
    return Object.values(this.data.giveaways).flat();
  }

  /** Get all giveaways for a specific guild */
  allForGuild(guildId: string): GiveawayData[] {
    return this.data.giveaways[guildId] ?? [];
  }

  /**
   * Get stats for a user in a specific guild
   * @param guildId Guild (server) ID
   * @param userId Discord user ID
   */
  getUserStats(guildId: string, userId: string): UserStats {
    if (!this.data.userStats[guildId]) this.data.userStats[guildId] = {};
    if (!this.data.userStats[guildId][userId]) {
      this.data.userStats[guildId][userId] = { entries: 0, wins: 0 };
    }
    return this.data.userStats[guildId][userId];
  }

  /**
   * Update user stats
   * @param guildId Guild ID
   * @param userId User ID
   * @param delta Changes to apply
   */
  updateUserStats(guildId: string, userId: string, delta: Partial<UserStats>) {
    const stats = this.getUserStats(guildId, userId);
    this.data.userStats[guildId][userId] = {
      entries: (stats.entries ?? 0) + (delta.entries ?? 0),
      wins: (stats.wins ?? 0) + (delta.wins ?? 0),
    };
    this.saveAll();
  }

  /** Get all user stats for all guilds */
  getAllUserStats(): StorageData['userStats'] {
    return this.data.userStats;
  }
  /**
   * Overwrite all giveaways object in storage
   * @param giveawaysByGuild Object where key = guildId, value = array of giveaways
   */
  public setAllGiveaways(giveawaysByGuild: Record<string, any[]>) {
    this.data.giveaways = giveawaysByGuild;
    this.saveAll();
  }

  /**
   * Save all giveaways and user stats to the JSON file
   * @param guildId Optional guild ID to overwrite giveaways for that guild
   * @param giveaways Optional array to overwrite giveaways for a specific guild
   */
  saveAll(guildId?: string, giveaways?: GiveawayData[]) {
    if (guildId && giveaways) {
      // Overwrite giveaways for specific guild
      this.data.giveaways[guildId] = giveaways;
    }
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.data));
    } catch (err) {
      console.error('[JsonStorage] Error saving JSON:', err);
    }
  }
}

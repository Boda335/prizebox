import { BaseStorage } from './BaseStorage';
import { GiveawayData, StorageData, UserStats } from '../types';
/**
 * JsonStorage class handles reading and writing giveaways and user stats to a JSON file.
 * Modified to store giveaways per guild (server) as an array.
 */
export declare class JsonStorage extends BaseStorage {
    private file;
    private data;
    constructor(file: string);
    /** Get all giveaways from all guilds */
    all(): GiveawayData[];
    /** Get all giveaways for a specific guild */
    allForGuild(guildId: string): GiveawayData[];
    /**
     * Get stats for a user in a specific guild
     * @param guildId Guild (server) ID
     * @param userId Discord user ID
     */
    getUserStats(guildId: string, userId: string): UserStats;
    /**
     * Update user stats
     * @param guildId Guild ID
     * @param userId User ID
     * @param delta Changes to apply
     */
    updateUserStats(guildId: string, userId: string, delta: Partial<UserStats>): void;
    /** Get all user stats for all guilds */
    getAllUserStats(): StorageData['userStats'];
    /**
     * Overwrite all giveaways object in storage
     * @param giveawaysByGuild Object where key = guildId, value = array of giveaways
     */
    setAllGiveaways(giveawaysByGuild: Record<string, any[]>): void;
    /**
     * Save all giveaways and user stats to the JSON file
     * @param guildId Optional guild ID to overwrite giveaways for that guild
     * @param giveaways Optional array to overwrite giveaways for a specific guild
     */
    saveAll(guildId?: string, giveaways?: GiveawayData[]): void;
}
//# sourceMappingURL=JsonStorage.d.ts.map
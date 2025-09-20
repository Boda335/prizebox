import { BaseStorage } from './BaseStorage';
import { GiveawayData, StorageData, UserStats } from '../types';
/**
 * JsonStorage class handles reading and writing giveaways and user stats to a JSON file.
 */
export declare class JsonStorage extends BaseStorage {
    private file;
    private data;
    constructor(file: string);
    /** Get all giveaways */
    all(): GiveawayData[];
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
     * Save all data to the JSON file
     * @param giveaways Optional array to overwrite giveaways
     */
    saveAll(giveaways?: GiveawayData[]): void;
}
//# sourceMappingURL=JsonStorage.d.ts.map
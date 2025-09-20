"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const BaseStorage_1 = require("./BaseStorage");
/**
 * JsonStorage class handles reading and writing giveaways and user stats to a JSON file.
 */
class JsonStorage extends BaseStorage_1.BaseStorage {
    constructor(file) {
        super();
        this.file = file;
        // Ensure the directory exists
        const dir = path_1.default.dirname(this.file);
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        let rawData = null;
        // Load existing data if file exists
        if (fs_1.default.existsSync(this.file)) {
            try {
                rawData = fs_1.default.readFileSync(this.file, 'utf-8');
                const parsed = JSON.parse(rawData || '{}');
                // Ensure all fields exist
                this.data = {
                    giveaways: Array.isArray(parsed.giveaways) ? parsed.giveaways : [],
                    userStats: typeof parsed.userStats === 'object' && parsed.userStats !== null
                        ? parsed.userStats
                        : {},
                };
            }
            catch (err) {
                console.error('[JsonStorage] Error parsing JSON:', err);
                this.data = { giveaways: [], userStats: {} };
            }
        }
        else {
            this.data = { giveaways: [], userStats: {} };
        }
        // Save back to file in case of missing fields
        this.saveAll();
    }
    /** Get all giveaways */
    all() {
        return this.data.giveaways;
    }
    /**
     * Get stats for a user in a specific guild
     * @param guildId Guild (server) ID
     * @param userId Discord user ID
     */
    getUserStats(guildId, userId) {
        if (!this.data.userStats[guildId])
            this.data.userStats[guildId] = {};
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
    updateUserStats(guildId, userId, delta) {
        const stats = this.getUserStats(guildId, userId);
        this.data.userStats[guildId][userId] = {
            entries: (stats.entries ?? 0) + (delta.entries ?? 0),
            wins: (stats.wins ?? 0) + (delta.wins ?? 0),
        };
        this.saveAll();
    }
    /** Get all user stats for all guilds */
    getAllUserStats() {
        return this.data.userStats;
    }
    /**
     * Save all data to the JSON file
     * @param giveaways Optional array to overwrite giveaways
     */
    saveAll(giveaways) {
        if (giveaways)
            this.data.giveaways = giveaways;
        try {
            fs_1.default.writeFileSync(this.file, JSON.stringify(this.data));
        }
        catch (err) {
            console.error('[JsonStorage] Error saving JSON:', err);
        }
    }
}
exports.JsonStorage = JsonStorage;
//# sourceMappingURL=JsonStorage.js.map
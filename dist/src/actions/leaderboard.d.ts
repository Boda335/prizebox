import { TextChannel } from 'discord.js';
import { GiveawaysManager } from '../GiveawaysManager';
/**
 * Builds a leaderboard array from stored user stats.
 * @param manager The GiveawaysManager instance
 * @param type "entries" | "wins" (default = "entries")
 * @param top Number of users to return (default = 10)
 * @returns Array of leaderboard objects
 */
export declare function getLeaderboard(manager: GiveawaysManager, type?: 'entries' | 'wins', top?: number): {
    rank: number;
    id: string;
    username: string;
    avatar: string;
    entries: number;
    wins: number;
}[];
/**
 * Sends the leaderboard to a given channel.
 * @param manager The GiveawaysManager instance
 * @param channel The channel to send the leaderboard in
 * @param type "entries" | "wins" (default = "entries")
 * @param top Number of users to display (default = 10)
 */
export declare function sendLeaderboard(manager: GiveawaysManager, channel: TextChannel, type?: 'entries' | 'wins', top?: number): Promise<void>;
//# sourceMappingURL=leaderboard.d.ts.map
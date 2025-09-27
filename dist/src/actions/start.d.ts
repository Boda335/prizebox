import { TextChannel } from 'discord.js';
import { Giveaway } from '../Giveaway';
import { GiveawaysManager } from '../GiveawaysManager';
interface StartOptions {
    prize: string;
    duration: number;
    winnerCount: number;
    hostId: string;
    messages?: Record<string, string>;
    type?: 'reaction' | 'button';
    emoji?: string;
    bonusEntries?: {
        userId?: string;
        roleId?: string;
        bonus: number;
    }[];
    requirements?: {
        roleId?: string;
        mustBeInGuild?: string;
    };
}
/**
 * Starts a new giveaway in the specified channel.
 * Sends the giveaway message and sets up collectors for reactions/buttons.
 * @param manager GiveawaysManager instance
 * @param channel The text channel to post the giveaway
 * @param options Giveaway options including prize, duration, winner count, etc.
 * @returns The created Giveaway instance
 */
export declare function startGiveaway(manager: GiveawaysManager, channel: TextChannel, options: StartOptions): Promise<Giveaway>;
export {};
//# sourceMappingURL=start.d.ts.map
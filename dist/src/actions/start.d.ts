import { TextChannel } from 'discord.js';
import { Giveaway } from '../Giveaway';
import { GiveawaysManager } from '../GiveawaysManager';
interface StartOptions {
    prize: string;
    duration: number;
    winnerCount: number;
    hostId: string;
    type?: 'reaction' | 'button';
    emoji?: string;
    messages?: Record<string, string>;
    defaults?: Partial<GiveawaysManager['defaults']>;
    lastChance?: Partial<GiveawaysManager['lastChance']>;
    pauseOptions?: Partial<GiveawaysManager['pauseOptions']>;
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
 * Starts a giveaway in the specified channel with the given options.
 *
 * @param manager The GiveawaysManager instance
 * @param channel The text channel to send the giveaway message
 * @param options Giveaway start options
 * @param overrides Optional overrides for manager settings
 * @returns The created Giveaway instance
 */
export declare function startGiveaway(manager: GiveawaysManager, channel: TextChannel, options: StartOptions, overrides?: Partial<GiveawaysManager>): Promise<Giveaway>;
export {};
//# sourceMappingURL=start.d.ts.map
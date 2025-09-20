import { Giveaway } from '../Giveaway';
import { Message } from 'discord.js';
/**
 * Creates a button collector for a giveaway message.
 * Handles joining/leaving participants when they click the button
 * and updates the embed to reflect the current number of entries.
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
export declare function createButtonCollector(manager: any, giveaway: Giveaway, msg: Message): Promise<void>;
//# sourceMappingURL=buttonCollector.d.ts.map
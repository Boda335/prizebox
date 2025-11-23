import { Giveaway } from '../Giveaway';
import { Message } from 'discord.js';
/**
 * Creates a button collector for a giveaway message.
 * This collector listens for button interactions and updates participants accordingly.
 *
 * @param manager The GiveawaysManager instance
 * @param giveaway The Giveaway instance
 * @param msg The giveaway message
 */
export declare function createButtonCollector(manager: any, giveaway: Giveaway, msg: Message): Promise<void>;
//# sourceMappingURL=buttonCollector.d.ts.map
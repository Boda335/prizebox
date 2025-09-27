import { Giveaway } from '../Giveaway';
import { Message } from 'discord.js';
/**
 * Creates the appropriate collector for a giveaway message
 * based on the giveaway type (reaction or button).
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
export declare function createCollectorForGiveaway(manager: any, giveaway: Giveaway, msg: Message): Promise<void>;
//# sourceMappingURL=createCollectorForGiveaway.d.ts.map
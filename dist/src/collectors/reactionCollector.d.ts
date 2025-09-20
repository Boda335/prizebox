import { Giveaway } from '../Giveaway';
import { Message } from 'discord.js';
/**
 * Creates a reaction collector for a giveaway message.
 * Handles adding/removing participants based on reactions.
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
export declare function createReactionCollector(manager: any, giveaway: Giveaway, msg: Message): Promise<void>;
//# sourceMappingURL=reactionCollector.d.ts.map
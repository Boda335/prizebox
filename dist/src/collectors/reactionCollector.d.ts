import { Giveaway } from '../Giveaway';
import { Message } from 'discord.js';
/**
 * Creates a reaction collector for a giveaway message.
 * This collector listens for reactions on the giveaway message
 * and updates participants accordingly.
 *
 * @param manager The GiveawaysManager instance
 * @param giveaway The Giveaway instance
 * @param msg The giveaway message
 */
export declare function createReactionCollector(manager: any, giveaway: Giveaway, msg: Message): Promise<void>;
//# sourceMappingURL=reactionCollector.d.ts.map
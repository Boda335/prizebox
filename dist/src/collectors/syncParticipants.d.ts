import { Giveaway } from '../Giveaway';
import { Message } from 'discord.js';
/**
 * Syncs participants of a giveaway based on reactions on the giveaway message.
 * Adds users who reacted and removes users who no longer reacted.
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
export declare function syncParticipantsFromReactions(manager: any, giveaway: Giveaway, msg: Message): Promise<void>;
//# sourceMappingURL=syncParticipants.d.ts.map
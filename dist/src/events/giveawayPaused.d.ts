import { Giveaway } from '../Giveaway';
import { MessageReaction, User } from 'discord.js';
/**
 * Handles the case when a participant reacts to a paused giveaway.
 * If the giveaway is paused, remove the reaction.
 * @param giveaway The giveaway instance
 * @param reaction The reaction object
 * @param user The user who reacted
 */
export declare function giveawayPaused(giveaway: Giveaway, reaction: MessageReaction, user: User): Promise<void>;
//# sourceMappingURL=giveawayPaused.d.ts.map
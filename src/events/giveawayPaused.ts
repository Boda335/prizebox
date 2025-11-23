import { Giveaway } from '../Giveaway';
import { Participant } from '../types';
import { MessageReaction, User } from 'discord.js';

/**
 * Handles the case when a participant reacts to a paused giveaway.
 * If the giveaway is paused, remove the reaction.
 * @param giveaway The giveaway instance
 * @param reaction The reaction object
 * @param user The user who reacted
 */
export async function giveawayPaused(giveaway: Giveaway, reaction: MessageReaction, user: User) {
  // TODO: Implement logic for invalid entry
  // Example actions:
  // 1. Log the invalid entry for debugging
  // 2. Notify the participant via DM or message
  // 3. Emit an event if needed
  // Currently, this function is empty and serves as a placeholder
}

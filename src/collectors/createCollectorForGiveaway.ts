import { Giveaway } from '../Giveaway';
import { Message } from 'discord.js';
import { createReactionCollector } from './reactionCollector';
import { createButtonCollector } from './buttonCollector';

/**
 * Creates the appropriate collector for a giveaway message
 * based on the giveaway type (reaction or button).
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
export async function createCollectorForGiveaway(manager: any, giveaway: Giveaway, msg: Message) {
  if (giveaway.data.type === 'reaction') {
    // Create a reaction collector for reaction-based giveaways
    await createReactionCollector(manager, giveaway, msg);
  } else if (giveaway.data.type === 'button') {
    // Create a button collector for button-based giveaways
    await createButtonCollector(manager, giveaway, msg);
  }
}

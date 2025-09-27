import { Giveaway } from '../Giveaway';
import { createReactionCollector } from './reactionCollector';
import { createButtonCollector } from './buttonCollector';
import { syncParticipantsFromReactions } from './syncParticipants';
import { TextChannel } from 'discord.js';

/**
 * Restores collectors for all active giveaways.
 * This function is usually called after initializing the manager
 * or restarting the bot, to make sure giveaways continue working properly.
 *
 * @param manager The GiveawaysManager instance
 */
export async function restoreCollectors(manager: any) {
  for (const giveaway of manager.giveaways) {
    // Get the channel where the giveaway is hosted
    const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
    if (!channel) continue;

    // Get the giveaway message from the channel
    const msg = await channel.messages.fetch(giveaway.data.messageId).catch(() => null);
    if (!msg) continue;

    // Sync participants from reactions if the giveaway is still active
    if (!giveaway.data.ended && !giveaway.data.paused) {
      await syncParticipantsFromReactions(manager, giveaway, msg);
    }

    /**
     * Create collectors:
     * - Even if the giveaway has already ended, we still create collectors
     *   to allow features like "entryAfterEnd" to work properly.
     */
    if (giveaway.data.type === 'reaction') {
      await createReactionCollector(manager, giveaway, msg);
    } else if (giveaway.data.type === 'button') {
      await createButtonCollector(manager, giveaway, msg);
    }
  }
}

import { Giveaway } from '../Giveaway';
import { createReactionCollector } from './reactionCollector';
import { createButtonCollector } from './buttonCollector';
import { syncParticipantsFromReactions } from './syncParticipants';
import { TextChannel } from 'discord.js';

/**
 * Restores collectors for all active giveaways.
 * This is usually called after initializing the manager or restarting the bot.
 * @param manager The GiveawaysManager instance
 */
export async function restoreCollectors(manager: any) {
  for (const giveaway of manager.giveaways) {
    // Skip ended or paused giveaways
    if (giveaway.data.ended || giveaway.data.paused) continue;

    // Fetch the channel where the giveaway is hosted
    const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
    if (!channel) continue;

    // Fetch the giveaway message
    const msg = await channel.messages.fetch(giveaway.data.messageId).catch(() => null);
    if (!msg) continue;

    // Sync participants from reactions (if any)
    await syncParticipantsFromReactions(manager, giveaway, msg);

    // Create the appropriate collector based on giveaway type
    if (giveaway.data.type === 'reaction') {
      await createReactionCollector(manager, giveaway, msg);
    } else if (giveaway.data.type === 'button') {
      await createButtonCollector(manager, giveaway, msg);
    }
  }
}

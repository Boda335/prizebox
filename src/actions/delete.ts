import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel } from 'discord.js';

/**
 * Delete a giveaway message and remove it from storage.
 * @param manager The GiveawaysManager instance
 * @param messageId The giveaway message ID
 * @returns true if deleted successfully
 */
export async function deleteGiveaway(manager: GiveawaysManager, messageId: string) {
  // Find the giveaway by message ID
  const index = manager.giveaways.findIndex(g => g.data.messageId === messageId);
  if (index === -1) throw new Error('Giveaway not found');

  const giveaway = manager.giveaways[index];
  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;

  // Try to delete the giveaway message from the channel
  if (channel) {
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (msg) {
      await msg.delete().catch(() => null); // Ignore errors (e.g., missing permissions)
    }
  }

  // Remove giveaway from the manager's list
  manager.giveaways.splice(index, 1);

  // Save updated data
  manager.save();

  return true;
}

import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel } from 'discord.js';

/**
 * Rerolls a giveaway by selecting new winners.
 * @param manager The GiveawaysManager instance
 * @param messageId The ID of the giveaway message
 * @param winnerCount Optional number of winners (defaults to the original count)
 * @returns The new winners as an array of participants
 */
export async function rerollGiveaway(
  manager: GiveawaysManager,
  messageId: string,
  winnerCount?: number
) {
  // Find the giveaway
  const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
  if (!giveaway) throw new Error('Giveaway not found');

  // Ensure the giveaway has ended
  if (!giveaway.data.ended) throw new Error('Giveaway not ended yet');

  // Get the channel
  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
  if (!channel) throw new Error('Channel not found');

  // Fetch the giveaway message
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) throw new Error('Message not found');

  // Ensure there are participants
  const participants = giveaway.data.participants;
  if (!participants.length) throw new Error('No participants to reroll');

  // Shuffle participants randomly and pick winners
  const shuffled = [...participants].sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, winnerCount || giveaway.data.winnerCount);

  // Update winners in giveaway data
  giveaway.data.winnerIds = winners.map(w => w.id);
  manager.save();

  // Announce new winners in the channel
  await channel.send(
    manager.messages.winMessage
      .replace('{winners}', winners.map(w => `<@${w.id}>`).join(', '))
      .replace('{this.prize}', giveaway.data.prize)
  );

  return winners;
}

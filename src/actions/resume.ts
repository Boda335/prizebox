import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel, EmbedBuilder } from 'discord.js';

/**
 * Resumes a paused giveaway.
 * Updates the giveaway message and optionally sets a new end time.
 * @param manager The GiveawaysManager instance
 * @param messageId The ID of the giveaway message
 * @param newEndAt Optional new end timestamp for the giveaway
 * @returns The resumed Giveaway instance
 */
export async function resumeGiveaway(
  manager: GiveawaysManager,
  messageId: string,
  newEndAt?: number
) {
  // Find the giveaway by messageId
  const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
  if (!giveaway) throw new Error('Giveaway not found');

  // If it's not paused, return as is
  if (!giveaway.data.paused) return giveaway;

  // Fetch the channel
  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
  if (!channel) throw new Error('Channel not found');

  // Fetch the giveaway message
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) throw new Error('Message not found');

  const messages = manager.messages;

  // Update the embed color
  const embed = EmbedBuilder.from(msg.embeds[0]).setColor(manager.defaults.embedColor);

  // Edit the message to indicate the giveaway has resumed
  await msg.edit({
    content: messages.giveawayResumed || messages.giveaway || '🎉 Giveaway Resumed 🎉',
    embeds: [embed],
  });

  // Update giveaway data
  giveaway.data.paused = false;
  if (newEndAt) {
    giveaway.data.endAt = newEndAt;
  } else if (manager.pauseOptions?.unpauseAfter) {
    giveaway.data.endAt = manager.pauseOptions.unpauseAfter;
  }

  // Save updated data
  manager.save();

  return giveaway;
}

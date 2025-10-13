import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel, EmbedBuilder, ColorResolvable } from 'discord.js';

/**
 * Pauses an active giveaway.
 * Uses the giveaway's stored settings if available, otherwise falls back to manager defaults.
 *
 * @param manager The GiveawaysManager instance
 * @param messageId The message ID of the giveaway to pause
 * @returns The updated Giveaway instance
 */
export async function pauseGiveaway(manager: GiveawaysManager, messageId: string) {
  const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
  if (!giveaway) throw new Error('Giveaway not found');

  if (giveaway.data.paused) return giveaway; // Already paused

  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
  if (!channel) throw new Error('Channel not found');

  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) throw new Error('Message not found');

  // Use the giveaway's pause options if available, otherwise use manager defaults
  const pauseOptions = giveaway.data.pauseOptions ?? manager.pauseOptions ?? {
    embedColor: '#FFFF00',
    content: '⚠️ Giveaway paused',
  };

  const messages = giveaway.data.messages ?? manager.messages;

  // Update embed color for paused state
  const embedColor = (pauseOptions.embedColor || '#FFFF00') as ColorResolvable;
  const embed = EmbedBuilder.from(msg.embeds[0]).setColor(embedColor);

  // Edit the message to show paused status
  await msg.edit({
    content: pauseOptions.content || messages.giveawayPaused || '⚠️ Giveaway paused',
    embeds: [embed],
  });

  // Mark the giveaway as paused
  giveaway.data.paused = true;

  // Prevent the giveaway from ending while paused by adding the checkInterval
  giveaway.data.endAt += manager.defaults.checkInterval;

  manager.save();
  return giveaway;
}

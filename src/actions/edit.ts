import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel, EmbedBuilder } from 'discord.js';

interface EditOptions {
  prize?: string; // Optional: update the prize name
  winnerCount?: number; // Optional: update number of winners
  addTime?: number; // Optional: extend the giveaway duration (ms)
}

/**
 * Edit an ongoing giveaway (prize, winners count, or duration).
 * @param manager The GiveawaysManager instance
 * @param messageId The giveaway message ID
 * @param options Edit options (prize, winnerCount, addTime)
 */
export async function editGiveaway(
  manager: GiveawaysManager,
  messageId: string,
  options: EditOptions
) {
  // Find giveaway by its message ID
  const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
  if (!giveaway) throw new Error('Giveaway not found');

  // Update giveaway data based on provided options
  if (options.prize) giveaway.data.prize = options.prize;
  if (options.winnerCount) giveaway.data.winnerCount = options.winnerCount;
  if (options.addTime) giveaway.data.endAt += options.addTime;

  // Fetch the giveaway channel
  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
  if (!channel) throw new Error('Channel not found');

  // Fetch the giveaway message
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) throw new Error('Message not found');

  const messages = manager.messages;

  // Update the embed with the new data
  const embed = EmbedBuilder.from(msg.embeds[0])
    .setTitle(giveaway.data.prize)
    .setDescription(
      `${messages.inviteToParticipate || 'React to enter!'}\n` +
        `${(messages.drawing || 'Ends at {this.timestamp}').replace(
          '{this.timestamp}',
          `<t:${Math.floor(giveaway.data.endAt / 1000)}:R>`
        )}\n` +
        `${
          messages.hostedBy
            ? messages.hostedBy.replace('{this.hostedBy}', `<@${giveaway.data.hostId}>`)
            : ''
        }`
    )
    .setFooter({
      text:
        messages.embedFooter?.replace('{this.winnerCount}', giveaway.data.winnerCount.toString()) ||
        `${giveaway.data.winnerCount} winner(s)`,
    })
    .setColor(manager.defaults.embedColor);

  // Edit the giveaway message
  await msg.edit({
    content: messages.giveaway || '🎉 Giveaway 🎉',
    embeds: [embed],
  });

  // Save updated data
  manager.save();
  return giveaway;
}

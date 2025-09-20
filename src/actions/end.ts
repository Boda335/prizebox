import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel, EmbedBuilder } from 'discord.js';
import { Participant } from '../types';

/**
 * Replace placeholders in giveaway messages with actual data.
 */
function applyReplacements(
  template: string,
  giveaway: any,
  winners: Participant[],
  msgUrl: string
): string {
  return template
    .replace(/{this.prize}/g, giveaway.data.prize)
    .replace(/{this.winnerCount}/g, giveaway.data.winnerCount.toString())
    .replace(/{this.messageURL}/g, msgUrl)
    .replace(/{this.hostedBy}/g, `<@${giveaway.data.hostId}>`)
    .replace(
      /{winners}/g,
      winners.length ? winners.map(w => `<@${w.id}>`).join(', ') : 'No winners'
    )
    .replace(/{this.timestamp}/g, `<t:${Math.floor(giveaway.data.endAt / 1000)}:R>`);
}

/**
 * Ends a giveaway, selects winners, updates stats, and edits the giveaway message.
 * @param manager The GiveawaysManager instance
 * @param messageId The ID of the giveaway message
 */
export async function endGiveaway(manager: GiveawaysManager, messageId: string) {
  // Find the giveaway by its message ID
  const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
  if (!giveaway) throw new Error('Giveaway not found');
  if (giveaway.data.ended) return giveaway;

  // Get the giveaway channel
  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
  if (!channel) throw new Error('Channel not found');

  // Fetch the giveaway message
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) throw new Error('Message not found');

  // Randomly select winners
  const shuffled = [...giveaway.data.participants].sort(() => 0.5 - Math.random());
  const winners: Participant[] = shuffled.slice(0, giveaway.data.winnerCount);

  // Update giveaway data
  giveaway.data.winnerIds = winners.map(w => w.id);
  giveaway.data.ended = true;

  // Update user stats for winners
  for (const winner of winners) {
    manager.storage.updateUserStats(giveaway.data.guildId, winner.id, {
      wins: 1,
      entries: 0,
    });
  }

  // Build the final embed
  const embed = EmbedBuilder.from(msg.embeds[0])
    .setTitle(giveaway.data.prize)
    .setColor(manager.defaults.embedColorEnd)
    .setDescription(
      winners.length
        ? `Winner(s): ${winners.map(w => `<@${w.id}>`).join(', ')}\nHosted by: <@${giveaway.data.hostId}>`
        : `${applyReplacements(manager.messages.noWinner, giveaway, winners, msg.url)}\nHosted by: <@${giveaway.data.hostId}>`
    )
    .setFooter({
      text: applyReplacements(manager.messages.endedAt, giveaway, winners, msg.url),
    })
    .setTimestamp(giveaway.data.endAt);

  // Edit the giveaway message to show results
  await msg.edit({
    content: manager.messages.giveawayEnded,
    embeds: [embed],
    components: [],
  });

  // Send a win/nowinner message in the channel
  await channel.send({
    content: winners.length
      ? applyReplacements(manager.messages.winMessage, giveaway, winners, msg.url)
      : applyReplacements(manager.messages.noWinner, giveaway, winners, msg.url),
  });

  // Save the updated state
  manager.save();
  return giveaway;
}

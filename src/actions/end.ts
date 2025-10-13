import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel, EmbedBuilder, ColorResolvable } from 'discord.js';
import { Participant } from '../types';

/**
 * Replace placeholders in giveaway messages with actual data.
 * @param template Message template with placeholders
 * @param giveaway The giveaway instance
 * @param winners List of winners
 * @param msgUrl URL of the giveaway message
 */
function applyReplacements(template: string, giveaway: any, winners: Participant[], msgUrl: string): string {
  return template
    .replace(/{this.prize}/g, giveaway.data.prize)
    .replace(/{this.winnerCount}/g, giveaway.data.winnerCount.toString())
    .replace(/{this.messageURL}/g, msgUrl)
    .replace(/{this.hostedBy}/g, `<@${giveaway.data.hostId}>`)
    .replace(/{winners}/g, winners.length ? winners.map(w => `<@${w.id}>`).join(', ') : 'No winners')
    .replace(/{this.timestamp}/g, `<t:${Math.floor(giveaway.data.endAt / 1000)}:R>`);
}

/**
 * Ends a giveaway, selects winners, updates stats, and edits the giveaway message.
 * @param manager The GiveawaysManager instance
 * @param messageId The message ID of the giveaway to end
 * @returns The updated Giveaway instance
 */
export async function endGiveaway(manager: GiveawaysManager, messageId: string) {
  const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
  if (!giveaway) throw new Error('Giveaway not found');
  if (giveaway.data.ended) return giveaway;

  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
  if (!channel) throw new Error('Channel not found');

  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) throw new Error('Message not found');

  // 🧮 Select winners randomly
  const shuffled = [...giveaway.data.participants].sort(() => 0.5 - Math.random());
  const winners: Participant[] = shuffled.slice(0, giveaway.data.winnerCount);

  giveaway.data.winnerIds = winners.map(w => w.id);
  giveaway.data.ended = true;

  // Update user stats for winners
  for (const winner of winners) {
    manager.storage.updateUserStats(giveaway.data.guildId, winner.id, { wins: 1, entries: 0 });
  }

  // ✅ Determine effective settings based on the giveaway itself
  const effectiveDefaults = { ...manager.defaults, ...(giveaway.data.defaults ?? {}) };
  const effectiveMessages = { ...manager.messages, ...(giveaway.data.messages ?? {}) };

  // 🎨 Use end embed color from giveaway or default
  const embedColorEnd = (effectiveDefaults.embedColorEnd || '#000000') as ColorResolvable;

  // 🧱 Create final embed
  const embed = EmbedBuilder.from(msg.embeds[0])
    .setTitle(giveaway.data.prize)
    .setColor(embedColorEnd)
    .setDescription(
      winners.length
        ? `Winner(s): ${winners.map(w => `<@${w.id}>`).join(', ')}\nHosted by: <@${giveaway.data.hostId}>`
        : `${applyReplacements(effectiveMessages.noWinner, giveaway, winners, msg.url)}\nHosted by: <@${giveaway.data.hostId}>`
    )
    .setFooter({
      text: applyReplacements(effectiveMessages.endedAt, giveaway, winners, msg.url),
    })
    .setTimestamp(giveaway.data.endAt);

  // 📨 Edit the original giveaway message
  await msg.edit({
    content: effectiveMessages.giveawayEnded,
    embeds: [embed],
    components: [],
  });

  // 🏆 Send winners message or no-winner message
  await channel.send({
    content: winners.length
      ? applyReplacements(effectiveMessages.winMessage, giveaway, winners, msg.url)
      : applyReplacements(effectiveMessages.noWinner, giveaway, winners, msg.url),
  });

  manager.save();

  if (winners.length) {
    manager.emit('giveawayWon', winners, giveaway);
  }

  return giveaway;
}

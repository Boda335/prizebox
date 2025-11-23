import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel, EmbedBuilder } from 'discord.js';

interface EditOptions {
  prize?: string;
  winnerCount?: number;
  addTime?: number;
}

export async function editGiveaway(manager: GiveawaysManager, messageId: string, options: EditOptions) {
  const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
  if (!giveaway) throw new Error('Giveaway not found');

  if (options.prize) giveaway.data.prize = options.prize;
  if (options.winnerCount) giveaway.data.winnerCount = options.winnerCount;
  if (options.addTime) giveaway.data.endAt += options.addTime;

  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
  if (!channel) throw new Error('Channel not found');

  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) throw new Error('Message not found');

  const messages = manager.messages;

  const embed = EmbedBuilder.from(msg.embeds[0])
    .setTitle(giveaway.data.prize)
    .setDescription(`${messages.inviteToParticipate || 'React to enter!'}\n` + `${(messages.drawing || 'Ends at {this.timestamp}').replace('{this.timestamp}', `<t:${Math.floor(giveaway.data.endAt / 1000)}:R>`)}\n` + `${messages.hostedBy ? messages.hostedBy.replace('{this.hostedBy}', `<@${giveaway.data.hostId}>`) : ''}`)
    .setFooter({
      text: messages.embedFooter?.replace('{this.winnerCount}', giveaway.data.winnerCount.toString()) || `${giveaway.data.winnerCount} winner(s)`,
    })
    .setColor(manager.defaults.embedColor);

  await msg.edit({
    content: messages.giveaway || '🎉 Giveaway 🎉',
    embeds: [embed],
  });

  // Refresh collector if duration changed
  if (options.addTime) {
    manager['removeCollector'](messageId);
    await manager.createCollectorForGiveaway(giveaway, msg);
  }

  manager.save();
  return giveaway;
}

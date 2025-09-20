import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { Giveaway } from '../Giveaway';
import { GiveawaysManager } from '../GiveawaysManager';

interface StartOptions {
  prize: string;
  duration: number;
  winnerCount: number;
  hostId: string;
  messages?: Record<string, string>;
  type?: 'reaction' | 'button';
  emoji?: string;

  bonusEntries?: {
    userId?: string;
    roleId?: string;
    bonus: number;
  }[];

  requirements?: {
    roleId?: string;
    mustBeInGuild?: string;
  };
}

/**
 * Starts a new giveaway in the specified channel.
 * Sends the giveaway message and sets up collectors for reactions/buttons.
 * @param manager GiveawaysManager instance
 * @param channel The text channel to post the giveaway
 * @param options Giveaway options including prize, duration, winner count, etc.
 * @returns The created Giveaway instance
 */
export async function startGiveaway(
  manager: GiveawaysManager,
  channel: TextChannel,
  options: StartOptions
): Promise<Giveaway> {
  const endAt = Date.now() + options.duration;
  const messages = options.messages || manager.messages;
  const winnerCount = options.winnerCount;
  const type = options.type ?? manager.defaults.type;
  const emoji = options.emoji ?? manager.defaults.emoji;

  const embedColor: ColorResolvable = manager.defaults.embedColor || '#FF0000';

  // Create the giveaway embed
  const embed = new EmbedBuilder()
    .setAuthor({
      name: channel.guild.name,
      iconURL: channel.guild.iconURL() || undefined,
    })
    .setTitle(options.prize)
    .setFooter({
      text:
        messages.embedFooter?.replace('{this.winnerCount}', winnerCount.toString()) ||
        `${winnerCount} winner(s)`,
    })
    .setColor(embedColor);

  let msg;

  if (type === 'button') {
    // Button-based giveaway
    const button = new ButtonBuilder()
      .setCustomId('giveaway-join')
      .setEmoji(emoji)
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    embed.setDescription(
      `${messages.inviteToParticipate || 'Click the button to enter!'}\n` +
        `${(messages.drawing || 'Ends at {this.timestamp}').replace(
          '{this.timestamp}',
          `<t:${Math.floor(endAt / 1000)}:R>`
        )}\n` +
        `${messages.hostedBy ? messages.hostedBy.replace('{this.hostedBy}', `<@${options.hostId}>`) : ''}\n` +
        `Entries: **0**`
    );

    msg = await channel.send({
      content: messages.giveaway || manager.messages.giveaway,
      embeds: [embed],
      components: [row],
    });
  } else {
    // Reaction-based giveaway
    embed.setDescription(
      `${messages.inviteToParticipate || 'React to enter!'}\n` +
        `${(messages.drawing || 'Ends at {this.timestamp}').replace(
          '{this.timestamp}',
          `<t:${Math.floor(endAt / 1000)}:R>`
        )}\n` +
        `${messages.hostedBy ? messages.hostedBy.replace('{this.hostedBy}', `<@${options.hostId}>`) : ''}`
    );

    msg = await channel.send({
      content: messages.giveaway || manager.messages.giveaway,
      embeds: [embed],
    });

    // Add reaction to the message
    await msg.react(emoji);
  }

  // Create the Giveaway instance
  const giveaway = new Giveaway(
    {
      messageId: msg.id,
      channelId: channel.id,
      guildId: channel.guild.id,
      prize: options.prize,
      startAt: Date.now(),
      endAt,
      ended: false,
      paused: false,
      winnerIds: [],
      participants: [],
      hostId: options.hostId,
      winnerCount,
      type,
      emoji,
    },
    manager
  );

  // Add to manager's giveaways and save
  manager.giveaways.push(giveaway);
  manager.save();

  // Create the appropriate collector (reaction or button)
  await manager.createCollectorForGiveaway(giveaway, msg);

  return giveaway;
}

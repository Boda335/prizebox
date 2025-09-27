import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, TextChannel } from 'discord.js';
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
export async function startGiveaway(manager: GiveawaysManager, channel: TextChannel, options: StartOptions): Promise<Giveaway> {
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
      text: messages.embedFooter?.replace('{this.winnerCount}', winnerCount.toString()) || `${winnerCount} winner(s)`,
    })
    .setColor(embedColor);

  let msg;
  let description = '';

  if (type === 'button') {
    description = `${messages.inviteToParticipate || 'Click the button to enter!'}\n`;
  } else {
    description = `${messages.inviteToParticipate || 'React to enter!'}\n`;
  }

  description += `${(messages.drawing || 'Ends at {this.timestamp}').replace('{this.timestamp}', `<t:${Math.floor(endAt / 1000)}:R>`)}\n`;
  description += `${messages.hostedBy ? messages.hostedBy.replace('{this.hostedBy}', `<@${options.hostId}>`) : ''}\n`;
  description += `Entries: **0**\n`;

  // إضافة bonus entries لو موجودة
  if (options.bonusEntries && options.bonusEntries.length > 0) {
    description += `\n🎁 Bonus Entries:\n`;
    options.bonusEntries.forEach(bonus => {
      const target = bonus.userId ? `<@${bonus.userId}>` : bonus.roleId ? `<@&${bonus.roleId}>` : 'Unknown';
      description += `- ${target}: +${bonus.bonus}\n`;
    });
  }

  // إضافة requirements لو موجودة
  if (options.requirements) {
    description += `\n🔒 Requirements:\n`;
    if (options.requirements.roleId) {
      description += `- Must have role: <@&${options.requirements.roleId}>\n`;
    }
    if (options.requirements.mustBeInGuild) {
      try {
        // جلب معلومات السيرفر من رابط الدعوة
        const invite = await manager.client.fetchInvite(options.requirements.mustBeInGuild);
        const guildName = invite.guild?.name || 'Unknown Server';
        const inviteURL = invite.url;

        description += `- Must be in server: [${guildName}](${inviteURL})\n`;
      } catch {
        // إذا الرابط غير صالح
        description += `- Must be in server: Invalid Invite\n`;
      }
    }
  }

  // تطبيق الوصف على embed
  embed.setDescription(description);

  if (type === 'button') {
    // Button-based giveaway
    const button = new ButtonBuilder().setCustomId('giveaway-join').setEmoji(emoji).setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    msg = await channel.send({
      content: messages.giveaway || manager.messages.giveaway,
      embeds: [embed],
      components: [row],
    });
  } else {
    // Reaction-based giveaway
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

      requirements: options.requirements || {},
      bonusEntries: options.bonusEntries || [],
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

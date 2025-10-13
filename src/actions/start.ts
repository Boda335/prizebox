import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, TextChannel } from 'discord.js';
import { Giveaway } from '../Giveaway';
import { GiveawaysManager } from '../GiveawaysManager';

interface StartOptions {
  prize: string;
  duration: number;
  winnerCount: number;
  hostId: string;
  type?: 'reaction' | 'button';
  emoji?: string;

  messages?: Record<string, string>;
  defaults?: Partial<GiveawaysManager['defaults']>;
  lastChance?: Partial<GiveawaysManager['lastChance']>;
  pauseOptions?: Partial<GiveawaysManager['pauseOptions']>;

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
 * Starts a giveaway in the specified channel with the given options.
 *
 * @param manager The GiveawaysManager instance
 * @param channel The text channel to send the giveaway message
 * @param options Giveaway start options
 * @param overrides Optional overrides for manager settings
 * @returns The created Giveaway instance
 */
export async function startGiveaway(
  manager: GiveawaysManager,
  channel: TextChannel,
  options: StartOptions,
  overrides?: Partial<GiveawaysManager>
): Promise<Giveaway> {
  const endAt = Date.now() + options.duration;

  // Merge defaults, lastChance, pauseOptions, and messages from manager, overrides, and options
  const activeDefaults = { ...manager.defaults, ...(overrides?.defaults ?? {}), ...(options.defaults ?? {}) };
  const activeLastChance = { ...manager.lastChance, ...(overrides?.lastChance ?? {}), ...(options.lastChance ?? {}) };
  const activePauseOptions = { ...manager.pauseOptions, ...(overrides?.pauseOptions ?? {}), ...(options.pauseOptions ?? {}) };
  const activeMessages = { ...manager.messages, ...(overrides?.messages ?? {}), ...(options.messages ?? {}) };

  const winnerCount = options.winnerCount;
  const type = options.type ?? activeDefaults.type;
  const emoji = options.emoji ?? activeDefaults.emoji;
  const embedColor: ColorResolvable = (activeDefaults.embedColor ?? '#FF0000') as ColorResolvable;

  // Create the main embed
  const embed = new EmbedBuilder()
    .setAuthor({ name: channel.guild.name, iconURL: channel.guild.iconURL() || undefined })
    .setTitle(options.prize)
    .setColor(embedColor)
    .setFooter({
      text: activeMessages.embedFooter?.replace('{this.winnerCount}', winnerCount.toString()) || `${winnerCount} winner(s)`,
    });

  let description = '';

  // Participation instruction
  description += type === 'button'
    ? `${activeMessages.inviteToParticipate || 'Click the button to enter!'}\n`
    : `${activeMessages.inviteToParticipate || 'React to enter!'}\n`;

  // End time
  description += `${(activeMessages.drawing || 'Ends at {this.timestamp}').replace('{this.timestamp}', `<t:${Math.floor(endAt / 1000)}:R>`)}\n`;

  // Hosted by
  description += `${activeMessages.hostedBy ? activeMessages.hostedBy.replace('{this.hostedBy}', `<@${options.hostId}>`) : ''}\n`;

  // Bonus Entries, if any
  if (options.bonusEntries && options.bonusEntries.length > 0) {
    description += `\n🎁 Bonus Entries:\n`;
    options.bonusEntries.forEach(bonus => {
      const target = bonus.userId ? `<@${bonus.userId}>` : bonus.roleId ? `<@&${bonus.roleId}>` : 'Unknown';
      description += `- ${target}: +${bonus.bonus}\n`;
    });
  }

  // Requirements, if any
  if (options.requirements && (options.requirements.roleId || options.requirements.mustBeInGuild)) {
    description += `\n🔒 Requirements:\n`;
    if (options.requirements.roleId) {
      description += `- Must have role: <@&${options.requirements.roleId}>\n`;
    }
    if (options.requirements.mustBeInGuild) {
      try {
        const invite = await manager.client.fetchInvite(options.requirements.mustBeInGuild);
        const guildName = invite.guild?.name || 'Unknown Server';
        const inviteURL = invite.url;
        description += `- Must be in server: [${guildName}](${inviteURL})\n`;
      } catch {
        description += `- Must be in server: Invalid Invite\n`;
      }
    }
  }

  embed.setDescription(description);

  // Send the giveaway message
  let msg;
  if (type === 'button') {
    // Create "Join" and "Entries" buttons
    const joinButton = new ButtonBuilder().setCustomId('giveaway-join').setEmoji(emoji).setStyle(ButtonStyle.Primary);
    const entriesButton = new ButtonBuilder()
      .setCustomId('participants')
      .setEmoji('👥')
      .setLabel('Entries: 0')
      .setDisabled(true)
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton, entriesButton);

    msg = await channel.send({
      content: activeMessages.giveaway || manager.messages.giveaway,
      embeds: [embed],
      components: [row],
    });
  } else {
    // Reaction-based giveaway
    msg = await channel.send({
      content: activeMessages.giveaway || manager.messages.giveaway,
      embeds: [embed],
    });

    // Support for Unicode and custom emoji
    const emojiToReact = emoji.startsWith('<') ? parseCustomEmoji(emoji) : emoji;
    await msg.react(emojiToReact);
  }

  // Save the giveaway data
  const giveawayData: any = {
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
    defaults: activeDefaults,
    lastChance: activeLastChance,
    pauseOptions: activePauseOptions,
    messages: activeMessages,
  };

  const giveaway = new Giveaway(giveawayData, manager);
  manager.giveaways.push(giveaway);
  manager.save();

  await manager.createCollectorForGiveaway(giveaway, msg);

  return giveaway;
}

/**
 * Helper function to parse a custom emoji into a format usable for reactions
 * @param emoji The custom emoji string
 * @returns The formatted emoji string
 */
function parseCustomEmoji(emoji: string) {
  const match = emoji.match(/<(a?):(\w+):(\d+)>/);
  if (!match) return emoji; // If not a custom emoji, return as is
  const animated = match[1] === 'a';
  const name = match[2];
  const id = match[3];
  return animated ? `a:${name}:${id}` : `${name}:${id}`;
}

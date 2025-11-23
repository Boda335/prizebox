import { GiveawaysManager } from '../GiveawaysManager';
import { TextChannel, EmbedBuilder, ColorResolvable, ActionRowBuilder, ButtonBuilder } from 'discord.js';

/**
 * Pause a giveaway
 * @param manager The giveaways manager
 * @param messageId The ID of the giveaway message
 * @param unpauseAfterMs Optional time to automatically unpause in milliseconds
 */
export async function pauseGiveaway(manager: GiveawaysManager, messageId: string, unpauseAfterMs?: number) {
  // Find the giveaway by messageId
  const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
  if (!giveaway) throw new Error('Giveaway not found');
  if (giveaway.data.paused) return giveaway;

  // Fetch the channel
  const channel = manager.client.channels.cache.get(giveaway.data.channelId) as TextChannel;
  if (!channel) throw new Error('Channel not found');

  // Fetch the message
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) throw new Error('Message not found');

  const now = Date.now();

  // Prepare pause options
  const pauseOptions = {
    isPaused: true,
    content: giveaway.data.pauseOptions?.content ?? manager.pauseOptions?.content ?? 'Giveaway paused',
    embedColor: giveaway.data.pauseOptions?.embedColor ?? manager.pauseOptions?.embedColor ?? '#FFFF00',
    infiniteDurationText: giveaway.data.pauseOptions?.infiniteDurationText ?? manager.pauseOptions?.infiniteDurationText ?? '`INFINITY`',
    unpauseAfter: typeof unpauseAfterMs === 'number' ? now + unpauseAfterMs : null,
    pausedAt: now,
  };

  // Update embed
  const embedColor = pauseOptions.embedColor as ColorResolvable;
  const embed = EmbedBuilder.from(msg.embeds[0]).setColor(embedColor);

  let description = embed.data.description || '';

  // Extract line with timestamp if exists
  const timestampRegex = /^.*<t:\d+:R>.*$/m;

  // New line for pause status
  const newLine = pauseOptions.unpauseAfter ? `Paused until: <t:${Math.floor(pauseOptions.unpauseAfter / 1000)}:R>` : `Paused: ${pauseOptions.infiniteDurationText}`;

  // Replace or add timestamp line
  if (timestampRegex.test(description)) {
    description = description.replace(timestampRegex, newLine);
  } else {
    description = `${newLine}\n${description}`;
  }

  embed.setDescription(description);

  const payload: any = { content: pauseOptions.content, embeds: [embed] };

  // Disable buttons if type is button
  if (giveaway.data.type === 'button') {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    msg.components.forEach(row => {
      if (!('components' in row)) return;
      const actionRow = new ActionRowBuilder<ButtonBuilder>();
      for (const c of (row as any).components) {
        if (c.type === 2) actionRow.addComponents(ButtonBuilder.from(c).setDisabled(true));
      }
      if (actionRow.components.length > 0) rows.push(actionRow);
    });

    if (rows.length > 0) payload.components = rows;
  } else if (giveaway.data.type === 'reaction') {
    // Emit "giveawayPaused" event for reaction-based giveaways
    manager.emit('giveawayPaused', giveaway);
  }

  // Edit the message
  await msg.edit(payload);

  // Update giveaway status
  giveaway.data.paused = true;
  giveaway.data.pauseOptions = pauseOptions;

  // Save manager state
  manager.save();

  return giveaway;
}

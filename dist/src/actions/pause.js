"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pauseGiveaway = pauseGiveaway;
const discord_js_1 = require("discord.js");
/**
 * Pause a giveaway
 * @param manager The giveaways manager
 * @param messageId The ID of the giveaway message
 * @param unpauseAfterMs Optional time to automatically unpause in milliseconds
 */
async function pauseGiveaway(manager, messageId, unpauseAfterMs) {
    // Find the giveaway by messageId
    const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
    if (!giveaway)
        throw new Error('Giveaway not found');
    if (giveaway.data.paused)
        return giveaway;
    // Fetch the channel
    const channel = manager.client.channels.cache.get(giveaway.data.channelId);
    if (!channel)
        throw new Error('Channel not found');
    // Fetch the message
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg)
        throw new Error('Message not found');
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
    const embedColor = pauseOptions.embedColor;
    const embed = discord_js_1.EmbedBuilder.from(msg.embeds[0]).setColor(embedColor);
    let description = embed.data.description || '';
    // Extract line with timestamp if exists
    const timestampRegex = /^.*<t:\d+:R>.*$/m;
    // New line for pause status
    const newLine = pauseOptions.unpauseAfter ? `Paused until: <t:${Math.floor(pauseOptions.unpauseAfter / 1000)}:R>` : `Paused: ${pauseOptions.infiniteDurationText}`;
    // Replace or add timestamp line
    if (timestampRegex.test(description)) {
        description = description.replace(timestampRegex, newLine);
    }
    else {
        description = `${newLine}\n${description}`;
    }
    embed.setDescription(description);
    const payload = { content: pauseOptions.content, embeds: [embed] };
    // Disable buttons if type is button
    if (giveaway.data.type === 'button') {
        const rows = [];
        msg.components.forEach(row => {
            if (!('components' in row))
                return;
            const actionRow = new discord_js_1.ActionRowBuilder();
            for (const c of row.components) {
                if (c.type === 2)
                    actionRow.addComponents(discord_js_1.ButtonBuilder.from(c).setDisabled(true));
            }
            if (actionRow.components.length > 0)
                rows.push(actionRow);
        });
        if (rows.length > 0)
            payload.components = rows;
    }
    else if (giveaway.data.type === 'reaction') {
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
//# sourceMappingURL=pause.js.map
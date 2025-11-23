"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeGiveaway = resumeGiveaway;
const discord_js_1 = require("discord.js");
/**
 * Resume a paused giveaway
 * @param manager The giveaways manager
 * @param messageId The ID of the giveaway message
 * @param newEndAt Optional new end timestamp in milliseconds
 * @returns The updated giveaway
 */
async function resumeGiveaway(manager, messageId, newEndAt) {
    // Find the giveaway by messageId
    const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
    if (!giveaway)
        throw new Error('Giveaway not found');
    if (!giveaway.data.paused)
        return giveaway;
    // Fetch the channel
    const channel = manager.client.channels.cache.get(giveaway.data.channelId);
    if (!channel)
        throw new Error('Channel not found');
    // Fetch the message
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg)
        throw new Error('Message not found');
    const pauseOptions = giveaway.data.pauseOptions;
    const now = Date.now();
    // Calculate new end time if provided or based on paused duration
    let pausedDuration = 0;
    if (newEndAt !== undefined) {
        giveaway.data.endAt = newEndAt;
    }
    else if (pauseOptions?.pausedAt !== undefined) {
        pausedDuration = now - pauseOptions.pausedAt;
        giveaway.data.endAt += pausedDuration;
    }
    // Update embed color
    const embedColor = (giveaway.data.defaults?.embedColor ?? '#FF0000');
    const embed = discord_js_1.EmbedBuilder.from(msg.embeds[0]).setColor(embedColor);
    // Replace any "Paused" or "Ends at" line with updated end time
    let description = embed.data.description || '';
    description = description.replace(/(Paused:.*|Ends at:.*)/, `Ends at: <t:${Math.floor(giveaway.data.endAt / 1000)}:R>`);
    embed.setDescription(description);
    // Prepare payload for message edit
    const payload = {
        content: pauseOptions?.content ?? 'Giveaway Resumed',
        embeds: [embed],
    };
    // Re-enable buttons if the giveaway type is 'button'
    if (giveaway.data.type === 'button') {
        const rows = [];
        msg.components.forEach(row => {
            if (!('components' in row))
                return;
            const actionRow = new discord_js_1.ActionRowBuilder();
            for (const c of row.components) {
                const btn = discord_js_1.ButtonBuilder.from(c);
                const id = c.customId;
                if (id === 'giveaway-join') {
                    btn.setDisabled(false); // Enable join button
                }
                else if (id === 'participants') {
                    btn.setDisabled(true); // Keep participants button disabled
                }
                actionRow.addComponents(btn);
            }
            if (actionRow.components.length > 0)
                rows.push(actionRow);
        });
        if (rows.length > 0)
            payload.components = rows;
    }
    // Edit the giveaway message
    await msg.edit(payload);
    // Update giveaway paused state
    giveaway.data.paused = false;
    giveaway.data.pauseOptions = {
        isPaused: false,
        content: pauseOptions?.content ?? 'Giveaway Resumed',
        embedColor: pauseOptions?.embedColor ?? '#FF0000',
        infiniteDurationText: pauseOptions?.infiniteDurationText ?? '`INFINITY`',
        unpauseAfter: null,
        pausedAt: undefined,
    };
    // Save manager state
    manager.save();
    return giveaway;
}
//# sourceMappingURL=resume.js.map
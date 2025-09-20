"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pauseGiveaway = pauseGiveaway;
const discord_js_1 = require("discord.js");
/**
 * Pauses an active giveaway.
 * Updates the giveaway message and marks it as paused in storage.
 * @param manager The GiveawaysManager instance
 * @param messageId The ID of the giveaway message
 * @returns The paused Giveaway instance
 */
async function pauseGiveaway(manager, messageId) {
    // Find the giveaway by messageId
    const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
    if (!giveaway)
        throw new Error('Giveaway not found');
    // If it's already paused, just return it
    if (giveaway.data.paused)
        return giveaway;
    // Get the giveaway's channel
    const channel = manager.client.channels.cache.get(giveaway.data.channelId);
    if (!channel)
        throw new Error('Channel not found');
    // Fetch the giveaway message
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg)
        throw new Error('Message not found');
    const messages = manager.messages;
    // Clone the existing embed and set a pause color
    const embed = discord_js_1.EmbedBuilder.from(msg.embeds[0]).setColor((manager.pauseOptions?.embedColor || '#FFFF00'));
    // Edit the message to show it's paused
    await msg.edit({
        content: manager.pauseOptions?.content || messages.giveawayPaused || '⚠️ Giveaway paused',
        embeds: [embed],
    });
    // Update giveaway state
    giveaway.data.paused = true;
    // Prevent it from ending while paused by shifting the end time
    giveaway.data.endAt += manager.defaults.checkInterval;
    // Save changes
    manager.save();
    return giveaway;
}
//# sourceMappingURL=pause.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pauseGiveaway = pauseGiveaway;
const discord_js_1 = require("discord.js");
/**
 * Pauses an active giveaway.
 * Uses the giveaway's stored settings if available.
 */
async function pauseGiveaway(manager, messageId) {
    const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
    if (!giveaway)
        throw new Error('Giveaway not found');
    if (giveaway.data.paused)
        return giveaway;
    const channel = manager.client.channels.cache.get(giveaway.data.channelId);
    if (!channel)
        throw new Error('Channel not found');
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg)
        throw new Error('Message not found');
    // 🔹 استخدم إعدادات الجيف أواي لو موجودة، وإلا إعدادات المدير الافتراضية
    const pauseOptions = giveaway.data.pauseOptions ?? manager.pauseOptions ?? {
        embedColor: '#FFFF00',
        content: '⚠️ Giveaway paused',
    };
    const messages = giveaway.data.messages ?? manager.messages;
    const embedColor = (pauseOptions.embedColor || '#FFFF00');
    const embed = discord_js_1.EmbedBuilder.from(msg.embeds[0]).setColor(embedColor);
    await msg.edit({
        content: pauseOptions.content || messages.giveawayPaused || '⚠️ Giveaway paused',
        embeds: [embed],
    });
    // علامة أن الجيف أواي متوقف
    giveaway.data.paused = true;
    // منع انتهاء الجيف أثناء التوقف بإضافة checkInterval
    giveaway.data.endAt += manager.defaults.checkInterval;
    manager.save();
    return giveaway;
}
//# sourceMappingURL=pause.js.map
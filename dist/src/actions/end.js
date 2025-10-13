"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endGiveaway = endGiveaway;
const discord_js_1 = require("discord.js");
/**
 * Replace placeholders in giveaway messages with actual data.
 */
function applyReplacements(template, giveaway, winners, msgUrl) {
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
 */
async function endGiveaway(manager, messageId) {
    const giveaway = manager.giveaways.find(g => g.data.messageId === messageId);
    if (!giveaway)
        throw new Error('Giveaway not found');
    if (giveaway.data.ended)
        return giveaway;
    const channel = manager.client.channels.cache.get(giveaway.data.channelId);
    if (!channel)
        throw new Error('Channel not found');
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg)
        throw new Error('Message not found');
    // 🧮 اختيار الفائزين
    const shuffled = [...giveaway.data.participants].sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, giveaway.data.winnerCount);
    giveaway.data.winnerIds = winners.map(w => w.id);
    giveaway.data.ended = true;
    for (const winner of winners) {
        manager.storage.updateUserStats(giveaway.data.guildId, winner.id, { wins: 1, entries: 0 });
    }
    // ✅ هنا نحدد الإعدادات الفعلية بناءً على الجيف نفسه
    const effectiveDefaults = {
        ...manager.defaults,
        ...(giveaway.data.defaults ?? {}),
    };
    const effectiveMessages = {
        ...manager.messages,
        ...(giveaway.data.messages ?? {}),
    };
    // 🎨 استخدم لون النهاية من إعدادات الجيف أو الافتراضي
    const embedColorEnd = (effectiveDefaults.embedColorEnd || '#000000');
    // 🧱 إنشاء الـ Embed النهائي
    const embed = discord_js_1.EmbedBuilder.from(msg.embeds[0])
        .setTitle(giveaway.data.prize)
        .setColor(embedColorEnd)
        .setDescription(winners.length
        ? `Winner(s): ${winners.map(w => `<@${w.id}>`).join(', ')}\nHosted by: <@${giveaway.data.hostId}>`
        : `${applyReplacements(effectiveMessages.noWinner, giveaway, winners, msg.url)}\nHosted by: <@${giveaway.data.hostId}>`)
        .setFooter({
        text: applyReplacements(effectiveMessages.endedAt, giveaway, winners, msg.url),
    })
        .setTimestamp(giveaway.data.endAt);
    // 📨 عدّل الرسالة الأصلية
    await msg.edit({
        content: effectiveMessages.giveawayEnded,
        embeds: [embed],
        components: [],
    });
    // 🏆 أرسل رسالة الفائزين / عدم وجود فائزين
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
//# sourceMappingURL=end.js.map
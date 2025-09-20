"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGiveaway = startGiveaway;
const discord_js_1 = require("discord.js");
const Giveaway_1 = require("../Giveaway");
/**
 * Starts a new giveaway in the specified channel.
 * Sends the giveaway message and sets up collectors for reactions/buttons.
 * @param manager GiveawaysManager instance
 * @param channel The text channel to post the giveaway
 * @param options Giveaway options including prize, duration, winner count, etc.
 * @returns The created Giveaway instance
 */
async function startGiveaway(manager, channel, options) {
    const endAt = Date.now() + options.duration;
    const messages = options.messages || manager.messages;
    const winnerCount = options.winnerCount;
    const type = options.type ?? manager.defaults.type;
    const emoji = options.emoji ?? manager.defaults.emoji;
    const embedColor = manager.defaults.embedColor || '#FF0000';
    // Create the giveaway embed
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({
        name: channel.guild.name,
        iconURL: channel.guild.iconURL() || undefined,
    })
        .setTitle(options.prize)
        .setFooter({
        text: messages.embedFooter?.replace('{this.winnerCount}', winnerCount.toString()) ||
            `${winnerCount} winner(s)`,
    })
        .setColor(embedColor);
    let msg;
    if (type === 'button') {
        // Button-based giveaway
        const button = new discord_js_1.ButtonBuilder()
            .setCustomId('giveaway-join')
            .setEmoji(emoji)
            .setStyle(discord_js_1.ButtonStyle.Primary);
        const row = new discord_js_1.ActionRowBuilder().addComponents(button);
        embed.setDescription(`${messages.inviteToParticipate || 'Click the button to enter!'}\n` +
            `${(messages.drawing || 'Ends at {this.timestamp}').replace('{this.timestamp}', `<t:${Math.floor(endAt / 1000)}:R>`)}\n` +
            `${messages.hostedBy ? messages.hostedBy.replace('{this.hostedBy}', `<@${options.hostId}>`) : ''}\n` +
            `Entries: **0**`);
        msg = await channel.send({
            content: messages.giveaway || manager.messages.giveaway,
            embeds: [embed],
            components: [row],
        });
    }
    else {
        // Reaction-based giveaway
        embed.setDescription(`${messages.inviteToParticipate || 'React to enter!'}\n` +
            `${(messages.drawing || 'Ends at {this.timestamp}').replace('{this.timestamp}', `<t:${Math.floor(endAt / 1000)}:R>`)}\n` +
            `${messages.hostedBy ? messages.hostedBy.replace('{this.hostedBy}', `<@${options.hostId}>`) : ''}`);
        msg = await channel.send({
            content: messages.giveaway || manager.messages.giveaway,
            embeds: [embed],
        });
        // Add reaction to the message
        await msg.react(emoji);
    }
    // Create the Giveaway instance
    const giveaway = new Giveaway_1.Giveaway({
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
    }, manager);
    // Add to manager's giveaways and save
    manager.giveaways.push(giveaway);
    manager.save();
    // Create the appropriate collector (reaction or button)
    await manager.createCollectorForGiveaway(giveaway, msg);
    return giveaway;
}
//# sourceMappingURL=start.js.map
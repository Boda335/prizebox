"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGiveaway = startGiveaway;
const discord_js_1 = require("discord.js");
const Giveaway_1 = require("../Giveaway");
async function startGiveaway(manager, channel, options, overrides) {
    const endAt = Date.now() + options.duration;
    const activeDefaults = {
        ...manager.defaults,
        ...(overrides?.defaults ?? {}),
        ...(options.defaults ?? {}),
    };
    const activeLastChance = {
        ...manager.lastChance,
        ...(overrides?.lastChance ?? {}),
        ...(options.lastChance ?? {}),
    };
    const activePauseOptions = {
        ...manager.pauseOptions,
        ...(overrides?.pauseOptions ?? {}),
        ...(options.pauseOptions ?? {}),
    };
    const activeMessages = {
        ...manager.messages,
        ...(overrides?.messages ?? {}),
        ...(options.messages ?? {}),
    };
    const winnerCount = options.winnerCount;
    const type = options.type ?? activeDefaults.type;
    const emoji = options.emoji ?? activeDefaults.emoji;
    const embedColor = (activeDefaults.embedColor ?? '#FF0000');
    // إنشاء Embed الأساسي
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({
        name: channel.guild.name,
        iconURL: channel.guild.iconURL() || undefined,
    })
        .setTitle(options.prize)
        .setColor(embedColor)
        .setFooter({
        text: activeMessages.embedFooter?.replace('{this.winnerCount}', winnerCount.toString()) || `${winnerCount} winner(s)`,
    });
    let description = '';
    // نص المشاركة
    description += type === 'button'
        ? `${activeMessages.inviteToParticipate || 'Click the button to enter!'}\n`
        : `${activeMessages.inviteToParticipate || 'React to enter!'}\n`;
    // وقت الانتهاء
    description += `${(activeMessages.drawing || 'Ends at {this.timestamp}').replace('{this.timestamp}', `<t:${Math.floor(endAt / 1000)}:R>`)}\n`;
    // من المستضيف
    description += `${activeMessages.hostedBy ? activeMessages.hostedBy.replace('{this.hostedBy}', `<@${options.hostId}>`) : ''}\n`;
    // 🎁 Bonus Entries (إذا فيه بيانات)
    if (options.bonusEntries && options.bonusEntries.length > 0) {
        description += `\n🎁 Bonus Entries:\n`;
        options.bonusEntries.forEach(bonus => {
            const target = bonus.userId ? `<@${bonus.userId}>` : bonus.roleId ? `<@&${bonus.roleId}>` : 'Unknown';
            description += `- ${target}: +${bonus.bonus}\n`;
        });
    }
    // 🔒 Requirements (إذا فيه بيانات)
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
            }
            catch {
                description += `- Must be in server: Invalid Invite\n`;
            }
        }
    }
    embed.setDescription(description);
    // إرسال الرسالة
    let msg;
    if (type === 'button') {
        const button = new discord_js_1.ButtonBuilder()
            .setCustomId('giveaway-join')
            .setEmoji(emoji)
            .setStyle(discord_js_1.ButtonStyle.Primary);
        const button2 = new discord_js_1.ButtonBuilder()
            .setCustomId('participants')
            .setEmoji("👥")
            .setLabel('Entries: 0')
            .setDisabled(true)
            .setStyle(discord_js_1.ButtonStyle.Secondary);
        const row = new discord_js_1.ActionRowBuilder().addComponents(button, button2);
        msg = await channel.send({
            content: activeMessages.giveaway || manager.messages.giveaway,
            embeds: [embed],
            components: [row],
        });
    }
    else {
        msg = await channel.send({
            content: activeMessages.giveaway || manager.messages.giveaway,
            embeds: [embed],
        });
        // دعم Unicode + Custom emoji
        const emojiToReact = emoji.startsWith('<') ? parseCustomEmoji(emoji) : emoji;
        await msg.react(emojiToReact);
    }
    // حفظ بيانات السحب
    const giveawayData = {
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
    const giveaway = new Giveaway_1.Giveaway(giveawayData, manager);
    manager.giveaways.push(giveaway);
    manager.save();
    await manager.createCollectorForGiveaway(giveaway, msg);
    return giveaway;
}
// دالة مساعدة لتحويل Custom emoji للنموذج الصحيح للـ React
function parseCustomEmoji(emoji) {
    const match = emoji.match(/<(a?):(\w+):(\d+)>/);
    if (!match)
        return emoji; // لو مش Custom emoji خليها زي ما هي
    const animated = match[1] === 'a';
    const name = match[2];
    const id = match[3];
    return animated ? `a:${name}:${id}` : `${name}:${id}`;
}
//# sourceMappingURL=start.js.map
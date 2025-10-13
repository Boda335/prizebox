"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createButtonCollector = createButtonCollector;
const discord_js_1 = require("discord.js");
async function createButtonCollector(manager, giveaway, msg) {
    const collector = msg.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        filter: i => i.customId === 'giveaway-join' && !i.user.bot,
    });
    collector.on('collect', async (interaction) => {
        try {
            const participantExists = giveaway.getParticipants().some(p => p.id === interaction.user.id);
            if (participantExists) {
                giveaway.removeParticipant(interaction.user.id);
                await interaction.reply({ content: manager.messages.leaveGiveaway, ephemeral: true });
            }
            else {
                const added = await giveaway.addParticipant(interaction.user);
                if (added) {
                    await interaction.reply({ content: manager.messages.enterGiveaway, ephemeral: true });
                }
                else {
                    await interaction.reply({ content: 'You are not eligible to join this giveaway.', ephemeral: true });
                }
            }
            manager.save();
            // إعادة بناء الزر الجديد بالكامل بدون الوصول للـ msg.components
            const joinButton = new discord_js_1.ButtonBuilder().setCustomId('giveaway-join').setStyle(discord_js_1.ButtonStyle.Primary).setLabel('Join');
            if (giveaway.data.emoji) {
                joinButton.setEmoji(giveaway.data.emoji);
            }
            const entriesButton = new discord_js_1.ButtonBuilder().setCustomId('participants').setEmoji('👥').setDisabled(true).setStyle(discord_js_1.ButtonStyle.Secondary).setLabel(`Entries: ${giveaway.getParticipants().length}`);
            const newRow = new discord_js_1.ActionRowBuilder().addComponents(joinButton, entriesButton);
            await interaction.message.edit({ components: [newRow] });
        }
        catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
            }
        }
    });
    manager.collectors.set(giveaway.data.messageId, collector);
}
//# sourceMappingURL=buttonCollector.js.map
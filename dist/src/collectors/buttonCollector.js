"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createButtonCollector = createButtonCollector;
const discord_js_1 = require("discord.js");
/**
 * Creates a button collector for a giveaway message.
 * This collector listens for button interactions and updates participants accordingly.
 *
 * @param manager The GiveawaysManager instance
 * @param giveaway The Giveaway instance
 * @param msg The giveaway message
 */
async function createButtonCollector(manager, giveaway, msg) {
    // Create a button collector for the "Join" button
    const collector = msg.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        filter: i => i.customId === 'giveaway-join' && !i.user.bot,
    });
    /**
     * Handle when a user clicks the "Join" button
     */
    collector.on('collect', async (interaction) => {
        try {
            const participantExists = giveaway.getParticipants().some(p => p.id === interaction.user.id);
            if (participantExists) {
                // If participant already joined, remove them
                giveaway.removeParticipant(interaction.user.id);
                await interaction.reply({ content: manager.messages.leaveGiveaway, flags: discord_js_1.MessageFlags.Ephemeral });
            }
            else {
                // Otherwise, try to add them
                const added = await giveaway.addParticipant(interaction.user);
                if (added) {
                    await interaction.reply({ content: manager.messages.enterGiveaway, flags: discord_js_1.MessageFlags.Ephemeral });
                }
                else {
                    await interaction.reply({ content: 'You are not eligible to join this giveaway.', flags: discord_js_1.MessageFlags.Ephemeral });
                }
            }
            // Save updated participants
            manager.save();
            // Rebuild the buttons completely without accessing msg.components
            const joinButton = new discord_js_1.ButtonBuilder().setCustomId('giveaway-join').setStyle(discord_js_1.ButtonStyle.Primary).setLabel('Join');
            if (giveaway.data.emoji) {
                joinButton.setEmoji(giveaway.data.emoji);
            }
            // Show total entries on a disabled secondary button
            const entriesButton = new discord_js_1.ButtonBuilder().setCustomId('participants').setEmoji('👥').setDisabled(true).setStyle(discord_js_1.ButtonStyle.Secondary).setLabel(`Entries: ${giveaway.getParticipants().length}`);
            const newRow = new discord_js_1.ActionRowBuilder().addComponents(joinButton, entriesButton);
            // Update the message with the new buttons
            await interaction.message.edit({ components: [newRow] });
        }
        catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Something went wrong.', flags: discord_js_1.MessageFlags.Ephemeral });
            }
        }
    });
    // Store the collector in the manager (keyed by message ID)
    manager.collectors.set(giveaway.data.messageId, collector);
}
//# sourceMappingURL=buttonCollector.js.map
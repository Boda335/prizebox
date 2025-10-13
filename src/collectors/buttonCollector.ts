import { Giveaway } from '../Giveaway';
import { Message, ButtonInteraction, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Creates a button collector for a giveaway message.
 * This collector listens for button interactions and updates participants accordingly.
 *
 * @param manager The GiveawaysManager instance
 * @param giveaway The Giveaway instance
 * @param msg The giveaway message
 */
export async function createButtonCollector(manager: any, giveaway: Giveaway, msg: Message) {
  // Create a button collector for the "Join" button
  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.customId === 'giveaway-join' && !i.user.bot,
  });

  /**
   * Handle when a user clicks the "Join" button
   */
  collector.on('collect', async (interaction: ButtonInteraction) => {
    try {
      const participantExists = giveaway.getParticipants().some(p => p.id === interaction.user.id);

      if (participantExists) {
        // If participant already joined, remove them
        giveaway.removeParticipant(interaction.user.id);
        await interaction.reply({ content: manager.messages.leaveGiveaway, ephemeral: true });
      } else {
        // Otherwise, try to add them
        const added = await giveaway.addParticipant(interaction.user);
        if (added) {
          await interaction.reply({ content: manager.messages.enterGiveaway, ephemeral: true });
        } else {
          await interaction.reply({ content: 'You are not eligible to join this giveaway.', ephemeral: true });
        }
      }

      // Save updated participants
      manager.save();

      // Rebuild the buttons completely without accessing msg.components
      const joinButton = new ButtonBuilder()
        .setCustomId('giveaway-join')
        .setStyle(ButtonStyle.Primary)
        .setLabel('Join');

      if (giveaway.data.emoji) {
        joinButton.setEmoji(giveaway.data.emoji);
      }

      // Show total entries on a disabled secondary button
      const entriesButton = new ButtonBuilder()
        .setCustomId('participants')
        .setEmoji('👥')
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary)
        .setLabel(`Entries: ${giveaway.getParticipants().length}`);

      const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton, entriesButton);

      // Update the message with the new buttons
      await interaction.message.edit({ components: [newRow] });
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
      }
    }
  });

  // Store the collector in the manager (keyed by message ID)
  manager.collectors.set(giveaway.data.messageId, collector);
}

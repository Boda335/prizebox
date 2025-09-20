import { Giveaway } from '../Giveaway';
import { Message, ButtonInteraction, ComponentType } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
/**
 * Creates a button collector for a giveaway message.
 * Handles joining/leaving participants when they click the button
 * and updates the embed to reflect the current number of entries.
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
export async function createButtonCollector(manager: any, giveaway: Giveaway, msg: Message) {
  // Create a button collector for the "giveaway-join" button
  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.customId === 'giveaway-join' && !i.user.bot,
  });

  collector.on('collect', async (interaction: ButtonInteraction) => {
    const participantExists = giveaway.getParticipants().some(p => p.id === interaction.user.id);

    if (participantExists) {
      // Remove participant if already joined
      giveaway.removeParticipant(interaction.user.id);
      await interaction.reply({
        content: manager.messages.leaveGiveaway,
        ephemeral: true,
      });
    } else {
      // Add participant to the giveaway
      giveaway.addParticipant(interaction.user);
      await interaction.reply({
        content: manager.messages.enterGiveaway,
        ephemeral: true,
      });
    }

    // Save updated data
    manager.save();

    // Update the embed description to reflect new number of entries

    const oldEmbed = interaction.message.embeds[0];
    if (oldEmbed) {
      const updatedDescription = oldEmbed.description?.replace(
        /Entries: \*\*\d+\*\*/,
        `Entries: **${giveaway.getParticipants().length}**`
      );

      const updatedEmbed = EmbedBuilder.from(oldEmbed).setDescription(updatedDescription || '');
      await interaction.message.edit({ embeds: [updatedEmbed] });
    }
  });

  // Store the collector in the manager for future reference or cleanup
  manager.collectors.set(giveaway.data.messageId, collector);
}

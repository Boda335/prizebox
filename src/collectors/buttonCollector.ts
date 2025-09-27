import { Giveaway } from '../Giveaway';
import { Message, ButtonInteraction, ComponentType } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

export async function createButtonCollector(manager: any, giveaway: Giveaway, msg: Message) {
  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.customId === 'giveaway-join' && !i.user.bot,
  });

  collector.on('collect', async (interaction: ButtonInteraction) => {
    try {
      const participantExists = giveaway.getParticipants().some(p => p.id === interaction.user.id);

      if (participantExists) {
        giveaway.removeParticipant(interaction.user.id);
        await interaction.reply({ content: manager.messages.leaveGiveaway, ephemeral: true });
      } else {
        // Add participant and check eligibility
        const added = await giveaway.addParticipant(interaction.user);

        if (added) {
          await interaction.reply({ content: manager.messages.enterGiveaway, ephemeral: true });
        } else {
          await interaction.reply({ content: 'You are not eligible to join this giveaway.', ephemeral: true });
        }
      }

      manager.save();

      // Update embed
      const oldEmbed = interaction.message.embeds[0];
      if (oldEmbed) {
        const updatedDescription = oldEmbed.description?.replace(/Entries: \*\*\d+\*\*/, `Entries: **${giveaway.getParticipants().length}**`);
        const updatedEmbed = EmbedBuilder.from(oldEmbed).setDescription(updatedDescription || '');
        await interaction.message.edit({ embeds: [updatedEmbed] });
      }
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
      }
    }
  });

  manager.collectors.set(giveaway.data.messageId, collector);
}

import { Giveaway } from '../Giveaway';
import { Message, MessageReaction, User } from 'discord.js';

/**
 * Creates a reaction collector for a giveaway message.
 * This collector listens for reactions on the giveaway message
 * and updates participants accordingly.
 *
 * @param manager The GiveawaysManager instance
 * @param giveaway The Giveaway instance
 * @param msg The giveaway message
 */
export async function createReactionCollector(manager: any, giveaway: Giveaway, msg: Message) {
  // Filter: only allow the giveaway's emoji and ignore bot reactions
  const filter = (reaction: MessageReaction, user: User) => reaction.emoji.name === giveaway.data.emoji && !user.bot;

  // Create the reaction collector with the given filter
  const collector = msg.createReactionCollector({ filter, dispose: true });

  /**
   * Handle when a user reacts with the giveaway emoji
   */
  collector.on('collect', async (reaction, user) => {
    try {
      const added = await giveaway.addParticipant(user);
      if (added) manager.save();
    } catch (err) {
      console.error(err);
    }
  });

  /**
   * Handle when a user removes their reaction
   */
  collector.on('remove', async (reaction, user) => {
    try {
      const participantExists = giveaway.getParticipants().some(p => p.id === user.id);
      if (participantExists) {
        giveaway.removeParticipant(user.id);
        manager.save();
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Store the collector in the manager (keyed by message ID)
  manager.collectors.set(giveaway.data.messageId, collector);
}

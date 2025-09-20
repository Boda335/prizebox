"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReactionCollector = createReactionCollector;
/**
 * Creates a reaction collector for a giveaway message.
 * Handles adding/removing participants based on reactions.
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
async function createReactionCollector(manager, giveaway, msg) {
    // Filter for the correct emoji and ignore bots
    const filter = (reaction, user) => reaction.emoji.name === giveaway.data.emoji && !user.bot;
    // Create the reaction collector
    const collector = msg.createReactionCollector({ filter, dispose: true });
    // When a user reacts
    collector.on('collect', async (reaction, user) => {
        if (!giveaway.getParticipants().some(p => p.id === user.id)) {
            giveaway.addParticipant(user); // Add participant
            manager.save(); // Save changes
        }
    });
    // When a user removes their reaction
    collector.on('remove', async (reaction, user) => {
        if (giveaway.getParticipants().some(p => p.id === user.id)) {
            giveaway.removeParticipant(user.id); // Remove participant
            manager.save(); // Save changes
        }
    });
    // Store the collector in the manager for later reference/removal
    manager.collectors.set(giveaway.data.messageId, collector);
}
//# sourceMappingURL=reactionCollector.js.map
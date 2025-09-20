"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncParticipantsFromReactions = syncParticipantsFromReactions;
/**
 * Syncs participants of a giveaway based on reactions on the giveaway message.
 * Adds users who reacted and removes users who no longer reacted.
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
async function syncParticipantsFromReactions(manager, giveaway, msg) {
    // Get the reaction object for the giveaway emoji
    const reaction = msg.reactions.cache.get(giveaway.data.emoji);
    if (!reaction)
        return;
    // Fetch all users who reacted
    const users = await reaction.users.fetch();
    // Get current participant IDs
    const currentIds = giveaway.getParticipants().map(p => p.id);
    // Add new participants who reacted but are not yet in the giveaway
    for (const [id, user] of users) {
        if (!user.bot && !currentIds.includes(id)) {
            giveaway.addParticipant(user);
        }
    }
    // Remove participants who are in the giveaway but no longer reacted
    for (const participant of giveaway.getParticipants()) {
        if (!users.has(participant.id)) {
            giveaway.removeParticipant(participant.id);
        }
    }
    // Save updated data to storage
    manager.save();
}
//# sourceMappingURL=syncParticipants.js.map
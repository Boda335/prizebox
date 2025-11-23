"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGiveaway = deleteGiveaway;
/**
 * Delete a giveaway message and remove it from storage.
 * @param manager The GiveawaysManager instance
 * @param messageId The giveaway message ID
 * @returns true if deleted successfully
 */
async function deleteGiveaway(manager, messageId) {
    // Find the giveaway by message ID
    const index = manager.giveaways.findIndex(g => g.data.messageId === messageId);
    if (index === -1)
        throw new Error('Giveaway not found');
    const giveaway = manager.giveaways[index];
    const channel = manager.client.channels.cache.get(giveaway.data.channelId);
    // Stop collector (important!)
    manager['removeCollector'](messageId);
    // Try to delete the giveaway message from the channel
    if (channel) {
        const msg = await channel.messages.fetch(messageId).catch(() => null);
        if (msg) {
            await msg.delete().catch(() => null); // Ignore errors
        }
    }
    // Remove giveaway from memory
    manager.giveaways.splice(index, 1);
    // Save updated file (storage)
    manager.save();
    return true;
}
//# sourceMappingURL=delete.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreCollectors = restoreCollectors;
const reactionCollector_1 = require("./reactionCollector");
const buttonCollector_1 = require("./buttonCollector");
const syncParticipants_1 = require("./syncParticipants");
/**
 * Restores collectors for all active giveaways.
 * This is usually called after initializing the manager or restarting the bot.
 * @param manager The GiveawaysManager instance
 */
async function restoreCollectors(manager) {
    for (const giveaway of manager.giveaways) {
        // Skip ended or paused giveaways
        if (giveaway.data.ended || giveaway.data.paused)
            continue;
        // Fetch the channel where the giveaway is hosted
        const channel = manager.client.channels.cache.get(giveaway.data.channelId);
        if (!channel)
            continue;
        // Fetch the giveaway message
        const msg = await channel.messages.fetch(giveaway.data.messageId).catch(() => null);
        if (!msg)
            continue;
        // Sync participants from reactions (if any)
        await (0, syncParticipants_1.syncParticipantsFromReactions)(manager, giveaway, msg);
        // Create the appropriate collector based on giveaway type
        if (giveaway.data.type === 'reaction') {
            await (0, reactionCollector_1.createReactionCollector)(manager, giveaway, msg);
        }
        else if (giveaway.data.type === 'button') {
            await (0, buttonCollector_1.createButtonCollector)(manager, giveaway, msg);
        }
    }
}
//# sourceMappingURL=restoreCollectors.js.map
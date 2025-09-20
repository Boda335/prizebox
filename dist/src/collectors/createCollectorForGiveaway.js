"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollectorForGiveaway = createCollectorForGiveaway;
const reactionCollector_1 = require("./reactionCollector");
const buttonCollector_1 = require("./buttonCollector");
/**
 * Creates the appropriate collector for a giveaway message
 * based on the giveaway type (reaction or button).
 * @param manager The GiveawaysManager instance
 * @param giveaway The giveaway instance
 * @param msg The Discord message representing the giveaway
 */
async function createCollectorForGiveaway(manager, giveaway, msg) {
    if (giveaway.data.type === 'reaction') {
        // Create a reaction collector for reaction-based giveaways
        await (0, reactionCollector_1.createReactionCollector)(manager, giveaway, msg);
    }
    else if (giveaway.data.type === 'button') {
        // Create a button collector for button-based giveaways
        await (0, buttonCollector_1.createButtonCollector)(manager, giveaway, msg);
    }
}
//# sourceMappingURL=createCollectorForGiveaway.js.map
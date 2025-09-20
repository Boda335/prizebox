"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGiveaways = listGiveaways;
/**
 * Lists giveaways filtered by their status.
 * @param manager The GiveawaysManager instance
 * @param status Optional filter: 'active' | 'paused' | 'ended'
 * @returns An array of giveaways matching the filter
 */
function listGiveaways(manager, status) {
    return manager.giveaways.filter(g => {
        if (status === 'active')
            return !g.data.ended && !g.data.paused; // Running giveaways
        if (status === 'paused')
            return g.data.paused; // Paused giveaways
        if (status === 'ended')
            return g.data.ended; // Ended giveaways
        return true; // If no status provided, return all giveaways
    });
}
//# sourceMappingURL=list.js.map
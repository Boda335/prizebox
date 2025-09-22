import { GiveawaysManager } from '../GiveawaysManager';
/**
 * Rerolls a giveaway by selecting new winners.
 * @param manager The GiveawaysManager instance
 * @param messageId The ID of the giveaway message
 * @param winnerCount Optional number of winners (defaults to the original count)
 * @returns The new winners as an array of participants
 */
export declare function rerollGiveaway(manager: GiveawaysManager, messageId: string, winnerCount?: number): Promise<import("..").Participant[]>;
//# sourceMappingURL=reroll.d.ts.map
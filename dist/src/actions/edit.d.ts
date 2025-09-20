import { GiveawaysManager } from '../GiveawaysManager';
interface EditOptions {
    prize?: string;
    winnerCount?: number;
    addTime?: number;
}
/**
 * Edit an ongoing giveaway (prize, winners count, or duration).
 * @param manager The GiveawaysManager instance
 * @param messageId The giveaway message ID
 * @param options Edit options (prize, winnerCount, addTime)
 */
export declare function editGiveaway(manager: GiveawaysManager, messageId: string, options: EditOptions): Promise<import("..").Giveaway>;
export {};
//# sourceMappingURL=edit.d.ts.map
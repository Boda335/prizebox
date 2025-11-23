import { GiveawaysManager } from '../GiveawaysManager';
interface EditOptions {
    prize?: string;
    winnerCount?: number;
    addTime?: number;
}
export declare function editGiveaway(manager: GiveawaysManager, messageId: string, options: EditOptions): Promise<import("..").Giveaway>;
export {};
//# sourceMappingURL=edit.d.ts.map
import { GiveawaysManager } from '../GiveawaysManager';
/**
 * Resume a paused giveaway
 * @param manager The giveaways manager
 * @param messageId The ID of the giveaway message
 * @param newEndAt Optional new end timestamp in milliseconds
 * @returns The updated giveaway
 */
export declare function resumeGiveaway(manager: GiveawaysManager, messageId: string, newEndAt?: number): Promise<import("..").Giveaway>;
//# sourceMappingURL=resume.d.ts.map
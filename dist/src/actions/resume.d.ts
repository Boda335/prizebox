import { GiveawaysManager } from '../GiveawaysManager';
/**
 * Resumes a paused giveaway.
 * Updates the giveaway message and optionally sets a new end time.
 * @param manager The GiveawaysManager instance
 * @param messageId The ID of the giveaway message
 * @param newEndAt Optional new end timestamp for the giveaway
 * @returns The resumed Giveaway instance
 */
export declare function resumeGiveaway(manager: GiveawaysManager, messageId: string, newEndAt?: number): Promise<import("..").Giveaway>;
//# sourceMappingURL=resume.d.ts.map
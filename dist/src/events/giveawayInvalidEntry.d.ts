import { Giveaway } from '../Giveaway';
import { Participant } from '../types';
/**
 * Handles the case when a participant tries to enter a giveaway
 * but fails validation (e.g., bot not allowed).
 * @param giveaway The giveaway instance
 * @param participant The participant attempting to join
 * @param reason Reason why the entry is invalid
 */
export declare function giveawayInvalidEntry(giveaway: Giveaway, participant: Participant, reason: string): void;
//# sourceMappingURL=giveawayInvalidEntry.d.ts.map
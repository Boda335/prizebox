import { Giveaway } from '../Giveaway';
import { Participant } from '../types';

/**
 * Handles the case when a participant tries to enter a giveaway
 * but fails validation (e.g., bot not allowed).
 * @param giveaway The giveaway instance
 * @param participant The participant attempting to join
 * @param reason Reason why the entry is invalid
 */
export function giveawayInvalidEntry(giveaway: Giveaway, participant: Participant, reason: string) {
  // TODO: Implement logic for invalid entry
  // Example actions:
  // 1. Log the invalid entry for debugging
  // 2. Notify the participant via DM or message
  // 3. Emit an event if needed
  // Currently, this function is empty and serves as a placeholder
}

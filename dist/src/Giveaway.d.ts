import { User } from 'discord.js';
import { GiveawaysManager } from './GiveawaysManager';
import { GiveawayData, Participant } from './types';
/**
 * Represents a single giveaway.
 */
export declare class Giveaway {
    data: GiveawayData;
    private manager;
    constructor(data: GiveawayData, manager: GiveawaysManager);
    /**
     * Add a participant to the giveaway
     * @param user Discord User
     */
    addParticipant(user: User): void;
    /**
     * Remove a participant from the giveaway
     * @param userId Discord user ID
     */
    removeParticipant(userId: string): void;
    /**
     * Set the winners of the giveaway
     * @param winners Array of participants
     */
    setWinners(winners: Participant[]): void;
    /** Get all participants */
    getParticipants(): Participant[];
    /** Get IDs of winners */
    getWinners(): string[];
    /** Get type of giveaway: reaction or button */
    getType(): 'reaction' | 'button';
    /** Get the emoji used in this giveaway */
    getEmoji(): string;
}
//# sourceMappingURL=Giveaway.d.ts.map
import { User } from 'discord.js';
import { GiveawaysManager } from './GiveawaysManager';
import { GiveawayData, Participant } from './types';
/**
 * Represents a single giveaway instance.
 */
export declare class Giveaway {
    data: GiveawayData;
    private manager;
    constructor(data: GiveawayData, manager: GiveawaysManager);
    /**
     * Add a participant to the giveaway.
     * Validates requirements before adding the user.
     * @param user Discord User
     */
    addParticipant(user: User): Promise<boolean>;
    /**
     * Remove reaction or update the giveaway embed if entry is invalid.
     * @param user Discord User
     */
    private removeReactionOrUpdateEmbed;
    /**
     * Remove a participant from the giveaway.
     * @param userId Discord user ID
     */
    removeParticipant(userId: string): void;
    /**
     * Set the winners of the giveaway.
     * @param winners Array of participants
     */
    setWinners(winners: Participant[]): void;
    /** Returns all participants */
    getParticipants(): Participant[];
    /** Returns winner IDs */
    getWinners(): string[];
    /** Returns the type of giveaway: reaction or button */
    getType(): 'reaction' | 'button';
    /** Returns the emoji used in this giveaway */
    getEmoji(): string;
}
//# sourceMappingURL=Giveaway.d.ts.map
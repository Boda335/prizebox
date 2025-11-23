import { User } from 'discord.js';
import { GiveawaysManager } from './GiveawaysManager';
import { GiveawayData, Participant } from './types';
export declare class Giveaway {
    data: GiveawayData;
    private manager;
    constructor(data: GiveawayData, manager: GiveawaysManager);
    /** Add participant */
    addParticipant(user: User): Promise<boolean>;
    /** Remove invalid reaction */
    private removeReactionOrUpdateEmbed;
    /** Remove participant */
    removeParticipant(userId: string): void;
    /** Set winners */
    setWinners(winners: Participant[]): void;
    getParticipants(): Participant[];
    getWinners(): string[];
    getType(): 'reaction' | 'button';
    getEmoji(): string;
}
//# sourceMappingURL=Giveaway.d.ts.map
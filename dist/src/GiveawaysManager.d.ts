import { Client, ColorResolvable, Message, TextChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { Giveaway } from './Giveaway';
import { JsonStorage } from './storage/JsonStorage';
import { ManagerOptions, Participant } from './types';
/**
 * Events emitted by the GiveawaysManager
 */
export interface GiveawayEvents {
    /** When a participant joins a giveaway */
    giveawayJoin: (participant: Participant, giveaway: Giveaway) => void;
    /** When a participant leaves a giveaway */
    giveawayLeave: (participant: Participant, giveaway: Giveaway) => void;
    /** When a user tries to enter but fails validation */
    giveawayInvalidEntry: (userId: string, giveaway: Giveaway) => void;
}
/**
 * EventEmitter typings for GiveawaysManager
 */
export declare interface GiveawaysManager {
    on<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
    once<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
    off<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
    emit<U extends keyof GiveawayEvents>(event: U, ...args: Parameters<GiveawayEvents[U]>): boolean;
}
/**
 * Main class for managing giveaways
 */
export declare class GiveawaysManager extends EventEmitter {
    client: Client;
    storage: JsonStorage;
    giveaways: Giveaway[];
    private collectors;
    defaults: {
        botsCanWin: boolean;
        embedColor: ColorResolvable;
        embedColorEnd: ColorResolvable;
        checkInterval: number;
        type: 'reaction' | 'button';
        emoji: string;
    };
    messages: Record<string, string>;
    lastChance?: {
        enabled: boolean;
        content: string;
        threshold: number;
        embedColor: ColorResolvable;
    };
    pauseOptions?: {
        isPaused: boolean;
        content: string;
        unpauseAfter: number | null;
        embedColor: ColorResolvable;
        infiniteDurationText: string;
    };
    /**
     * Constructor
     * @param client Discord client
     * @param options Manager configuration options
     */
    constructor(client: Client, options: ManagerOptions);
    /**
     * Start a new giveaway
     */
    start(channel: TextChannel, options: any, managerOverrides?: Partial<ManagerOptions>): Promise<Giveaway>;
    /** End a giveaway */
    end(messageId: string): Promise<Giveaway>;
    /** Pause a giveaway */
    pause(messageId: string): Promise<Giveaway>;
    /** Resume a paused giveaway */
    resume(messageId: string, newEndAt?: number): Promise<Giveaway>;
    /** Edit giveaway details */
    edit(messageId: string, options: {
        prize?: string;
        winnerCount?: number;
        addTime?: number;
    }): Promise<Giveaway>;
    /** Delete a giveaway */
    delete(messageId: string): Promise<boolean>;
    /** List giveaways by status */
    list(status?: 'active' | 'paused' | 'ended'): Giveaway[];
    /** Reroll winners */
    reroll(messageId: string, winnerCount?: number): Promise<Participant[]>;
    /** Get leaderboard */
    leaderboard(type?: 'entries' | 'wins', top?: number): {
        rank: number;
        id: string;
        username: string;
        avatar: string;
        entries: number;
        wins: number;
    }[];
    /** Send leaderboard to a channel */
    sendLeaderboard(channel: TextChannel, type?: 'entries' | 'wins', top?: number): Promise<void>;
    /** Save all giveaways to storage */
    save(): void;
    /** Create a collector for a giveaway */
    createCollectorForGiveaway(giveaway: Giveaway, msg: Message): Promise<void>;
    /** Sync participants from reactions */
    syncParticipantsFromReactions(giveaway: Giveaway, msg: Message): Promise<void>;
    /** Remove active collector */
    private removeCollector;
    /** Periodically check all giveaways */
    private checkGiveaways;
}
//# sourceMappingURL=GiveawaysManager.d.ts.map
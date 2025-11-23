import { Client, ColorResolvable, Message, TextChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { Giveaway } from './Giveaway';
import { JsonStorage } from './storage/JsonStorage';
import { ManagerOptions, Participant } from './types';
export interface GiveawayEvents {
    participantJoined: (participant: Participant, giveaway: Giveaway) => void;
    participantLeft: (participant: Participant, giveaway: Giveaway) => void;
    entryFailed: (participant: Participant, giveaway: Giveaway, reason: string | {
        code: 'notInRequiredGuild';
        guildName?: string;
        inviteURL?: string;
        guildIcon?: string;
    } | {
        code: 'invalidInvite';
        inviteURL?: string;
    } | {
        code: 'missingRequiredRole';
        roleId: string;
    }) => void;
    giveawayWon: (winners: Participant[], giveaway: Giveaway) => void;
    giveawayRerolled: (newWinners: Participant[], giveaway: Giveaway) => void;
    entryAfterEnd: (participant: Participant, giveaway: Giveaway) => void;
    giveawayPaused: (giveaway: Giveaway) => void;
}
export declare interface GiveawaysManager {
    on<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
    once<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
    off<U extends keyof GiveawayEvents>(event: U, listener: GiveawayEvents[U]): this;
    emit<U extends keyof GiveawayEvents>(event: U, ...args: Parameters<GiveawayEvents[U]>): boolean;
}
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
        embedColor: ColorResolvable;
        pausedAt?: number;
        infiniteDurationText: string;
    };
    constructor(client: Client, options: ManagerOptions);
    start(channel: TextChannel, options: any, managerOverrides?: Partial<ManagerOptions>): Promise<Giveaway>;
    end(messageId: string): Promise<Giveaway>;
    pause(messageId: string, unpauseAfter?: number): Promise<Giveaway>;
    resume(messageId: string, newEndAt?: number): Promise<Giveaway>;
    edit(messageId: string, options: {
        prize?: string;
        winnerCount?: number;
        addTime?: number;
    }): Promise<Giveaway>;
    delete(messageId: string): Promise<boolean>;
    list(status?: 'active' | 'paused' | 'ended'): Giveaway[];
    reroll(messageId: string, winnerCount?: number): Promise<Participant[]>;
    leaderboard(type?: 'entries' | 'wins', top?: number): {
        rank: number;
        id: string;
        username: string;
        avatar: string;
        entries: number;
        wins: number;
    }[];
    sendLeaderboard(channel: TextChannel, type?: 'entries' | 'wins', top?: number): Promise<void>;
    generateTranscript(messageId: string, outputDir?: string): Promise<string>;
    save(): void;
    createCollectorForGiveaway(giveaway: Giveaway, msg: Message): Promise<void>;
    syncParticipantsFromReactions(giveaway: Giveaway, msg: Message): Promise<void>;
    private removeCollector;
    private checkGiveaways;
}
//# sourceMappingURL=GiveawaysManager.d.ts.map
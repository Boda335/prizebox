"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiveawaysManager = void 0;
const discord_js_1 = require("discord.js");
const events_1 = require("events");
const Giveaway_1 = require("./Giveaway");
const JsonStorage_1 = require("./storage/JsonStorage");
// Actions for giveaways
const delete_1 = require("./actions/delete");
const edit_1 = require("./actions/edit");
const end_1 = require("./actions/end");
const leaderboard_1 = require("./actions/leaderboard");
const list_1 = require("./actions/list");
const pause_1 = require("./actions/pause");
const reroll_1 = require("./actions/reroll");
const resume_1 = require("./actions/resume");
const start_1 = require("./actions/start");
// Collectors to handle reactions or buttons
const createCollectorForGiveaway_1 = require("./collectors/createCollectorForGiveaway");
const restoreCollectors_1 = require("./collectors/restoreCollectors");
const syncParticipants_1 = require("./collectors/syncParticipants");
/**
 * Main class for managing giveaways
 */
class GiveawaysManager extends events_1.EventEmitter {
    /**
     * Constructor
     * @param client Discord client
     * @param options Manager configuration options
     */
    constructor(client, options) {
        super();
        this.giveaways = []; // Array of all giveaways
        this.collectors = new Map(); // Active collectors for giveaways
        this.client = client;
        this.storage = new JsonStorage_1.JsonStorage(options.storage);
        // Set default options with fallback values
        this.defaults = {
            botsCanWin: options.defaults?.botsCanWin ?? false,
            embedColor: options.defaults?.embedColor ?? '#FF0000',
            embedColorEnd: options.defaults?.embedColorEnd ?? '#000000',
            checkInterval: options.defaults?.checkInterval ?? 1000,
            type: options.defaults?.type ?? 'reaction',
            emoji: options.defaults?.emoji ?? '🎉',
        };
        // Default messages
        this.messages = options.messages ?? {
            giveaway: '🎉 Giveaway 🎉',
            giveawayEnded: '🎉 Giveaway Ended 🎉',
            drawing: 'Ends at: {this.timestamp}',
            winnerCount: '{this.winnerCount}',
            inviteToParticipate: 'React with 🎉 to join!',
            winMessage: 'Congrats {winners}, you won {this.prize}!\n{this.messageURL}',
            embedFooter: '{this.winnerCount} winner(s)',
            noWinner: 'No valid participants for {this.prize}.',
            hostedBy: 'Hosted by: {this.hostedBy}',
            winners: 'Winner"s":',
            endedAt: 'Ended at',
            enterGiveaway: 'You joined the giveaway!',
            leaveGiveaway: 'You left the giveaway!',
        };
        // Last chance settings
        this.lastChance = {
            enabled: options.lastChance?.enabled ?? true,
            content: options.lastChance?.content ?? '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
            threshold: options.lastChance?.threshold ?? 10000,
            embedColor: options.lastChance?.embedColor ?? this.defaults.embedColor,
        };
        // Pause options
        this.pauseOptions = {
            isPaused: options.pauseOptions?.isPaused ?? false,
            content: options.pauseOptions?.content ?? '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
            unpauseAfter: options.pauseOptions?.unpauseAfter ?? null,
            embedColor: options.pauseOptions?.embedColor ?? '#FFFF00',
            infiniteDurationText: options.pauseOptions?.infiniteDurationText ?? '`NEVER`',
        };
        // Load all giveaways from storage
        this.giveaways = this.storage.all().map(g => new Giveaway_1.Giveaway(g, this));
        // Check giveaways periodically
        setInterval(() => this.checkGiveaways(), this.defaults.checkInterval);
        // Restore collectors after initialization
        setTimeout(() => (0, restoreCollectors_1.restoreCollectors)(this), 5000);
    }
    /**
     * Start a new giveaway
     */
    async start(channel, options, managerOverrides) {
        // Merge defaults and overrides
        const mergedDefaults = { ...this.defaults, ...managerOverrides?.defaults };
        const mergedLastChance = {
            enabled: managerOverrides?.lastChance?.enabled ?? this.lastChance?.enabled ?? true,
            content: managerOverrides?.lastChance?.content ??
                this.lastChance?.content ??
                '⚠️ **LAST CHANCE TO ENTER !** ⚠️',
            threshold: managerOverrides?.lastChance?.threshold ?? this.lastChance?.threshold ?? 10000,
            embedColor: managerOverrides?.lastChance?.embedColor ??
                this.lastChance?.embedColor ??
                this.defaults.embedColor,
        };
        const mergedPauseOptions = {
            isPaused: managerOverrides?.pauseOptions?.isPaused ?? this.pauseOptions?.isPaused ?? false,
            content: managerOverrides?.pauseOptions?.content ??
                this.pauseOptions?.content ??
                '⚠️ **THIS GIVEAWAY IS PAUSED !** ⚠️',
            unpauseAfter: managerOverrides?.pauseOptions?.unpauseAfter ?? this.pauseOptions?.unpauseAfter ?? null,
            embedColor: managerOverrides?.pauseOptions?.embedColor ?? this.pauseOptions?.embedColor ?? '#FFFF00',
            infiniteDurationText: managerOverrides?.pauseOptions?.infiniteDurationText ??
                this.pauseOptions?.infiniteDurationText ??
                '`NEVER`',
        };
        const mergedMessages = managerOverrides?.messages ?? this.messages;
        const tempManager = Object.create(this);
        tempManager.defaults = mergedDefaults;
        tempManager.lastChance = mergedLastChance;
        tempManager.pauseOptions = mergedPauseOptions;
        tempManager.messages = mergedMessages;
        const giveawayType = options.type ?? tempManager.defaults.type;
        const giveawayEmoji = options.emoji ?? tempManager.defaults.emoji;
        return (0, start_1.startGiveaway)(tempManager, channel, {
            ...options,
            type: giveawayType,
            emoji: giveawayEmoji,
        });
    }
    /** End a giveaway */
    async end(messageId) {
        this.removeCollector(messageId);
        return (0, end_1.endGiveaway)(this, messageId);
    }
    /** Pause a giveaway */
    pause(messageId) {
        this.removeCollector(messageId);
        return (0, pause_1.pauseGiveaway)(this, messageId);
    }
    /** Resume a paused giveaway */
    async resume(messageId, newEndAt) {
        const result = await (0, resume_1.resumeGiveaway)(this, messageId, newEndAt);
        const giveaway = this.giveaways.find(g => g.data.messageId === messageId);
        if (giveaway && !giveaway.data.ended) {
            try {
                const channel = this.client.channels.cache.get(giveaway.data.channelId);
                if (channel) {
                    const msg = await channel.messages.fetch(messageId).catch(() => null);
                    if (msg)
                        await (0, createCollectorForGiveaway_1.createCollectorForGiveaway)(this, giveaway, msg);
                }
            }
            catch (error) {
                console.error(`Failed to recreate collector after resume:`, error);
            }
        }
        return result;
    }
    /** Edit giveaway details */
    edit(messageId, options) {
        return (0, edit_1.editGiveaway)(this, messageId, options);
    }
    /** Delete a giveaway */
    delete(messageId) {
        this.removeCollector(messageId);
        return (0, delete_1.deleteGiveaway)(this, messageId);
    }
    /** List giveaways by status */
    list(status) {
        return (0, list_1.listGiveaways)(this, status);
    }
    /** Reroll winners */
    reroll(messageId, winnerCount) {
        return (0, reroll_1.rerollGiveaway)(this, messageId, winnerCount);
    }
    /** Get leaderboard */
    leaderboard(type = 'entries', top = 10) {
        return (0, leaderboard_1.getLeaderboard)(this, type, top);
    }
    /** Send leaderboard to a channel */
    sendLeaderboard(channel, type = 'entries', top = 10) {
        return (0, leaderboard_1.sendLeaderboard)(this, channel, type, top);
    }
    /** Save all giveaways to storage */
    save() {
        this.storage.saveAll(this.giveaways.map(g => g.data));
    }
    /** Create a collector for a giveaway */
    async createCollectorForGiveaway(giveaway, msg) {
        this.removeCollector(giveaway.data.messageId);
        await (0, createCollectorForGiveaway_1.createCollectorForGiveaway)(this, giveaway, msg);
    }
    /** Sync participants from reactions */
    async syncParticipantsFromReactions(giveaway, msg) {
        await (0, syncParticipants_1.syncParticipantsFromReactions)(this, giveaway, msg);
    }
    /** Remove active collector */
    removeCollector(messageId) {
        const collector = this.collectors.get(messageId);
        if (collector) {
            collector.stop();
            this.collectors.delete(messageId);
        }
    }
    /** Periodically check all giveaways */
    async checkGiveaways() {
        const now = Date.now();
        for (const g of this.giveaways) {
            if (g.data.ended || g.data.paused)
                continue;
            // Last chance notification
            if (this.lastChance?.enabled &&
                !g.data.lastChanceTriggered &&
                g.data.endAt - now <= this.lastChance.threshold) {
                try {
                    const channel = this.client.channels.cache.get(g.data.channelId);
                    if (!channel)
                        continue;
                    const msg = await channel.messages.fetch(g.data.messageId).catch(() => null);
                    if (!msg)
                        continue;
                    const embed = discord_js_1.EmbedBuilder.from(msg.embeds[0]).setColor(this.lastChance?.embedColor ?? this.defaults.embedColor);
                    await msg.edit({ content: this.lastChance.content, embeds: [embed] });
                    g.data.lastChanceTriggered = true;
                    this.save();
                }
                catch (err) {
                    console.error('Last chance update failed:', err);
                }
            }
            // End giveaway if time reached
            if (g.data.endAt <= now)
                await this.end(g.data.messageId);
        }
    }
}
exports.GiveawaysManager = GiveawaysManager;
//# sourceMappingURL=GiveawaysManager.js.map
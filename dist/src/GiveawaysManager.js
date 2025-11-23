"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiveawaysManager = void 0;
const discord_js_1 = require("discord.js");
const events_1 = require("events");
const Giveaway_1 = require("./Giveaway");
const JsonStorage_1 = require("./storage/JsonStorage");
// Giveaway actions
const delete_1 = require("./actions/delete");
const edit_1 = require("./actions/edit");
const end_1 = require("./actions/end");
const leaderboard_1 = require("./actions/leaderboard");
const list_1 = require("./actions/list");
const pause_1 = require("./actions/pause");
const reroll_1 = require("./actions/reroll");
const resume_1 = require("./actions/resume");
const start_1 = require("./actions/start");
const transcript_1 = require("./actions/transcript");
// Collectors
const createCollectorForGiveaway_1 = require("./collectors/createCollectorForGiveaway");
const restoreCollectors_1 = require("./collectors/restoreCollectors");
const syncParticipants_1 = require("./collectors/syncParticipants");
class GiveawaysManager extends events_1.EventEmitter {
    constructor(client, options) {
        super();
        this.giveaways = [];
        this.collectors = new Map();
        this.client = client;
        this.storage = new JsonStorage_1.JsonStorage(options.storage);
        // Default giveaway options
        this.defaults = {
            botsCanWin: options.defaults?.botsCanWin ?? false,
            embedColor: options.defaults?.embedColor ?? '#FF0000',
            embedColorEnd: options.defaults?.embedColorEnd ?? '#000000',
            checkInterval: options.defaults?.checkInterval ?? 1000,
            type: options.defaults?.type ?? 'reaction',
            emoji: options.defaults?.emoji ?? '🎉',
        };
        // Default messages for giveaways
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
        // Last chance options
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
            embedColor: options.pauseOptions?.embedColor ?? '#FFFF00',
            infiniteDurationText: options.pauseOptions?.infiniteDurationText ?? '`INFINITY`',
        };
        // Load existing giveaways from storage
        this.giveaways = this.storage.all().map(g => new Giveaway_1.Giveaway(g, this));
        // Regularly check for ending giveaways
        setInterval(() => this.checkGiveaways(), this.defaults.checkInterval);
        // Restore collectors after bot restart
        setTimeout(() => (0, restoreCollectors_1.restoreCollectors)(this), 5000);
    }
    async start(channel, options, managerOverrides) {
        // Merge manager defaults with overrides
        const activeDefaults = deepMerge(this.defaults, managerOverrides?.defaults || {});
        const activeLastChance = deepMerge(this.lastChance, managerOverrides?.lastChance || {});
        const activePauseOptions = deepMerge(this.pauseOptions, managerOverrides?.pauseOptions || {});
        const activeMessages = deepMerge(this.messages, managerOverrides?.messages || {});
        // Create temporary manager instance with merged options
        const tempManager = Object.create(this);
        tempManager.defaults = activeDefaults;
        tempManager.lastChance = activeLastChance;
        tempManager.pauseOptions = activePauseOptions;
        tempManager.messages = activeMessages;
        tempManager.storage = this.storage;
        const giveawayType = options.type ?? activeDefaults.type;
        const giveawayEmoji = options.emoji ?? activeDefaults.emoji;
        const giveaway = await (0, start_1.startGiveaway)(tempManager, channel, {
            ...options,
            type: giveawayType,
            emoji: giveawayEmoji,
        });
        tempManager.save();
        return giveaway;
    }
    async end(messageId) {
        return (0, end_1.endGiveaway)(this, messageId);
    }
    pause(messageId, unpauseAfter) {
        this.removeCollector(messageId);
        return (0, pause_1.pauseGiveaway)(this, messageId, unpauseAfter);
    }
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
    edit(messageId, options) {
        return (0, edit_1.editGiveaway)(this, messageId, options);
    }
    delete(messageId) {
        this.removeCollector(messageId);
        return (0, delete_1.deleteGiveaway)(this, messageId);
    }
    list(status) {
        return (0, list_1.listGiveaways)(this, status);
    }
    reroll(messageId, winnerCount) {
        return (0, reroll_1.rerollGiveaway)(this, messageId, winnerCount);
    }
    leaderboard(type = 'entries', top = 10) {
        return (0, leaderboard_1.getLeaderboard)(this, type, top);
    }
    sendLeaderboard(channel, type = 'entries', top = 10) {
        return (0, leaderboard_1.sendLeaderboard)(this, channel, type, top);
    }
    async generateTranscript(messageId, outputDir) {
        try {
            return await (0, transcript_1.generateTranscript)(this, messageId, { outputDir });
        }
        catch (error) {
            console.error(`Failed to generate transcript for giveaway ${messageId}:`, error);
            throw error;
        }
    }
    save() {
        const giveawaysByGuild = {};
        this.giveaways.forEach(g => {
            if (!giveawaysByGuild[g.data.guildId])
                giveawaysByGuild[g.data.guildId] = [];
            giveawaysByGuild[g.data.guildId].push(g.data);
        });
        this.storage.setAllGiveaways(giveawaysByGuild);
    }
    async createCollectorForGiveaway(giveaway, msg) {
        this.removeCollector(giveaway.data.messageId);
        await (0, createCollectorForGiveaway_1.createCollectorForGiveaway)(this, giveaway, msg);
    }
    async syncParticipantsFromReactions(giveaway, msg) {
        await (0, syncParticipants_1.syncParticipantsFromReactions)(this, giveaway, msg);
    }
    removeCollector(messageId) {
        const collector = this.collectors.get(messageId);
        if (collector) {
            collector.stop();
            this.collectors.delete(messageId);
        }
    }
    async checkGiveaways() {
        const now = Date.now();
        for (const g of this.giveaways) {
            // Auto-resume paused giveaway if unpauseAfter is set
            if (g.data.paused && g.data.pauseOptions?.unpauseAfter) {
                if (now >= g.data.pauseOptions.unpauseAfter) {
                    await this.resume(g.data.messageId);
                }
                continue;
            }
            if (g.data.ended)
                continue;
            try {
                const lc = g.data.lastChance ?? this.lastChance;
                // LAST CHANCE FEATURE
                if (lc?.enabled && !g.data.lastChanceTriggered && g.data.endAt - now <= lc.threshold) {
                    const channel = this.client.channels.cache.get(g.data.channelId);
                    if (!channel || !channel.isTextBased())
                        continue;
                    const msg = await channel.messages.fetch(g.data.messageId).catch(() => null);
                    if (!msg)
                        continue;
                    const embedColor = lc.embedColor ?? this.defaults.embedColor;
                    const embed = discord_js_1.EmbedBuilder.from(msg.embeds[0]).setColor(embedColor);
                    await msg.edit({ content: lc.content, embeds: [embed] });
                    g.data.lastChanceTriggered = true;
                    this.save();
                }
                // End giveaway if time has passed
                if (g.data.endAt <= now) {
                    await this.end(g.data.messageId);
                }
            }
            catch (err) {
                console.error('Check giveaway failed:', err);
            }
        }
    }
}
exports.GiveawaysManager = GiveawaysManager;
function deepMerge(base, override) {
    const result = { ...base };
    for (const key in override) {
        if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
            result[key] = deepMerge(result[key], override[key]);
        }
        else if (override[key] !== undefined) {
            result[key] = override[key];
        }
    }
    return result;
}
//# sourceMappingURL=GiveawaysManager.js.map
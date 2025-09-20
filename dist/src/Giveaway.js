"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Giveaway = void 0;
/**
 * Represents a single giveaway.
 */
class Giveaway {
    constructor(data, manager) {
        var _a, _b, _c, _d;
        this.data = data;
        this.manager = manager;
        // Initialize optional fields if not set
        (_a = this.data).participants || (_a.participants = []);
        (_b = this.data).winnerIds || (_b.winnerIds = []);
        (_c = this.data).type || (_c.type = 'reaction');
        (_d = this.data).emoji || (_d.emoji = '🎉');
    }
    /**
     * Add a participant to the giveaway
     * @param user Discord User
     */
    addParticipant(user) {
        // Bots cannot win if disabled
        if (user.bot && !this.manager.defaults.botsCanWin) {
            this.manager.emit('giveawayInvalidEntry', user.id, this);
            return;
        }
        // Check if user is already a participant
        let participant = this.data.participants.find(p => p.id === user.id);
        if (!participant) {
            participant = {
                id: user.id,
                username: user.username,
                globalName: user.globalName,
                avatar: user.displayAvatarURL(),
            };
            this.data.participants.push(participant);
            // Emit join event
            this.manager.emit('giveawayJoin', participant, this);
        }
        // Update entries in user stats
        this.manager.storage.updateUserStats(this.data.guildId, user.id, { entries: 1 });
    }
    /**
     * Remove a participant from the giveaway
     * @param userId Discord user ID
     */
    removeParticipant(userId) {
        const participant = this.data.participants.find(p => p.id === userId);
        if (!participant)
            return;
        // Remove participant from the array
        this.data.participants = this.data.participants.filter(p => p.id !== userId);
        // Decrease entries in user stats
        this.manager.storage.updateUserStats(this.data.guildId, userId, { entries: -1 });
        // Emit leave event
        this.manager.emit('giveawayLeave', participant, this);
    }
    /**
     * Set the winners of the giveaway
     * @param winners Array of participants
     */
    setWinners(winners) {
        this.data.winnerIds = winners.map(w => w.id);
        // Update wins in user stats for each winner
        for (const w of winners) {
            this.manager.storage.updateUserStats(this.data.guildId, w.id, { wins: 1 });
        }
    }
    /** Get all participants */
    getParticipants() {
        return this.data.participants;
    }
    /** Get IDs of winners */
    getWinners() {
        return this.data.winnerIds;
    }
    /** Get type of giveaway: reaction or button */
    getType() {
        return this.data.type;
    }
    /** Get the emoji used in this giveaway */
    getEmoji() {
        return this.data.emoji;
    }
}
exports.Giveaway = Giveaway;
//# sourceMappingURL=Giveaway.js.map
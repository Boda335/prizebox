import { User } from 'discord.js';
import { GiveawaysManager } from './GiveawaysManager';
import { GiveawayData, Participant } from './types';

/**
 * Represents a single giveaway.
 */
export class Giveaway {
  public data: GiveawayData; // Giveaway data
  private manager: GiveawaysManager; // Reference to the manager

  constructor(data: GiveawayData, manager: GiveawaysManager) {
    this.data = data;
    this.manager = manager;

    // Initialize optional fields if not set
    this.data.participants ||= [];
    this.data.winnerIds ||= [];
    this.data.type ||= 'reaction';
    this.data.emoji ||= '🎉';
  }

  /**
   * Add a participant to the giveaway
   * @param user Discord User
   */
  addParticipant(user: User) {
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
  removeParticipant(userId: string) {
    const participant = this.data.participants.find(p => p.id === userId);
    if (!participant) return;

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
  setWinners(winners: Participant[]) {
    this.data.winnerIds = winners.map(w => w.id);

    // Update wins in user stats for each winner
    for (const w of winners) {
      this.manager.storage.updateUserStats(this.data.guildId, w.id, { wins: 1 });
    }
  }

  /** Get all participants */
  getParticipants(): Participant[] {
    return this.data.participants;
  }

  /** Get IDs of winners */
  getWinners(): string[] {
    return this.data.winnerIds;
  }

  /** Get type of giveaway: reaction or button */
  getType(): 'reaction' | 'button' {
    return this.data.type!;
  }

  /** Get the emoji used in this giveaway */
  getEmoji(): string {
    return this.data.emoji!;
  }
}

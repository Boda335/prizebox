import { User, TextChannel, EmbedBuilder } from 'discord.js';
import { GiveawaysManager } from './GiveawaysManager';
import { GiveawayData, Participant } from './types';

/**
 * Represents a single giveaway instance.
 */
export class Giveaway {
  public data: GiveawayData; // Core giveaway data
  private manager: GiveawaysManager; // Reference to the giveaways manager

  constructor(data: GiveawayData, manager: GiveawaysManager) {
    this.data = data;
    this.manager = manager;

    // Initialize optional fields with default values if not provided
    this.data.participants ||= [];
    this.data.winnerIds ||= [];
    this.data.type ||= 'reaction';
    this.data.emoji ||= '🎉';
  }

  /**
   * Add a participant to the giveaway.
   * Validates requirements before adding the user.
   * @param user Discord User
   */
  async addParticipant(user: User): Promise<boolean> {
    const participant: Participant = {
      id: user.id,
      username: user.username,
      globalName: user.globalName,
      avatar: user.displayAvatarURL(),
    };
    if (this.data.ended || Date.now() >= this.data.endAt) {
      this.manager.emit('entryAfterEnd', participant, this);
      await this.removeReactionOrUpdateEmbed(user);
      return false;
    }
    // Prevent bots from joining if they are not allowed
    if (user.bot && !this.manager.defaults.botsCanWin) {
      this.manager.emit('entryFailed', participant, this, 'botsNotAllowed');
      await this.removeReactionOrUpdateEmbed(user);
      return false;
    }

    // Check if the user has the required role
    if (this.data.requirements?.roleId) {
      const member = this.manager.client.guilds.cache.get(this.data.guildId)?.members.cache.get(user.id);

      if (!member?.roles.cache.has(this.data.requirements.roleId)) {
        this.manager.emit('entryFailed', participant, this, {
          code: 'missingRequiredRole',
          roleId: this.data.requirements.roleId,
        });
        await this.removeReactionOrUpdateEmbed(user);
        return false;
      }
    }

    // Check if the user must be in a specific guild
    if (this.data.requirements?.mustBeInGuild) {
      try {
        const inviteLink = this.data.requirements.mustBeInGuild;
        const invite = await this.manager.client.fetchInvite(inviteLink);
        const requiredGuildId = invite.guild?.id;

        if (!requiredGuildId) {
          console.warn(`Invalid invite link: ${inviteLink}`);
        } else {
          const guild = this.manager.client.guilds.cache.get(requiredGuildId);
          if (!guild?.members.cache.has(user.id)) {
            this.manager.emit('entryFailed', participant, this, {
              code: 'notInRequiredGuild',
              guildName: invite.guild?.name,
              inviteURL: invite.url,
              guildIcon: invite.guild?.iconURL({ size: 1024 }) || undefined,
            });
            await this.removeReactionOrUpdateEmbed(user);
            return false;
          }
        }
      } catch (err) {
        console.error(`Failed to fetch invite for mustBeInGuild:`, err);
        this.manager.emit('entryFailed', participant, this, {
          code: 'invalidInvite',
          inviteURL: this.data.requirements.mustBeInGuild,
        });
        return false;
      }
    }

    // Prevent duplicate participants
    let existing = this.data.participants.find(p => p.id === user.id);
    if (!existing) {
      existing = participant;
      this.data.participants.push(existing);

      // Apply bonus entries if configured
      if (Array.isArray(this.data.bonusEntries)) {
        // Bonus by user ID
        const userBonus = this.data.bonusEntries.find(b => b.userId === user.id);
        if (userBonus) {
          this.manager.storage.updateUserStats(this.data.guildId, user.id, { entries: userBonus.bonus });
        }

        // Bonus by role
        const roleBonuses = this.data.bonusEntries.filter(b => b.roleId);
        for (const bonus of roleBonuses) {
          const member = this.manager.client.guilds.cache.get(this.data.guildId)?.members.cache.get(user.id);
          if (member?.roles.cache.has(bonus.roleId!)) {
            this.manager.storage.updateUserStats(this.data.guildId, user.id, { entries: bonus.bonus });
          }
        }
      }

      // Emit event when participant successfully joins
      this.manager.emit('participantJoined', existing, this);
    }

    // Update normal entry in user stats
    this.manager.storage.updateUserStats(this.data.guildId, user.id, { entries: 1 });

    return true; // Participant added successfully
  }

  /**
   * Remove reaction or update the giveaway embed if entry is invalid.
   * @param user Discord User
   */
  private async removeReactionOrUpdateEmbed(user: User) {
    const channel = this.manager.client.channels.cache.get(this.data.channelId) as TextChannel;
    if (!channel) return;

    const msg = await channel.messages.fetch(this.data.messageId).catch(() => null);
    if (!msg) return;

    if (this.data.type === 'reaction') {
      await msg.reactions.cache
        .get(this.data.emoji!)
        ?.users.remove(user.id)
        .catch(() => null);
    }
  }

  /**
   * Remove a participant from the giveaway.
   * @param userId Discord user ID
   */
  removeParticipant(userId: string) {
    const participant = this.data.participants.find(p => p.id === userId);
    if (!participant) return;

    // Remove participant from the array
    this.data.participants = this.data.participants.filter(p => p.id !== userId);

    // Update user stats to decrease entry count
    this.manager.storage.updateUserStats(this.data.guildId, userId, { entries: -1 });

    // Emit leave event
    this.manager.emit('participantLeft', participant, this);
  }

  /**
   * Set the winners of the giveaway.
   * @param winners Array of participants
   */
  setWinners(winners: Participant[]) {
    this.data.winnerIds = winners.map(w => w.id);

    // Update user stats for each winner
    for (const w of winners) {
      this.manager.storage.updateUserStats(this.data.guildId, w.id, { wins: 1 });
    }
  }

  /** Returns all participants */
  getParticipants(): Participant[] {
    return this.data.participants;
  }

  /** Returns winner IDs */
  getWinners(): string[] {
    return this.data.winnerIds;
  }

  /** Returns the type of giveaway: reaction or button */
  getType(): 'reaction' | 'button' {
    return this.data.type!;
  }

  /** Returns the emoji used in this giveaway */
  getEmoji(): string {
    return this.data.emoji!;
  }
}

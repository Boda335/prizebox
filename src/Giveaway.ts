import { User, TextChannel } from 'discord.js';
import { GiveawaysManager } from './GiveawaysManager';
import { GiveawayData, Participant } from './types';

export class Giveaway {
  public data: GiveawayData;
  private manager: GiveawaysManager;

  constructor(data: GiveawayData, manager: GiveawaysManager) {
    this.data = data;
    this.manager = manager;

    this.data.participants ||= [];
    this.data.winnerIds ||= [];
    this.data.type ||= 'reaction';
    this.data.emoji ||= '🎉';
  }

  /** Add participant */
  async addParticipant(user: User): Promise<boolean> {
    const participant: Participant = {
      id: user.id,
      username: user.username,
      globalName: user.globalName,
      avatar: user.displayAvatarURL(),
    };
    if (this.data.paused) {
      this.manager.emit('giveawayPaused', this);
      await this.removeReactionOrUpdateEmbed(user);
      return false;
    }
    // Giveaway ended
    if (this.data.ended || Date.now() >= this.data.endAt) {
      this.manager.emit('entryAfterEnd', participant, this);
      await this.removeReactionOrUpdateEmbed(user);
      return false;
    }

    // Bot check
    if (user.bot && !this.manager.defaults.botsCanWin) {
      this.manager.emit('entryFailed', participant, this, 'botsNotAllowed');
      await this.removeReactionOrUpdateEmbed(user);
      return false;
    }

    // Required Role check
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

    // Required Guild check (optional)
    if (this.data.requirements?.mustBeInGuild) {
      try {
        const invite = await this.manager.client.fetchInvite(this.data.requirements.mustBeInGuild);

        const requiredGuildId = invite.guild?.id;

        if (requiredGuildId) {
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
      } catch {
        this.manager.emit('entryFailed', participant, this, {
          code: 'invalidInvite',
          inviteURL: this.data.requirements.mustBeInGuild,
        });
        return false;
      }
    }

    // Add participant if not exists
    let existing = this.data.participants.find(p => p.id === user.id);

    if (!existing) {
      existing = participant;
      this.data.participants.push(existing);

      // Apply bonus entries
      if (Array.isArray(this.data.bonusEntries)) {
        for (const bonus of this.data.bonusEntries) {
          if (bonus.userId === user.id) {
            this.manager.storage.updateUserStats(this.data.guildId, user.id, {
              entries: bonus.bonus,
            });
          }

          if (bonus.roleId) {
            const member = this.manager.client.guilds.cache.get(this.data.guildId)?.members.cache.get(user.id);

            if (member?.roles.cache.has(bonus.roleId)) {
              this.manager.storage.updateUserStats(this.data.guildId, user.id, {
                entries: bonus.bonus,
              });
            }
          }
        }
      }

      this.manager.emit('participantJoined', existing, this);
    }

    // Normal entry
    this.manager.storage.updateUserStats(this.data.guildId, user.id, {
      entries: 1,
    });

    // Save updated giveaway to storage
    this.manager.save();

    return true;
  }

  /** Remove invalid reaction */
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

  /** Remove participant */
  removeParticipant(userId: string) {
    const participant = this.data.participants.find(p => p.id === userId);
    if (!participant) return;

    this.data.participants = this.data.participants.filter(p => p.id !== userId);

    this.manager.storage.updateUserStats(this.data.guildId, userId, {
      entries: -1,
    });

    this.manager.emit('participantLeft', participant, this);
    this.manager.save();
  }

  /** Set winners */
  setWinners(winners: Participant[]) {
    this.data.winnerIds = winners.map(w => w.id);

    for (const w of winners) {
      this.manager.storage.updateUserStats(this.data.guildId, w.id, {
        wins: 1,
      });
    }

    this.manager.save();
  }

  getParticipants(): Participant[] {
    return this.data.participants;
  }

  getWinners(): string[] {
    return this.data.winnerIds;
  }

  getType(): 'reaction' | 'button' {
    return this.data.type!;
  }

  getEmoji(): string {
    return this.data.emoji!;
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = getLeaderboard;
exports.sendLeaderboard = sendLeaderboard;
const discord_js_1 = require("discord.js");
/**
 * Builds a leaderboard array from stored user stats.
 * @param manager The GiveawaysManager instance
 * @param type "entries" | "wins" (default = "entries")
 * @param top Number of users to return (default = 10)
 * @returns Array of leaderboard objects
 */
function getLeaderboard(manager, type = 'entries', top = 10) {
    const stats = {};
    // Get all user stats from storage
    const allStats = manager.storage.getAllUserStats();
    for (const guildId in allStats) {
        const guildStats = allStats[guildId];
        for (const userId in guildStats) {
            const s = guildStats[userId];
            // If user not yet added, initialize their stats
            if (!stats[userId]) {
                let username = 'Unknown';
                let avatar = '';
                // Try to fetch username & avatar from participants in giveaways
                const found = manager.giveaways
                    .flatMap(g => g.data.participants)
                    .find(p => p.id === userId);
                if (found) {
                    username = found.username;
                    avatar = found.avatar;
                }
                stats[userId] = {
                    username,
                    avatar,
                    entries: s.entries ?? 0,
                    wins: s.wins ?? 0,
                };
            }
            else {
                // If already exists, accumulate their entries & wins
                stats[userId].entries += s.entries ?? 0;
                stats[userId].wins += s.wins ?? 0;
            }
        }
    }
    // Sort users by chosen type (entries or wins), take top N
    const sorted = Object.entries(stats)
        .sort(([, a], [, b]) => b[type] - a[type])
        .slice(0, top);
    // Return leaderboard data
    return sorted.map(([id, s], i) => ({
        rank: i + 1,
        id,
        username: s.username,
        avatar: s.avatar,
        entries: s.entries,
        wins: s.wins,
    }));
}
/**
 * Sends the leaderboard to a given channel.
 * @param manager The GiveawaysManager instance
 * @param channel The channel to send the leaderboard in
 * @param type "entries" | "wins" (default = "entries")
 * @param top Number of users to display (default = 10)
 */
async function sendLeaderboard(manager, channel, type = 'entries', top = 10) {
    const lb = getLeaderboard(manager, type, top);
    if (!lb.length) {
        await channel.send('📊 No data for leaderboard yet.');
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(type === 'entries' ? '🎟️ Top Participants' : '🏆 Top Winners')
        .setColor('#00AAFF')
        .setDescription(lb
        .map(u => `**#${u.rank}** <@${u.id}> — ${type === 'entries' ? `${u.entries} entries` : `${u.wins} wins`}`)
        .join('\n'))
        .setFooter({ text: `Top ${top} ${type}` });
    await channel.send({ embeds: [embed] });
}
//# sourceMappingURL=leaderboard.js.map
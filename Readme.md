# PrizeBox

<div align="center">
  <img src="https://c.top4top.io/p_35503xu611.png" alt="PrizeBox Logo" width="500"/>
  
  ### 🎉 Complete Discord Giveaway Management System 🎉
  
  *The ultimate solution for managing Discord giveaways with advanced features*
  
  [![Discord](https://img.shields.io/discord/1006273962986188881?logo=discord&logoColor=%23fff&label=Discord&labelColor=%23505050&color=%235E6AE9)](https://discord.gg/AT6W2nHEVz)
  [![NPM License](https://img.shields.io/npm/l/prizebox)](LICENSE)
  [![NPM Version](https://img.shields.io/npm/v/prizebox)](https://www.npmjs.com/package/prizebox)
  [![Downloads](https://img.shields.io/npm/dm/prizebox)](https://www.npmjs.com/package/prizebox)
  
</div>

---

## 📋 Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Giveaway Management](#giveaway-management)
- [Event System](#event-system)
- [Statistics & Leaderboards](#statistics--leaderboards)
- [Storage System](#storage-system)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Support](#support)
- [License](./LICENSE)

---

## 🎯 About

**PrizeBox** is a powerful and flexible Discord giveaway management system built on top of [discord.js](https://discord.js.org/). It provides everything you need to run professional giveaways in your Discord server with advanced features like user statistics tracking, flexible entry methods, and comprehensive management tools.

### Why Choose PrizeBox?

- **🎪 Dual Entry Methods**: Support for both reactions and interactive buttons
- **📊 Advanced Statistics**: Track user participation and wins across all giveaways
- **🔧 Flexible Management**: Start, pause, resume, edit, extend, and reroll giveaways
- **💾 Persistent Storage**: Never lose giveaway data with JSON-based storage
- **🏆 Leaderboards**: Built-in leaderboard system for most active participants
- **⚡ Real-time Updates**: Live participant count updates and last-chance notifications
- **🛡️ Production Ready**: Comprehensive error handling and data validation

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🎮 **Giveaway Management**
- Create reaction or button-based giveaways
- Pause and resume functionality
- Edit prizes and winner counts on-the-fly
- Reroll winners after completion
- Last-chance notifications

</td>
<td width="50%">

### 📈 **Analytics & Tracking**
- User participation statistics
- Win/loss tracking per user
- Guild-based statistics storage
- Comprehensive leaderboards
- Entry count monitoring
- Historical data preservation

</td>
</tr>
</table>

### 🎛️ **Management Operations**

| Operation | Description | Method |
|-----------|-------------|--------|
| **Start** | Create new giveaway | `manager.start()` |
| **End** | Finish and pick winners | `manager.end()` |
| **Pause** | Temporarily stop giveaway | `manager.pause()` |
| **Resume** | Continue paused giveaway | `manager.resume()` |
| **Edit** | Modify giveaway details | `manager.edit()` |
| **Extend** | Add more time | `manager.extend()` |
| **Reroll** | Pick new winners | `manager.reroll()` |
| **Delete** | Remove giveaway completely | `manager.delete()` |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16.9.0 or higher
- Discord.js v14 or higher
- A Discord bot with proper permissions

### Basic Setup

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { GiveawaysManager } = require('prizebox');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize PrizeBox
const giveawayManager = new GiveawaysManager(client, {
  storage: './giveaways.json',
  defaults: {
    botsCanWin: false,
    embedColor: '#FF6B6B',
    embedColorEnd: '#2C2F33',
    type: 'reaction',
    emoji: '🎉'
  }
});

// Start a giveaway
client.on('messageCreate', async (message) => {
  if (message.content === '!start-giveaway') {
    const channel = message.channel;
    
    await giveawayManager.start(channel, {
      prize: 'Discord Nitro',
      duration: 60000, // 1 minute
      winnerCount: 1,
      hostId: message.author.id
    });
    
    message.reply('✅ Giveaway started!');
  }
});

client.login('YOUR_BOT_TOKEN');
```

---

## 📥 Installation

### NPM Installation

```bash
npm install prizebox
```

### Yarn Installation

```bash
yarn add prizebox
```

### Development Installation

```bash
git clone https://github.com/Boda335/prizebox.git
cd prizebox
npm install
npm run dev
```

---

## ⚙️ Configuration

### Manager Options

```javascript
const manager = new GiveawaysManager(client, {
  // Storage configuration
  storage: './data/giveaways.json',
  
  // Default settings for all giveaways
  defaults: {
    botsCanWin: false,
    embedColor: '#FF6B6B',
    embedColorEnd: '#2C2F33',
    checkInterval: 5000,
    type: 'button', // 'reaction' or 'button'
    emoji: '🎁'
  },
  
  // Custom messages
  messages: {
    giveaway: '🎉 **GIVEAWAY** 🎉',
    giveawayEnded: '🎉 **GIVEAWAY ENDED** 🎉',
    inviteToParticipate: 'React with 🎉 to enter!',
    winMessage: 'Congratulations {winners}! You won **{this.prize}**!',
    noWinner: 'No valid participants for **{this.prize}**.',
    hostedBy: 'Hosted by: {this.hostedBy}',
    embedFooter: '{this.winnerCount} winner(s)'
  },
  
  // Last chance notification
  lastChance: {
    enabled: true,
    content: '⚠️ **LAST CHANCE TO ENTER!** ⚠️',
    threshold: 10000, // 10 seconds before end
    embedColor: '#FFFF00'
  },
  
  // Pause options
  pauseOptions: {
    isPaused: false,
    content: '⏸️ **THIS GIVEAWAY IS PAUSED!** ⏸️',
    unpauseAfter: null,
    embedColor: '#FFFF00',
    infiniteDurationText: '`NEVER`'
  }
});
```

### Event Handling

```javascript
// Listen to giveaway events
manager.on('giveawayJoin', (participant, giveaway) => {
  console.log(`${participant.username} joined ${giveaway.data.prize}!`);
});

manager.on('giveawayLeave', (participant, giveaway) => {
  console.log(`${participant.username} left ${giveaway.data.prize}!`);
});

manager.on('giveawayInvalidEntry', (userId, giveaway) => {
  console.log(`Invalid entry attempt by ${userId} for ${giveaway.data.prize}`);
});
```

---

## 🎪 Giveaway Management

### Starting Giveaways

```javascript
// Basic giveaway
await manager.start(channel, {
  prize: 'Discord Nitro',
  duration: 24 * 60 * 60 * 1000, // 24 hours
  winnerCount: 2,
  hostId: interaction.user.id
});

// Advanced giveaway with custom settings
await manager.start(channel, {
  prize: 'Steam Gift Card',
  duration: 60 * 60 * 1000, // 1 hour
  winnerCount: 3,
  hostId: interaction.user.id,
  type: 'button',
  emoji: '🎁'
}, {
  // Override default settings for this giveaway
  defaults: {
    embedColor: '#00FF00',
    botsCanWin: true
  },
  messages: {
    inviteToParticipate: 'Click the button to join this exclusive giveaway!'
  }
});
```

### Managing Active Giveaways

```javascript
// End a giveaway early
const giveaway = await manager.end(messageId);
console.log(`Giveaway ended! Winners: ${giveaway.getWinners()}`);

// Pause a giveaway
await manager.pause(messageId);

// Resume a paused giveaway
await manager.resume(messageId);

// Edit giveaway details
await manager.edit(messageId, {
  prize: 'Updated Prize Name',
  winnerCount: 5,
  addTime: 30 * 60 * 1000 // Add 30 minutes
});


// Reroll winners
const newWinners = await manager.reroll(messageId, 2); // Pick 2 new winners

// Delete giveaway
await manager.delete(messageId);
```

### Listing Giveaways

```javascript
// Get all giveaways
const allGiveaways = manager.list();

// Get only active giveaways
const activeGiveaways = manager.list('active');

// Get paused giveaways
const pausedGiveaways = manager.list('paused');

// Get ended giveaways
const endedGiveaways = manager.list('ended');
```

---

## 📊 Statistics & Leaderboards

### User Statistics

```javascript
// Get leaderboard data
const topParticipants = manager.leaderboard('entries', 10);
const topWinners = manager.leaderboard('wins', 10);

// Send leaderboard to channel
await manager.sendLeaderboard(channel, 'entries', 15);
await manager.sendLeaderboard(channel, 'wins', 10);
```

### Leaderboard Output Example

```javascript
[
  {
    rank: 1,
    id: '123456789',
    username: 'john_doe',
    avatar: 'https://cdn.discordapp.com/avatars/...',
    entries: 25,
    wins: 3
  },
  {
    rank: 2,
    id: '987654321',
    username: 'jane_smith',
    avatar: 'https://cdn.discordapp.com/avatars/...',
    entries: 18,
    wins: 2
  }
]
```

---

## 💾 Storage System

### JSON Storage Structure

```json
{
  "giveaways": [
    {
      "messageId": "1234567890",
      "channelId": "0987654321",
      "guildId": "1122334455",
      "prize": "Discord Nitro",
      "startAt": 1640995200000,
      "endAt": 1641081600000,
      "ended": false,
      "paused": false,
      "winnerIds": [],
      "participants": [
        {
          "id": "user123",
          "username": "participant1",
          "globalName": "Participant One",
          "avatar": "https://cdn.discordapp.com/avatars/..."
        }
      ],
      "hostId": "host123",
      "winnerCount": 1,
      "type": "reaction",
      "emoji": "🎉"
    }
  ],
  "userStats": {
    "guildId123": {
      "userId123": {
        "entries": 10,
        "wins": 2
      }
    }
  }
}
```

### Custom Storage Implementation

```javascript
class CustomStorage {
  constructor(options) {
    // Your custom storage setup
  }
  
  all() {
    // Return all giveaways
  }
  
  saveAll(giveaways) {
    // Save giveaways array
  }
  
  updateUserStats(guildId, userId, changes) {
    // Update user statistics
  }
  
  getAllUserStats() {
    // Return all user statistics
  }
}

const manager = new GiveawaysManager(client, {
  storage: new CustomStorage({ /* options */ })
});
```

---

## 💡 Examples

### Complete Bot Example

```javascript
const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { GiveawaysManager } = require('prizebox');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ]
});

const manager = new GiveawaysManager(client, {
  storage: './giveaways.json',
  defaults: {
    botsCanWin: false,
    embedColor: '#FF6B6B',
    type: 'button'
  }
});

// Slash command handling
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'giveaway') {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'start': {
        const prize = interaction.options.getString('prize');
        const duration = interaction.options.getInteger('duration') * 60 * 1000;
        const winners = interaction.options.getInteger('winners');
        
        await manager.start(interaction.channel, {
          prize,
          duration,
          winnerCount: winners,
          hostId: interaction.user.id
        });
        
        await interaction.reply('✅ Giveaway started successfully!');
        break;
      }
      
      case 'end': {
        const messageId = interaction.options.getString('message-id');
        await manager.end(messageId);
        await interaction.reply('✅ Giveaway ended!');
        break;
      }
      
      case 'reroll': {
        const messageId = interaction.options.getString('message-id');
        await manager.reroll(messageId);
        await interaction.reply('✅ Winners rerolled!');
        break;
      }
      
      case 'leaderboard': {
        await manager.sendLeaderboard(interaction.channel);
        await interaction.reply('📊 Leaderboard posted!');
        break;
      }
    }
  }
});

client.login('YOUR_BOT_TOKEN');
```

### Advanced Giveaway with Requirements

```javascript
// Custom validation for giveaway entries
manager.on('giveawayJoin', (participant, giveaway) => {
  // Custom logic for entry validation
  const member = giveaway.manager.client.guilds.cache
    .get(giveaway.data.guildId)
    .members.cache.get(participant.id);
  
  // Check if member has required role
  const hasRequiredRole = member.roles.cache.has('REQUIRED_ROLE_ID');
  
  if (!hasRequiredRole) {
    // Remove participant if they don't meet requirements
    giveaway.removeParticipant(participant.id);
    manager.emit('giveawayInvalidEntry', participant.id, giveaway);
  }
});
```

---

## 📚 API Reference

### GiveawaysManager Class

#### Constructor
```typescript
new GiveawaysManager(client: Client, options: ManagerOptions)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `start()` | `channel, options, overrides?` | `Promise<Giveaway>` | Start new giveaway |
| `end()` | `messageId` | `Promise<Giveaway>` | End giveaway |
| `pause()` | `messageId` | `Promise<Giveaway>` | Pause giveaway |
| `resume()` | `messageId, newEndAt?` | `Promise<Giveaway>` | Resume giveaway |
| `edit()` | `messageId, options` | `Promise<Giveaway>` | Edit giveaway |
| `reroll()` | `messageId, winnerCount?` | `Promise<Participant[]>` | Reroll winners |
| `delete()` | `messageId` | `Promise<boolean>` | Delete giveaway |
| `list()` | `status?` | `Giveaway[]` | List giveaways |
| `leaderboard()` | `type?, top?` | `LeaderboardEntry[]` | Get leaderboard |
| `sendLeaderboard()` | `channel, type?, top?` | `Promise<void>` | Send leaderboard |

### Giveaway Class

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addParticipant()` | `user` | `void` | Add participant |
| `removeParticipant()` | `userId` | `void` | Remove participant |
| `getParticipants()` | | `Participant[]` | Get all participants |
| `getWinners()` | | `string[]` | Get winner IDs |
| `setWinners()` | `winners` | `void` | Set winners |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `giveawayJoin` | `participant, giveaway` | User joins giveaway |
| `giveawayLeave` | `participant, giveaway` | User leaves giveaway |
| `giveawayInvalidEntry` | `userId, giveaway` | Invalid entry attempt |
| `giveawayInvalidEntry` | `userId, giveaway` | Invalid entry aص  ttempt |

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper documentation
4. **Add tests** for new functionality
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Setup

```bash
git clone https://github.com/Boda335/prizebox.git
cd prizebox
npm install
npm run test
npm run dev
```

### Contribution Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Use conventional commit messages
- Ensure backward compatibility

---

## 💬 Support & Community

<table>
<tr>
<td align="center">
  
  ### 💬 Discord Server
  
  Join our community for support and discussion
  
  [![Discord](https://img.shields.io/discord/1006273962986188881?logo=discord&logoColor=%23fff&label=Join%20Discord&labelColor=%23505050&color=%235E6AE9&style=for-the-badge)](https://discord.gg/AT6W2nHEVz)
  
</td>
<td align="center">
  
  ### 📚 Documentation
  
  Comprehensive guides and examples
  
  [![Docs](https://img.shields.io/badge/Read%20Docs-blue?style=for-the-badge&logo=gitbook&logoColor=white)](https://docs.prizebox.dev)
  
</td>
</tr>
<tr>
<td align="center">
  
  ### 🐛 Bug Reports
  
  Found a bug? Report it here
  
  [![Issues](https://img.shields.io/badge/Report%20Bug-red?style=for-the-badge&logo=github&logoColor=white)](https://github.com/your-username/prizebox/issues)
  
</td>
<td align="center">
  
  ### 💡 Feature Requests
  
  Suggest new features
  
  [![Features](https://img.shields.io/badge/Request%20Feature-green?style=for-the-badge&logo=github&logoColor=white)](https://github.com/your-username/prizebox/discussions)
  
</td>
</tr>
</table>

### Getting Help

- **Discord Support**: Real-time help from maintainers and community
- **GitHub Issues**: Bug reports and technical questions
- **Documentation**: Step-by-step guides and API reference
- **Examples Repository**: Working code examples and templates

---


<div align="center">
  
  ### 🌟 Star us on GitHub!
  
  If PrizeBox helped you create amazing giveaways, please consider giving us a star ⭐
  
  **Made with ❤️ for the Discord community**
  
  [![GitHub](https://img.shields.io/badge/GitHub-PrizeBox-blue?style=for-the-badge&logo=github)](https://github.com/your-username/prizebox)
  [![NPM](https://img.shields.io/badge/NPM-PrizeBox-red?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/prizebox)
  
</div>
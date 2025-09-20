import { jest } from '@jest/globals';
import { GiveawaysManager } from '../src/GiveawaysManager';
import { Giveaway } from '../src/Giveaway';
import { createMockGuild, createMockMessage, createMockChannel, createMockClient } from './utils';

describe('GiveawaysManager', () => {
  let manager: GiveawaysManager;
  let mockGuild: any;
  let mockMessage: any;
  let mockChannel: any;
  let mockClient: any;

  beforeEach(() => {
    jest.useFakeTimers(); 
    mockGuild = createMockGuild();
    mockMessage = createMockMessage();
    mockChannel = createMockChannel(mockGuild, mockMessage);
    mockClient = createMockClient(mockChannel);

    manager = new GiveawaysManager(mockClient, {
      storage: './test.json',
      defaults: {
        botsCanWin: false,
        embedColor: '#FF6B6B',
        embedColorEnd: '#000000',
        checkInterval: 5000,
        type: 'reaction',
        emoji: '🎉',
      },
      isTest: true 
    });

    manager['collectors'].forEach((c: any) => c.stop?.());
    manager['collectors'].clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should create a new giveaway', async () => {
    const giveaway = await manager.start(mockChannel, {
      prize: 'Free Nitro',
      winnerCount: 1,
      duration: 60000,
      channelId: '123',
    });

    expect(giveaway).toBeInstanceOf(Giveaway);
    expect(giveaway.data.prize).toBe('Free Nitro');
    expect(giveaway.data.winnerCount).toBe(1);
  });
});

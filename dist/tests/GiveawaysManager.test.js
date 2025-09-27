"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const GiveawaysManager_1 = require("../src/GiveawaysManager");
const Giveaway_1 = require("../src/Giveaway");
const utils_1 = require("./utils");
describe('GiveawaysManager', () => {
    let manager;
    let mockGuild;
    let mockMessage;
    let mockChannel;
    let mockClient;
    beforeEach(() => {
        globals_1.jest.useFakeTimers();
        mockGuild = (0, utils_1.createMockGuild)();
        mockMessage = (0, utils_1.createMockMessage)();
        mockChannel = (0, utils_1.createMockChannel)(mockGuild, mockMessage);
        mockClient = (0, utils_1.createMockClient)(mockChannel);
        manager = new GiveawaysManager_1.GiveawaysManager(mockClient, {
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
        manager['collectors'].forEach((c) => c.stop?.());
        manager['collectors'].clear();
    });
    afterEach(() => {
        globals_1.jest.runOnlyPendingTimers();
        globals_1.jest.useRealTimers();
    });
    test('should create a new giveaway', async () => {
        const giveaway = await manager.start(mockChannel, {
            prize: 'Free Nitro',
            winnerCount: 1,
            duration: 60000,
            channelId: '123',
        });
        expect(giveaway).toBeInstanceOf(Giveaway_1.Giveaway);
        expect(giveaway.data.prize).toBe('Free Nitro');
        expect(giveaway.data.winnerCount).toBe(1);
    });
});
//# sourceMappingURL=GiveawaysManager.test.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockClient = exports.createMockChannel = exports.createMockMessage = exports.createMockGuild = exports.createMockCollector = exports.mockFn = void 0;
const globals_1 = require("@jest/globals");
const mockFn = (returnValue) => globals_1.jest.fn(() => Promise.resolve(returnValue));
exports.mockFn = mockFn;
const createMockCollector = () => {
    const handlers = {};
    return {
        on: globals_1.jest.fn((event, handler) => {
            if (!handlers[event])
                handlers[event] = [];
            handlers[event].push(handler);
        }),
        emit: (event, ...args) => {
            (handlers[event] || []).forEach(h => h(...args));
        },
        stop: globals_1.jest.fn(),
    };
};
exports.createMockCollector = createMockCollector;
const createMockGuild = () => ({
    id: 'guild_123',
    name: 'Test Guild',
    iconURL: globals_1.jest.fn().mockReturnValue('http://discord.test/icon.png'),
});
exports.createMockGuild = createMockGuild;
const createMockMessage = () => {
    const collector = (0, exports.createMockCollector)();
    return {
        id: 'msg_123',
        url: 'http://discord.test/message/123',
        embeds: [],
        edit: (0, exports.mockFn)(true),
        react: (0, exports.mockFn)(true),
        createReactionCollector: globals_1.jest.fn(() => collector),
    };
};
exports.createMockMessage = createMockMessage;
const createMockChannel = (guild, message) => ({
    id: '123',
    guild,
    send: (0, exports.mockFn)(message),
    messages: {
        fetch: (0, exports.mockFn)(message),
    },
});
exports.createMockChannel = createMockChannel;
const createMockClient = (channel) => ({
    channels: {
        cache: new Map([['123', channel]]),
    },
});
exports.createMockClient = createMockClient;
//# sourceMappingURL=utils.js.map
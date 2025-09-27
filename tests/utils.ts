import { jest } from '@jest/globals';

export const mockFn = <T = any>(returnValue?: T) =>
  jest.fn(() => Promise.resolve(returnValue as T));

export const createMockCollector = () => {
  const handlers: Record<string, Function[]> = {};

  return {
    on: jest.fn((event: string, handler: Function) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
    }),
    emit: (event: string, ...args: any[]) => {
      (handlers[event] || []).forEach(h => h(...args));
    },
    stop: jest.fn(),
  };
};

export const createMockGuild = () => ({
  id: 'guild_123',
  name: 'Test Guild',
  iconURL: jest.fn<() => string>().mockReturnValue('http://discord.test/icon.png'),
});
const mockUser = {
  id: 'user_1',
  username: 'TestUser',
  displayAvatarURL: jest.fn(() => 'http://discord.test/avatar.png'),
};

export const createMockMessage = () => {
  const collector = createMockCollector();

  return {
    id: 'msg_123',
    url: 'http://discord.test/message/123',
    embeds: [] as any[],
    edit: mockFn(true),
    react: mockFn(true),
    createReactionCollector: jest.fn(() => collector),
    reactions: {
      cache: new Map<string, any>([
        [
          '🎉',
          {
            users: {
              fetch: jest.fn(async () => new Map([['user_1', mockUser]])),
            },
          },
        ],
      ]),
    },
  };
};

export const createMockChannel = (guild: any, message: any) => ({
  id: '123',
  guild,
  send: mockFn(message),
  messages: {
    fetch: mockFn(message),
  },
});

export const createMockClient = (channel: any) => ({
  channels: {
    cache: new Map([['123', channel]]),
  },
});

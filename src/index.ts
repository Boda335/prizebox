/**
 * Re-export the GiveawaysManager class from its module.
 */
export { GiveawaysManager } from './GiveawaysManager';

/**
 * Re-export the Giveaway class from its module.
 */
export { Giveaway } from './Giveaway';

// Export GiveawayEvents from GiveawaysManager
export type { GiveawayEvents } from './GiveawaysManager';

// Core types
export type { ManagerOptions, Participant, GiveawayData, UserStats, GuildStats, StorageData } from './types';

// Core storage
export { JsonStorage } from './storage/JsonStorage';

export * as Events from './events/BaseEvents';
export * as Actions from './actions/BaseActions';

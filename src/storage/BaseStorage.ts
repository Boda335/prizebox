import { GiveawayData } from '../types';

/**
 * Abstract base class for giveaway storage implementations.
 * Any storage class (e.g., JsonStorage) must extend this and implement the methods.
 */
export abstract class BaseStorage {
  /**
   * Get all giveaways from storage
   */
  abstract all(): GiveawayData[];

  /**
   * Save all giveaways to storage
   * @param data Array of giveaways to save
   */
  abstract saveAll(data: GiveawayData[]): void;
}

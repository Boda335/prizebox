import { GiveawaysManager } from '../GiveawaysManager';
/**
 * Options for generating a transcript
 */
interface TranscriptOptions {
    outputDir?: string;
    includeStats?: boolean;
    theme?: 'dark' | 'light';
}
/**
 * Generate an HTML transcript for a giveaway
 */
export declare function generateTranscript(manager: GiveawaysManager, giveawayId: string, options?: TranscriptOptions): Promise<string>;
export {};
//# sourceMappingURL=transcript.d.ts.map
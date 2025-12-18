/**
 * IP range result structure
 */
export interface IPRanges {
  ipv4Ranges: string[];
  ipv6Ranges: string[];
}

/**
 * Spider configuration type
 */
export type SpiderType = 'search' | 'ai' | 'cdn' | 'other';

/**
 * Spider configuration interface
 */
export interface Spider {
  name: string;
  type: SpiderType;
  official: string;
  format: (text: string) => IPRanges;
}

/**
 * Crawl result for a single spider
 */
export interface CrawlResult {
  name: string;
  type: SpiderType;
  success: boolean;
  ipv4Ranges: string[];
  ipv6Ranges: string[];
  error?: string;
  timestamp: string;
}

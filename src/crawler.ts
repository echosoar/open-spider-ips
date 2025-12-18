import fetch from 'node-fetch';
import { Spider, CrawlResult, IPRanges } from './types';

/**
 * Fetch IP ranges from a spider's official URL
 */
async function fetchIPRanges(spider: Spider): Promise<CrawlResult> {
  const timestamp = new Date().toISOString();

  try {
    console.log(`Fetching ${spider.name} from ${spider.official}...`);

    const response = await fetch(spider.official, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; open-spider-ips/1.0; +https://github.com/echosoar/open-spider-ips)',
      },
    });

    const text = await response.text();
    const ranges = spider.format(text);

    console.log(
      `✓ ${spider.name}: Found ${ranges.ipv4Ranges.length} IPv4 and ${ranges.ipv6Ranges.length} IPv6 ranges`
    );

    return {
      name: spider.name,
      type: spider.type,
      success: true,
      ipv4Ranges: ranges.ipv4Ranges,
      ipv6Ranges: ranges.ipv6Ranges,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error';

    console.error(`✗ ${spider.name}: ${errorMessage}`);

    return {
      name: spider.name,
      type: spider.type,
      success: false,
      ipv4Ranges: [],
      ipv6Ranges: [],
      error: errorMessage,
      timestamp,
    };
  }
}

/**
 * Crawl all configured spiders
 */
export async function crawlAll(spiders: Spider[]): Promise<CrawlResult[]> {
  console.log(`\nStarting crawl for ${spiders.length} spiders...\n`);

  const results: CrawlResult[] = [];

  // Crawl sequentially to avoid overwhelming servers
  for (const spider of spiders) {
    const result = await fetchIPRanges(spider);
    results.push(result);

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Generate summary statistics
 */
export function generateSummary(results: CrawlResult[]): {
  total: number;
  successful: number;
  failed: number;
  totalIPv4: number;
  totalIPv6: number;
} {
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  const totalIPv4 = results.reduce(
    (sum, r) => sum + r.ipv4Ranges.length,
    0
  );
  const totalIPv6 = results.reduce(
    (sum, r) => sum + r.ipv6Ranges.length,
    0
  );

  return {
    total: results.length,
    successful,
    failed,
    totalIPv4,
    totalIPv6,
  };
}

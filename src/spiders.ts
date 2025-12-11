import { Spider, IPRanges } from './types';

/**
 * Regular expression patterns for extracting IP addresses
 * Note: These patterns are designed to capture commonly found IP formats in documentation.
 * They may match some invalid IPs but are suitable for extracting ranges from text.
 */
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g;
// More precise IPv6 pattern that requires at least 2 hex groups separated by colons
const IPV6_PATTERN = /\b(?:[0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}(?:\/\d{1,3})?\b/g;

/**
 * Helper function to extract IP ranges using regex patterns
 */
function extractIPRanges(text: string): IPRanges {
  const ipv4Ranges: string[] = [];
  const ipv6Ranges: string[] = [];

  const ipv4Matches = text.match(IPV4_PATTERN);
  const ipv6Matches = text.match(IPV6_PATTERN);

  if (ipv4Matches) ipv4Ranges.push(...ipv4Matches);
  if (ipv6Matches) ipv6Ranges.push(...ipv6Matches);

  return { ipv4Ranges, ipv6Ranges };
}

/**
 * Helper function to parse Google's JSON format with prefixes
 */
function parseGoogleJSON(text: string): IPRanges {
  const data = JSON.parse(text);
  const ipv4Ranges: string[] = [];
  const ipv6Ranges: string[] = [];

  if (data.prefixes) {
    data.prefixes.forEach((prefix: any) => {
      if (prefix.ipv4Prefix) {
        ipv4Ranges.push(prefix.ipv4Prefix);
      }
      if (prefix.ipv6Prefix) {
        ipv6Ranges.push(prefix.ipv6Prefix);
      }
    });
  }

  return { ipv4Ranges, ipv6Ranges };
}

/**
 * Spider configurations for various search engines and AI crawlers
 */
export const spiders: Spider[] = [
  // Google crawler
  {
    name: 'google',
    type: 'search',
    official: 'https://www.gstatic.com/ipranges/goog.json',
    format: parseGoogleJSON,
  },

  // Googlebot specific ranges
  {
    name: 'googlebot',
    type: 'search',
    official: 'https://www.gstatic.com/ipranges/cloud.json',
    format: parseGoogleJSON,
  },

  // Yandex crawler
  {
    name: 'yandex',
    type: 'search',
    official: 'https://yandex.com/ips',
    format: (text: string): IPRanges => {
      const ipv4Ranges: string[] = [];
      const ipv6Ranges: string[] = [];

      // Yandex returns plain text with IP ranges
      const lines = text.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        // Check if it's IPv6 (contains ':')
        if (trimmed.includes(':')) {
          ipv6Ranges.push(trimmed);
        } else if (trimmed.includes('.')) {
          // IPv4
          ipv4Ranges.push(trimmed);
        }
      });

      return { ipv4Ranges, ipv6Ranges };
    },
  },

  // Bing crawler
  {
    name: 'bing',
    type: 'search',
    official: 'https://www.bing.com/toolbox/bingbot.json',
    format: (text: string): IPRanges => {
      const ipv4Ranges: string[] = [];
      const ipv6Ranges: string[] = [];

      try {
        const data = JSON.parse(text);
        if (data.prefixes) {
          data.prefixes.forEach((prefix: string) => {
            if (prefix.includes(':')) {
              ipv6Ranges.push(prefix);
            } else {
              ipv4Ranges.push(prefix);
            }
          });
        }
      } catch (e) {
        // If JSON parsing fails, try plain text format
        const lines = text.split('\n');
        lines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          if (trimmed.includes(':')) {
            ipv6Ranges.push(trimmed);
          } else if (trimmed.includes('.')) {
            ipv4Ranges.push(trimmed);
          }
        });
      }

      return { ipv4Ranges, ipv6Ranges };
    },
  },

  // Facebook/Meta crawler
  // Note: Facebook provides IP ranges through their documentation page.
  // The actual format may vary - this uses pattern matching to extract IPs.
  {
    name: 'facebook',
    type: 'search',
    official: 'https://developers.facebook.com/docs/sharing/webmasters/crawler',
    format: (text: string): IPRanges => {
      return extractIPRanges(text);
    },
  },

  // OpenAI crawler (GPTBot)
  {
    name: 'openai',
    type: 'ai',
    official: 'https://openai.com/gptbot.json',
    format: (text: string): IPRanges => {
      const ipv4Ranges: string[] = [];
      const ipv6Ranges: string[] = [];

      try {
        const data = JSON.parse(text);
        if (data.prefixes) {
          data.prefixes.forEach((prefix: string) => {
            if (prefix.includes(':')) {
              ipv6Ranges.push(prefix);
            } else {
              ipv4Ranges.push(prefix);
            }
          });
        }
        return { ipv4Ranges, ipv6Ranges };
      } catch (e) {
        // Try pattern matching if JSON parsing fails
        return extractIPRanges(text);
      }
    },
  },

  // Anthropic (Claude) crawler
  {
    name: 'claude',
    type: 'ai',
    official: 'https://docs.anthropic.com/claude/reference/claude-web-crawler',
    format: (text: string): IPRanges => {
      return extractIPRanges(text);
    },
  },

  // Baidu crawler
  // Note: This URL is a placeholder. Baidu doesn't officially publish IP ranges.
  // Users should update this with the correct endpoint if/when available.
  {
    name: 'baidu',
    type: 'search',
    official: 'https://www.baidu.com/robots.txt',
    format: (text: string): IPRanges => {
      return extractIPRanges(text);
    },
  },

  // DuckDuckGo crawler
  {
    name: 'duckduckgo',
    type: 'search',
    official: 'https://help.duckduckgo.com/duckduckgo-help-pages/results/duckduckbot/',
    format: (text: string): IPRanges => {
      return extractIPRanges(text);
    },
  },
];

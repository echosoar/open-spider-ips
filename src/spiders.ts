import { Spider, IPRanges } from './types';

/**
 * Regular expression patterns for extracting IP addresses
 * Note: These patterns are designed to capture commonly found IP formats in documentation.
 * They may match some invalid IPs but are suitable for extracting ranges from text.
 * 
 * Limitations:
 * - IPv4: Does not validate octet ranges (0-255)
 * - IPv6: Simplified pattern that captures most common formats
 * - For production use with strict validation, consider using a dedicated IP validation library
 */
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g;
// IPv6 pattern that matches both compressed (::) and full notation
const IPV6_PATTERN = /(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?/g;

/**
 * Validate if a string is a valid IPv4 address or CIDR range
 */
function isValidIPv4(ip: string): boolean {
  // Match IPv4 with optional CIDR notation
  const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d{1,2}))?$/);
  if (!match) return false;

  // Check each octet is 0-255
  for (let i = 1; i <= 4; i++) {
    const octet = parseInt(match[i], 10);
    if (octet < 0 || octet > 255) return false;
  }

  // Check CIDR prefix length if present
  if (match[6]) {
    const prefix = parseInt(match[6], 10);
    if (prefix < 0 || prefix > 32) return false;
  }

  return true;
}

/**
 * Validate if a string is a valid IPv6 address or CIDR range
 */
function isValidIPv6(ip: string): boolean {
  // Extract CIDR prefix if present
  const parts = ip.split('/');
  const addr = parts[0];
  const prefix = parts[1];

  // Validate CIDR prefix if present
  if (prefix) {
    const prefixNum = parseInt(prefix, 10);
    if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 128) return false;
  }

  // Check if address contains colons (basic IPv6 check)
  if (!addr.includes(':')) return false;

  // Check for too many :: occurrences
  const doubleColonCount = (addr.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;

  // Check for IPv6 format
  // This is a simplified check - full IPv6 validation is complex
  if (addr.includes('::')) {
    // Compressed format
    const segments = addr.split('::');
    
    for (const segment of segments) {
      if (segment === '') continue; // Empty segments are valid in ::
      const parts = segment.split(':').filter(p => p !== '');
      for (const part of parts) {
        if (!isValidIPv6Segment(part)) return false;
      }
    }
  } else {
    // Standard format - should have 8 groups (or less with ::)
    const segments = addr.split(':');
    if (segments.length < 3 || segments.length > 8) return false;
    
    for (const segment of segments) {
      // Empty segments are not valid in non-compressed format
      if (segment === '') return false;
      if (!isValidIPv6Segment(segment)) return false;
    }
  }

  return true;
}

/**
 * Helper to validate IPv6 segment (1-4 hex digits)
 */
function isValidIPv6Segment(segment: string): boolean {
  // Allow empty segments as they're filtered out before this check in compressed notation
  if (segment.length === 0) return true;
  if (segment.length > 4) return false;
  if (!/^[0-9a-fA-F]+$/.test(segment)) return false;
  return true;
}

/**
 * Validate and filter IP ranges
 */
function validateIPRanges(ranges: IPRanges): IPRanges {
  const validIPv4Ranges = ranges.ipv4Ranges.filter(ip => isValidIPv4(ip));
  const validIPv6Ranges = ranges.ipv6Ranges.filter(ip => isValidIPv6(ip));

  return {
    ipv4Ranges: validIPv4Ranges,
    ipv6Ranges: validIPv6Ranges,
  };
}

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

  return validateIPRanges({ ipv4Ranges, ipv6Ranges });
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

  return validateIPRanges({ ipv4Ranges, ipv6Ranges });
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
      // Yandex returns an HTML page, extract IPs from it
      return extractIPRanges(text);
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
        if (data.prefixes && Array.isArray(data.prefixes)) {
          data.prefixes.forEach((prefix: any) => {
            // Handle object format with ipv4Prefix and ipv6Prefix properties
            if (typeof prefix === 'object' && prefix !== null) {
              if (prefix.ipv4Prefix) {
                ipv4Ranges.push(prefix.ipv4Prefix);
              }
              if (prefix.ipv6Prefix) {
                ipv6Ranges.push(prefix.ipv6Prefix);
              }
            } else if (typeof prefix === 'string') {
              // Fallback for string format
              if (prefix.includes(':')) {
                ipv6Ranges.push(prefix);
              } else {
                ipv4Ranges.push(prefix);
              }
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

      return validateIPRanges({ ipv4Ranges, ipv6Ranges });
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
        return validateIPRanges({ ipv4Ranges, ipv6Ranges });
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

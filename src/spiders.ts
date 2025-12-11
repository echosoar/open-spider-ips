import { Spider, IPRanges } from './types';

/**
 * Spider configurations for various search engines and AI crawlers
 */
export const spiders: Spider[] = [
  // Google crawler
  {
    name: 'google',
    type: 'search',
    official: 'https://www.gstatic.com/ipranges/goog.json',
    format: (text: string): IPRanges => {
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
    },
  },

  // Googlebot specific ranges
  {
    name: 'googlebot',
    type: 'search',
    official: 'https://www.gstatic.com/ipranges/cloud.json',
    format: (text: string): IPRanges => {
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
    },
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
  {
    name: 'facebook',
    type: 'search',
    official: 'https://developers.facebook.com/docs/sharing/webmasters/crawler',
    format: (text: string): IPRanges => {
      const ipv4Ranges: string[] = [];
      const ipv6Ranges: string[] = [];

      // Facebook's page lists IP ranges in text
      // Common Facebook crawler IPs (these need to be verified from their actual page)
      const ipv4Pattern = /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g;
      const ipv6Pattern = /\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?\b/g;

      const ipv4Matches = text.match(ipv4Pattern);
      const ipv6Matches = text.match(ipv6Pattern);

      if (ipv4Matches) {
        ipv4Ranges.push(...ipv4Matches);
      }
      if (ipv6Matches) {
        ipv6Ranges.push(...ipv6Matches);
      }

      return { ipv4Ranges, ipv6Ranges };
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
      } catch (e) {
        // Try pattern matching if JSON parsing fails
        const ipv4Pattern = /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g;
        const ipv6Pattern = /\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?\b/g;

        const ipv4Matches = text.match(ipv4Pattern);
        const ipv6Matches = text.match(ipv6Pattern);

        if (ipv4Matches) ipv4Ranges.push(...ipv4Matches);
        if (ipv6Matches) ipv6Ranges.push(...ipv6Matches);
      }

      return { ipv4Ranges, ipv6Ranges };
    },
  },

  // Anthropic (Claude) crawler
  {
    name: 'claude',
    type: 'ai',
    official: 'https://docs.anthropic.com/claude/reference/claude-web-crawler',
    format: (text: string): IPRanges => {
      const ipv4Ranges: string[] = [];
      const ipv6Ranges: string[] = [];

      // Extract IP ranges from documentation or JSON
      const ipv4Pattern = /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g;
      const ipv6Pattern = /\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?\b/g;

      const ipv4Matches = text.match(ipv4Pattern);
      const ipv6Matches = text.match(ipv6Pattern);

      if (ipv4Matches) ipv4Ranges.push(...ipv4Matches);
      if (ipv6Matches) ipv6Ranges.push(...ipv6Matches);

      return { ipv4Ranges, ipv6Ranges };
    },
  },

  // Baidu crawler
  {
    name: 'baidu',
    type: 'search',
    official: 'https://www.baidu.com/robots.txt',
    format: (text: string): IPRanges => {
      const ipv4Ranges: string[] = [];
      const ipv6Ranges: string[] = [];

      // Extract IP ranges from any format
      const ipv4Pattern = /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g;
      const ipv6Pattern = /\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?\b/g;

      const ipv4Matches = text.match(ipv4Pattern);
      const ipv6Matches = text.match(ipv6Pattern);

      if (ipv4Matches) ipv4Ranges.push(...ipv4Matches);
      if (ipv6Matches) ipv6Ranges.push(...ipv6Matches);

      return { ipv4Ranges, ipv6Ranges };
    },
  },

  // DuckDuckGo crawler
  {
    name: 'duckduckgo',
    type: 'search',
    official: 'https://help.duckduckgo.com/duckduckgo-help-pages/results/duckduckbot/',
    format: (text: string): IPRanges => {
      const ipv4Ranges: string[] = [];
      const ipv6Ranges: string[] = [];

      const ipv4Pattern = /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g;
      const ipv6Pattern = /\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?\b/g;

      const ipv4Matches = text.match(ipv4Pattern);
      const ipv6Matches = text.match(ipv6Pattern);

      if (ipv4Matches) ipv4Ranges.push(...ipv4Matches);
      if (ipv6Matches) ipv6Ranges.push(...ipv6Matches);

      return { ipv4Ranges, ipv6Ranges };
    },
  },
];

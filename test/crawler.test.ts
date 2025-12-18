import fetch from 'node-fetch';
import { crawlAll } from '../src/crawler';
import { Spider } from '../src/types';

// Mock node-fetch
jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods to avoid cluttering test output
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('crawlAll', () => {
  it('should return empty array when given empty spiders array', async () => {
    const result = await crawlAll([]);
    expect(result).toEqual([]);
  });

  it('should successfully crawl a single spider with IPv4 ranges', async () => {
    const mockSpider: Spider = {
      name: 'test-spider',
      type: 'search',
      official: 'https://example.com/ips.json',
      format: (text: string) => {
        const data = JSON.parse(text);
        return {
          ipv4Ranges: data.ipv4 || [],
          ipv6Ranges: data.ipv6 || [],
        };
      },
    };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ ipv4: ['1.2.3.0/24', '5.6.7.0/24'], ipv6: [] }),
    } as any);

    const results = await crawlAll([mockSpider]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'test-spider',
      type: 'search',
      success: true,
      ipv4Ranges: ['1.2.3.0/24', '5.6.7.0/24'],
      ipv6Ranges: [],
    });
    expect(results[0].timestamp).toBeDefined();
  });

  it('should successfully crawl a single spider with IPv6 ranges', async () => {
    const mockSpider: Spider = {
      name: 'test-spider-v6',
      type: 'ai',
      official: 'https://example.com/ipv6.json',
      format: (text: string) => {
        const data = JSON.parse(text);
        return {
          ipv4Ranges: [],
          ipv6Ranges: data.ipv6 || [],
        };
      },
    };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ ipv6: ['2001:db8::/32', '2001:db9::/32'] }),
    } as any);

    const results = await crawlAll([mockSpider]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'test-spider-v6',
      type: 'ai',
      success: true,
      ipv4Ranges: [],
      ipv6Ranges: ['2001:db8::/32', '2001:db9::/32'],
    });
  });

  it('should handle spider with both IPv4 and IPv6 ranges', async () => {
    const mockSpider: Spider = {
      name: 'dual-stack',
      type: 'search',
      official: 'https://example.com/dual.json',
      format: (text: string) => {
        const data = JSON.parse(text);
        return {
          ipv4Ranges: data.ipv4 || [],
          ipv6Ranges: data.ipv6 || [],
        };
      },
    };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        ipv4: ['192.168.1.0/24'],
        ipv6: ['2001:db8::/32'],
      }),
    } as any);

    const results = await crawlAll([mockSpider]);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].ipv4Ranges).toEqual(['192.168.1.0/24']);
    expect(results[0].ipv6Ranges).toEqual(['2001:db8::/32']);
  });

  it('should handle failed request and return error result', async () => {
    const mockSpider: Spider = {
      name: 'failing-spider',
      type: 'search',
      official: 'https://example.com/fail.json',
      format: (text: string) => ({ ipv4Ranges: [], ipv6Ranges: [] }),
    };

    mockedFetch.mockRejectedValueOnce(new Error('Network error'));

    const results = await crawlAll([mockSpider]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'failing-spider',
      type: 'search',
      success: false,
      ipv4Ranges: [],
      ipv6Ranges: [],
      error: 'Network error',
    });
  });

  it('should handle multiple spiders with mixed success/failure', async () => {
    const spiders: Spider[] = [
      {
        name: 'success-spider',
        type: 'search',
        official: 'https://example.com/success.json',
        format: (text: string) => {
          const data = JSON.parse(text);
          return { ipv4Ranges: data.ipv4 || [], ipv6Ranges: [] };
        },
      },
      {
        name: 'fail-spider',
        type: 'ai',
        official: 'https://example.com/fail.json',
        format: () => ({ ipv4Ranges: [], ipv6Ranges: [] }),
      },
    ];

    mockedFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ ipv4: ['10.0.0.0/8'] }),
      } as any)
      .mockRejectedValueOnce(new Error('Connection timeout'));

    const results = await crawlAll(spiders);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[0].name).toBe('success-spider');
    expect(results[0].ipv4Ranges).toEqual(['10.0.0.0/8']);

    expect(results[1].success).toBe(false);
    expect(results[1].name).toBe('fail-spider');
    expect(results[1].error).toBe('Connection timeout');
  });

  it('should crawl spiders sequentially', async () => {
    const callOrder: string[] = [];
    const spiders: Spider[] = [
      {
        name: 'spider-1',
        type: 'search',
        official: 'https://example.com/1.json',
        format: () => ({ ipv4Ranges: [], ipv6Ranges: [] }),
      },
      {
        name: 'spider-2',
        type: 'search',
        official: 'https://example.com/2.json',
        format: () => ({ ipv4Ranges: [], ipv6Ranges: [] }),
      },
    ];

    mockedFetch
      .mockImplementationOnce(async () => {
        callOrder.push('spider-1');
        return { ok: true, text: async () => '{}' } as any;
      })
      .mockImplementationOnce(async () => {
        callOrder.push('spider-2');
        return { ok: true, text: async () => '{}' } as any;
      });

    await crawlAll(spiders);

    expect(callOrder).toEqual(['spider-1', 'spider-2']);
  });

  it('should handle fetch error', async () => {
    const mockSpider: Spider = {
      name: 'http-error',
      type: 'search',
      official: 'https://example.com/404.json',
      format: () => ({ ipv4Ranges: [], ipv6Ranges: [] }),
    };

    const fetchError = new Error('Request failed with status code 404');

    mockedFetch.mockRejectedValueOnce(fetchError);

    const results = await crawlAll([mockSpider]);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('404');
  });

  it('should handle format function errors gracefully', async () => {
    const mockSpider: Spider = {
      name: 'parse-error',
      type: 'search',
      official: 'https://example.com/invalid.json',
      format: (text: string) => {
        throw new Error('Invalid format');
      },
    };

    mockedFetch.mockResolvedValueOnce({ ok: true, text: async () => 'invalid json' } as any);

    const results = await crawlAll([mockSpider]);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('Invalid format');
  });

  it('should handle empty responses', async () => {
    const mockSpider: Spider = {
      name: 'empty-spider',
      type: 'search',
      official: 'https://example.com/empty.json',
      format: () => ({ ipv4Ranges: [], ipv6Ranges: [] }),
    };

    mockedFetch.mockResolvedValueOnce({ ok: true, text: async () => '{}' } as any);

    const results = await crawlAll([mockSpider]);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].ipv4Ranges).toEqual([]);
    expect(results[0].ipv6Ranges).toEqual([]);
  });

  it('should set correct User-Agent header', async () => {
    const mockSpider: Spider = {
      name: 'ua-test',
      type: 'search',
      official: 'https://example.com/test.json',
      format: () => ({ ipv4Ranges: [], ipv6Ranges: [] }),
    };

    mockedFetch.mockResolvedValueOnce({ ok: true, text: async () => '{}' } as any);

    await crawlAll([mockSpider]);

    expect(mockedFetch).toHaveBeenCalledWith(
      'https://example.com/test.json',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('open-spider-ips'),
        }),
      })
    );
  });

  it('should set timeout for requests using AbortController', async () => {
    const mockSpider: Spider = {
      name: 'timeout-test',
      type: 'search',
      official: 'https://example.com/test.json',
      format: () => ({ ipv4Ranges: [], ipv6Ranges: [] }),
    };

    mockedFetch.mockResolvedValueOnce({ ok: true, text: async () => '{}' } as any);

    await crawlAll([mockSpider]);

    expect(mockedFetch).toHaveBeenCalledWith(
      'https://example.com/test.json',
      expect.objectContaining({
        signal: expect.any(Object),
      })
    );
  });
});

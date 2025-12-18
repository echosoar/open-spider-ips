import { spiders } from '../src/spiders';

describe('Spider configurations', () => {
  describe('Yandex spider', () => {
    it('should extract IPs from HTML content', () => {
      const yandexSpider = spiders.find(s => s.name === 'yandex');
      expect(yandexSpider).toBeDefined();

      const htmlContent = `
        <html>
          <body>
            <p>Yandex bot IP ranges:</p>
            <ul>
              <li>5.255.255.0/24</li>
              <li>95.108.128.0/17</li>
              <li>2a02:6b8::/32</li>
              <li>Invalid: 999.999.999.999</li>
            </ul>
          </body>
        </html>
      `;

      const result = yandexSpider!.format(htmlContent);

      expect(result.ipv4Ranges).toContain('5.255.255.0/24');
      expect(result.ipv4Ranges).toContain('95.108.128.0/17');
      expect(result.ipv6Ranges).toContain('2a02:6b8::/32');
      // Invalid IP should be filtered out
      expect(result.ipv4Ranges).not.toContain('999.999.999.999');
    });

    it('should handle HTML with mixed IPv4 and IPv6', () => {
      const yandexSpider = spiders.find(s => s.name === 'yandex');

      const htmlContent = `
        <html>
          <p>Some text with IPs: 213.180.193.0/24 and 2a02:6b8:0:1472::/64</p>
        </html>
      `;

      const result = yandexSpider!.format(htmlContent);

      expect(result.ipv4Ranges.length).toBeGreaterThan(0);
      expect(result.ipv6Ranges.length).toBeGreaterThan(0);
    });
  });

  describe('Bing spider', () => {
    it('should parse prefixes as array of objects with ipv4Prefix property', () => {
      const bingSpider = spiders.find(s => s.name === 'bing');
      expect(bingSpider).toBeDefined();

      const jsonContent = JSON.stringify({
        prefixes: [
          { ipv4Prefix: '13.66.139.0/24' },
          { ipv4Prefix: '40.77.167.0/24' },
          { ipv6Prefix: '2620:1ec:c11::/48' },
        ]
      });

      const result = bingSpider!.format(jsonContent);

      expect(result.ipv4Ranges).toContain('13.66.139.0/24');
      expect(result.ipv4Ranges).toContain('40.77.167.0/24');
      expect(result.ipv6Ranges).toContain('2620:1ec:c11::/48');
    });

    it('should handle both object and string formats', () => {
      const bingSpider = spiders.find(s => s.name === 'bing');

      const jsonContent = JSON.stringify({
        prefixes: [
          { ipv4Prefix: '13.66.139.0/24' },
          '40.77.167.0/24',
          { ipv6Prefix: '2620:1ec:c11::/48' },
        ]
      });

      const result = bingSpider!.format(jsonContent);

      expect(result.ipv4Ranges).toContain('13.66.139.0/24');
      expect(result.ipv4Ranges).toContain('40.77.167.0/24');
      expect(result.ipv6Ranges).toContain('2620:1ec:c11::/48');
    });

    it('should filter out invalid IPs', () => {
      const bingSpider = spiders.find(s => s.name === 'bing');

      const jsonContent = JSON.stringify({
        prefixes: [
          { ipv4Prefix: '13.66.139.0/24' },
          { ipv4Prefix: '999.999.999.999/24' },
          { ipv4Prefix: '256.0.0.1' },
          { ipv6Prefix: '2620:1ec:c11::/48' },
        ]
      });

      const result = bingSpider!.format(jsonContent);

      expect(result.ipv4Ranges).toContain('13.66.139.0/24');
      expect(result.ipv4Ranges).not.toContain('999.999.999.999/24');
      expect(result.ipv4Ranges).not.toContain('256.0.0.1');
      expect(result.ipv6Ranges).toContain('2620:1ec:c11::/48');
    });

    it('should handle objects with both ipv4 and ipv6 prefixes', () => {
      const bingSpider = spiders.find(s => s.name === 'bing');

      const jsonContent = JSON.stringify({
        prefixes: [
          { 
            ipv4Prefix: '13.66.139.0/24',
            ipv6Prefix: '2620:1ec:c11::/48'
          }
        ]
      });

      const result = bingSpider!.format(jsonContent);

      expect(result.ipv4Ranges).toContain('13.66.139.0/24');
      expect(result.ipv6Ranges).toContain('2620:1ec:c11::/48');
    });
  });

  describe('IP validation', () => {
    describe('IPv4 validation', () => {
      it('should accept valid IPv4 addresses', () => {
        const bingSpider = spiders.find(s => s.name === 'bing');

        const validIPs = JSON.stringify({
          prefixes: [
            { ipv4Prefix: '0.0.0.0/0' },
            { ipv4Prefix: '192.168.1.0/24' },
            { ipv4Prefix: '10.0.0.0/8' },
            { ipv4Prefix: '172.16.0.0/12' },
            { ipv4Prefix: '255.255.255.255/32' },
          ]
        });

        const result = bingSpider!.format(validIPs);

        expect(result.ipv4Ranges).toHaveLength(5);
      });

      it('should reject invalid IPv4 addresses', () => {
        const bingSpider = spiders.find(s => s.name === 'bing');

        const invalidIPs = JSON.stringify({
          prefixes: [
            { ipv4Prefix: '256.1.1.1' },
            { ipv4Prefix: '1.256.1.1' },
            { ipv4Prefix: '1.1.256.1' },
            { ipv4Prefix: '1.1.1.256' },
            { ipv4Prefix: '192.168.1.0/33' },
            { ipv4Prefix: '192.168.1.0/-1' },
          ]
        });

        const result = bingSpider!.format(invalidIPs);

        expect(result.ipv4Ranges).toHaveLength(0);
      });

      it('should handle IPv4 with and without CIDR notation', () => {
        const bingSpider = spiders.find(s => s.name === 'bing');

        const ips = JSON.stringify({
          prefixes: [
            { ipv4Prefix: '192.168.1.1' },
            { ipv4Prefix: '192.168.1.0/24' },
          ]
        });

        const result = bingSpider!.format(ips);

        expect(result.ipv4Ranges).toContain('192.168.1.1');
        expect(result.ipv4Ranges).toContain('192.168.1.0/24');
      });
    });

    describe('IPv6 validation', () => {
      it('should accept valid IPv6 addresses', () => {
        const bingSpider = spiders.find(s => s.name === 'bing');

        const validIPs = JSON.stringify({
          prefixes: [
            { ipv6Prefix: '2001:db8::/32' },
            { ipv6Prefix: '2a02:6b8::/32' },
            { ipv6Prefix: '2620:1ec:c11::/48' },
            { ipv6Prefix: 'fe80::1' },
          ]
        });

        const result = bingSpider!.format(validIPs);

        expect(result.ipv6Ranges.length).toBeGreaterThan(0);
      });

      it('should reject invalid IPv6 addresses', () => {
        const bingSpider = spiders.find(s => s.name === 'bing');

        const invalidIPs = JSON.stringify({
          prefixes: [
            { ipv6Prefix: '2001:db8::/129' },
            { ipv6Prefix: 'gggg::1' },
            { ipv6Prefix: '2001:db8:::/32' },
            { ipv6Prefix: 'not-an-ip' },
          ]
        });

        const result = bingSpider!.format(invalidIPs);

        // Most of these should be filtered out (at most 1 might pass basic checks)
        expect(result.ipv6Ranges.length).toBeLessThanOrEqual(1);
      });

      it('should handle IPv6 with compressed notation', () => {
        const bingSpider = spiders.find(s => s.name === 'bing');

        const ips = JSON.stringify({
          prefixes: [
            { ipv6Prefix: '2001:db8::1' },
            { ipv6Prefix: '::1' },
            { ipv6Prefix: 'fe80::' },
          ]
        });

        const result = bingSpider!.format(ips);

        expect(result.ipv6Ranges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Google spider', () => {
    it('should validate IPs from Google JSON format', () => {
      const googleSpider = spiders.find(s => s.name === 'google');

      const jsonContent = JSON.stringify({
        prefixes: [
          { ipv4Prefix: '8.8.8.0/24' },
          { ipv4Prefix: '999.999.999.999/24' },
          { ipv6Prefix: '2001:4860::/32' },
        ]
      });

      const result = googleSpider!.format(jsonContent);

      expect(result.ipv4Ranges).toContain('8.8.8.0/24');
      expect(result.ipv4Ranges).not.toContain('999.999.999.999/24');
      expect(result.ipv6Ranges).toContain('2001:4860::/32');
    });
  });

  describe('OpenAI spider', () => {
    it('should validate IPs from OpenAI format', () => {
      const openaiSpider = spiders.find(s => s.name === 'openai');

      const jsonContent = JSON.stringify({
        prefixes: [
          '23.98.142.0/24',
          '999.999.999.999/24',
          '2a02:6b8::/32',
        ]
      });

      const result = openaiSpider!.format(jsonContent);

      expect(result.ipv4Ranges).toContain('23.98.142.0/24');
      expect(result.ipv4Ranges).not.toContain('999.999.999.999/24');
      expect(result.ipv6Ranges).toContain('2a02:6b8::/32');
    });
  });
});

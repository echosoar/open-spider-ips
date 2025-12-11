import fs from 'fs';
import path from 'path';
import { CrawlResult } from './types';

/**
 * Save crawl results to JSON files
 */
export async function saveResults(
  results: CrawlResult[],
  outputDir: string = 'output'
): Promise<void> {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save complete results
  const allResultsPath = path.join(outputDir, 'all-results.json');
  fs.writeFileSync(
    allResultsPath,
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log(`\n✓ Saved all results to ${allResultsPath}`);

  // Save individual spider results
  for (const result of results) {
    if (result.success && (result.ipv4Ranges.length > 0 || result.ipv6Ranges.length > 0)) {
      const spiderPath = path.join(outputDir, `${result.name}.json`);
      fs.writeFileSync(
        spiderPath,
        JSON.stringify(result, null, 2),
        'utf-8'
      );
    }
  }

  // Save by type
  const byType: Record<string, CrawlResult[]> = {};
  results.forEach((result) => {
    if (!byType[result.type]) {
      byType[result.type] = [];
    }
    byType[result.type].push(result);
  });

  for (const [type, typeResults] of Object.entries(byType)) {
    const typePath = path.join(outputDir, `${type}-crawlers.json`);
    fs.writeFileSync(
      typePath,
      JSON.stringify(typeResults, null, 2),
      'utf-8'
    );
  }

  // Create a summary file
  const summary = {
    timestamp: new Date().toISOString(),
    total: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    byType: Object.entries(byType).map(([type, typeResults]) => ({
      type,
      count: typeResults.length,
      successful: typeResults.filter((r) => r.success).length,
    })),
    results: results.map((r) => ({
      name: r.name,
      type: r.type,
      success: r.success,
      ipv4Count: r.ipv4Ranges.length,
      ipv6Count: r.ipv6Ranges.length,
      error: r.error,
    })),
  };

  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(summary, null, 2),
    'utf-8'
  );
  console.log(`✓ Saved summary to ${summaryPath}`);

  // Create a simple text file with all IPs for easy reference
  const allIPsPath = path.join(outputDir, 'all-ips.txt');
  const ipLines: string[] = [];

  results.forEach((result) => {
    if (result.success) {
      ipLines.push(`\n# ${result.name.toUpperCase()} (${result.type})`);
      ipLines.push('# IPv4 Ranges:');
      result.ipv4Ranges.forEach((ip) => ipLines.push(ip));
      if (result.ipv6Ranges.length > 0) {
        ipLines.push('# IPv6 Ranges:');
        result.ipv6Ranges.forEach((ip) => ipLines.push(ip));
      }
    }
  });

  fs.writeFileSync(allIPsPath, ipLines.join('\n'), 'utf-8');
  console.log(`✓ Saved all IPs to ${allIPsPath}`);
}

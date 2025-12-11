#!/usr/bin/env node

import { spiders } from './spiders';
import { crawlAll, generateSummary } from './crawler';
import { saveResults } from './output';

/**
 * Main function to run the IP range crawler
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║     Open Spider IPs - IP Range Crawler Tool      ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  try {
    // Crawl all configured spiders
    const results = await crawlAll(spiders);

    // Generate and display summary
    const summary = generateSummary(results);

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║                   Summary                         ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log(`Total spiders: ${summary.total}`);
    console.log(`Successful: ${summary.successful}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Total IPv4 ranges: ${summary.totalIPv4}`);
    console.log(`Total IPv6 ranges: ${summary.totalIPv6}`);

    // Save results to files
    await saveResults(results);

    console.log('\n✓ Crawl completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error during crawl:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

export { spiders, crawlAll, saveResults, generateSummary };

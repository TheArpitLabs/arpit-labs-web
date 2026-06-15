import { createClient } from '@supabase/supabase-js';
import pLimit from 'p-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Ensure this is only in your local .env
);

const CONCURRENCY_LIMIT = 5; // Start low; increase based on server performance
const BATCH_SIZE = 100; // Process 100 URLs at a time
const limit = pLimit(CONCURRENCY_LIMIT);

async function ingestUrls(urls: string[]) {
  console.log(`Starting ingestion of ${urls.length} projects...`);
  console.log(`Concurrency limit: ${CONCURRENCY_LIMIT}`);
  console.log(`Batch size: ${BATCH_SIZE}`);

  let successCount = 0;
  let failureCount = 0;
  const failedUrls: { url: string; error: string }[] = [];

  // Process in batches to avoid memory issues with large datasets
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(urls.length / BATCH_SIZE)} (${batch.length} URLs)...`);

    const tasks = batch.map((url) =>
      limit(async () => {
        try {
          // Validate URL format
          new URL(url); // Will throw if invalid

          const { error } = await supabase
            .from('acquisition_queue')
            .insert({
              raw_payload: { url },
              status: 'pending',
              target_domain: new URL(url).hostname,
            });

          if (error) throw error;
          console.log(`[QUEUED] ${url}`);
          successCount++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`[FAILED] ${url}:`, errorMessage);
          failureCount++;
          failedUrls.push({ url, error: errorMessage });
        }
      })
    );

    await Promise.all(tasks);
    
    // Small delay between batches to be gentle on the database
    if (i + BATCH_SIZE < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n=== Ingestion Summary ===');
  console.log(`Total URLs processed: ${urls.length}`);
  console.log(`Successfully queued: ${successCount}`);
  console.log(`Failed: ${failureCount}`);

  if (failedUrls.length > 0) {
    console.log('\nFailed URLs:');
    failedUrls.forEach(({ url, error }) => {
      console.log(`  - ${url}: ${error}`);
    });
  }

  console.log('\nIngestion batch complete.');
}

async function ingestUrlsFromFile(filePath: string) {
  const fs = await import('fs');
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let urls: string[] = [];

    if (filePath.endsWith('.json')) {
      const data = JSON.parse(content);
      urls = Array.isArray(data) ? data : [data];
    } else if (filePath.endsWith('.csv')) {
      urls = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
    } else {
      // Assume plain text with one URL per line
      urls = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
    }

    await ingestUrls(urls);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    process.exit(1);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  1. From command-line arguments:');
    console.log('     npx tsx scripts/bulk-ingest.ts https://github.com/user/repo https://github.com/user/repo2');
    console.log('');
    console.log('  2. From file (JSON, CSV, or plain text):');
    console.log('     npx tsx scripts/bulk-ingest.ts --file urls.json');
    console.log('     npx tsx scripts/bulk-ingest.ts --file urls.csv');
    console.log('     npx tsx scripts/bulk-ingest.ts --file urls.txt');
    console.log('');
    console.log('File formats:');
    console.log('  - JSON: Array of URLs or single URL');
    console.log('  - CSV/Text: One URL per line (lines starting with # are ignored)');
    process.exit(1);
  }

  if (args[0] === '--file' && args[1]) {
    await ingestUrlsFromFile(args[1]);
  } else {
    // Treat all arguments as URLs
    await ingestUrls(args);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

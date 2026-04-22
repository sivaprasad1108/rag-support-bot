const fs = require('fs');
const path = require('path');
const config = require('./config');
const crawlWebsite = require('./crawler/crawlWebsite');
const processRawData = require('./processData');

async function runFullPipeline(url, maxPages = 10) {
  const rawDir = path.join(config.dataPath, 'raw');
  const vectorsDir = config.vectorStorePath;

  console.log(`\nStarting pipeline for ${url}\n`);

  // Clear old data
  if (fs.existsSync(rawDir)) fs.rmSync(rawDir, { recursive: true, force: true });
  if (fs.existsSync(vectorsDir)) fs.rmSync(vectorsDir, { recursive: true, force: true });
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(vectorsDir, { recursive: true });

  // Crawl
  console.log(`Crawling ${url} (up to ${maxPages} pages)...`);
  await crawlWebsite(url, maxPages);

  // Process + embed
  console.log('\nProcessing and generating embeddings...');
  await processRawData();

  // Summary
  const files = fs.readdirSync(vectorsDir).filter(f => f.endsWith('.json'));
  const total = files.reduce((sum, f) => {
    return sum + JSON.parse(fs.readFileSync(path.join(vectorsDir, f), 'utf-8')).length;
  }, 0);

  console.log(`\nDone! ${total} embeddings ready. Run "npm start" then POST to /ask\n`);
}

if (require.main === module) {
  const url = process.argv[2];
  const maxPages = parseInt(process.argv[3]) || 10;

  if (!url) {
    console.error('Usage: node src/runPipeline.js <url> [maxPages]');
    process.exit(1);
  }

  runFullPipeline(url, maxPages).catch(err => {
    console.error('Pipeline failed:', err.message);
    process.exit(1);
  });
}

module.exports = runFullPipeline;

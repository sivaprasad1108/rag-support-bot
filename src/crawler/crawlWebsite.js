const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const config = require('../config');
const processRawData = require('../processData');

async function crawlWebsite(startUrl, maxPages = 100, autoProcess = false) {
  const visited = new Set();
  const queue = [startUrl];
  const domain = new URL(startUrl).hostname;
  const rawDir = path.join(config.dataPath, 'raw');

  // Ensure the raw directory exists
  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  let crawledCount = 0;

  while (queue.length > 0 && crawledCount < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extract main text (you can refine the selector as needed)
      const text = $('body').text().replace(/\s+/g, ' ').trim();

      // Create a filename from the URL
      const filename = url.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
      const filepath = path.join(rawDir, filename);

      // Save as JSON
      fs.writeFileSync(filepath, JSON.stringify({ url, text }, null, 2));

      crawledCount++;

      // Find and queue same-domain links
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        try {
          const fullUrl = new URL(href, url).href;
          if (new URL(fullUrl).hostname === domain && !visited.has(fullUrl) && !queue.includes(fullUrl)) {
            queue.push(fullUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      });
    } catch (e) {
      console.error(`Error crawling ${url}: ${e.message}`);
    }
  }

  console.log(`Crawled ${crawledCount} pages.`);

  if (autoProcess) {
    console.log('Processing crawled data...');
    await processRawData();
  }
}

module.exports = crawlWebsite;

// CLI runner for easy execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const urlIndex = args.findIndex(arg => !arg.startsWith('--'));
  const url = args[urlIndex];
  const maxPages = parseInt(args[urlIndex + 1]) || 10;
  const autoProcess = args.includes('--process');

  if (!url) {
    console.error('Usage: node src/crawler/crawlWebsite.js <url> [maxPages] [--process]');
    console.error('Example: node src/crawler/crawlWebsite.js https://example.com 5 --process');
    process.exit(1);
  }

  crawlWebsite(url, maxPages, autoProcess).catch(err => {
    console.error('Crawler failed:', err.message);
    process.exit(1);
  });
}

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const config = require('../config');

async function crawlWebsite(startUrl, maxPages = 100) {
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
}

module.exports = crawlWebsite;

const fs = require('fs');
const path = require('path');
const config = require('./config');
const cleanText = require('./preprocess/cleanText');
const chunkText = require('./preprocess/chunkText');
const generateEmbeddings = require('./embeddings/generateEmbeddings');

async function processRawData() {
  const rawDir = path.join(config.dataPath, 'raw');
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const { url, text } = JSON.parse(fs.readFileSync(path.join(rawDir, file), 'utf-8'));
    const chunks = chunkText(cleanText(text), url);

    if (chunks.length > 0) {
      await generateEmbeddings(chunks);
      console.log(`Processed ${file}: ${chunks.length} chunks`);
    } else {
      console.log(`Skipped ${file}: no text found`);
    }
  }
}

if (require.main === module) {
  processRawData().catch(console.error);
}

module.exports = processRawData;

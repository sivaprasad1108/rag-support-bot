const fs = require('fs');
const path = require('path');
const cleanText = require('./preprocess/cleanText');
const chunkText = require('./preprocess/chunkText');
const generateEmbeddings = require('./embeddings/generateEmbeddings');

async function processRawData() {
  const rawDir = path.join(__dirname, '..', 'data', 'raw');
  const processedDir = path.join(__dirname, '..', 'data', 'processed');

  if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
  }

  const files = fs.readdirSync(rawDir).filter(file => file.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(rawDir, file);
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const cleanedText = cleanText(rawData.text);
    const chunks = chunkText(cleanedText, rawData.url);

    if (chunks.length > 0) {
      await generateEmbeddings(chunks);
      console.log(`Processed ${file}: ${chunks.length} chunks`);
    } else {
      console.log(`Skipped ${file}: no chunks generated`);
    }
  }

  console.log('All raw data processed.');
}

if (require.main === module) {
  processRawData().catch(console.error);
}

module.exports = processRawData;
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const mockEmbedding = require('../utils/mockEmbedding');

const openai = config.openaiApiKey?.startsWith('sk-')
  ? new OpenAI({ apiKey: config.openaiApiKey })
  : null;

async function generateEmbeddings(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Chunks must be a non-empty array');
  }

  if (!fs.existsSync(config.vectorStorePath)) {
    fs.mkdirSync(config.vectorStorePath, { recursive: true });
  }

  const embeddings = [];
  const batchSize = 10;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map(c => c.text);

    console.log(`Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);

    let data;
    if (openai) {
      const res = await openai.embeddings.create({ model: config.model, input: texts });
      data = res.data;
    } else {
      data = texts.map(t => ({ embedding: mockEmbedding(t) }));
    }

    for (let j = 0; j < data.length; j++) {
      embeddings.push({
        embedding: data[j].embedding,
        text: batch[j].text,
        metadata: { chunkId: batch[j].chunkId, sourceUrl: batch[j].sourceUrl },
      });
    }
  }

  const filepath = path.join(config.vectorStorePath, `embeddings_${Date.now()}.json`);
  fs.writeFileSync(filepath, JSON.stringify(embeddings, null, 2));
  console.log(`Saved ${embeddings.length} embeddings`);
  return embeddings;
}

module.exports = generateEmbeddings;

const OpenAI = require('openai');
const config = require('../config');
const VectorStore = require('../vectorstore/vectorStore');
const mockEmbedding = require('../utils/mockEmbedding');

const openai = config.openaiApiKey?.startsWith('sk-')
  ? new OpenAI({ apiKey: config.openaiApiKey })
  : null;

const vectorStore = new VectorStore();
vectorStore.loadFromDirectory(config.vectorStorePath);
console.log(`Loaded ${vectorStore.size()} vectors`);

async function embedQuery(query) {
  if (openai) {
    const res = await openai.embeddings.create({ model: config.model, input: query });
    return res.data[0].embedding;
  }
  return mockEmbedding(query);
}

async function retrieveContext(query, topK = 5) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  const queryEmbedding = await embedQuery(query);
  const results = vectorStore.search(queryEmbedding, topK);

  const context = results
    .map(r => `Source: ${r.metadata.sourceUrl}\n${r.text}`)
    .join('\n\n---\n\n');

  const sources = [...new Set(results.map(r => r.metadata.sourceUrl))];

  return { query, context, sources, results };
}

module.exports = { vectorStore, retrieveContext };

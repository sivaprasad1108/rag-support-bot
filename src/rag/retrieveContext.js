const OpenAI = require('openai');
const config = require('../config');
const VectorStore = require('../vectorstore/vectorStore');

let openai = null;
const validApiKey = typeof config.openaiApiKey === 'string' && config.openaiApiKey.startsWith('sk-');
if (validApiKey) {
  openai = new OpenAI({
    apiKey: config.openaiApiKey,
  });
} else if (config.openaiApiKey) {
  console.warn('OPENAI_API_KEY appears invalid or placeholder; falling back to mock embeddings.');
}

const vectorStore = new VectorStore();

function deterministicMockEmbedding(query) {
  const length = 1536;
  const embedding = new Array(length);
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash * 31 + query.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < length; i++) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    embedding[i] = ((hash % 2000) - 1000) / 1000;
  }
  return embedding;
}

async function embedQuery(query) {
  if (openai) {
    const response = await openai.embeddings.create({
      model: config.model,
      input: query,
    });
    return response.data[0].embedding;
  }

  console.warn('OPENAI_API_KEY not set; using deterministic mock query embedding.');
  return deterministicMockEmbedding(query);
}

function buildContext(topChunks) {
  return topChunks
    .map(chunk => `URL: ${chunk.metadata.sourceUrl}\nChunk ID: ${chunk.metadata.chunkId}\nText: ${chunk.text}`)
    .join('\n\n');
}

async function retrieveContext(query, topK = 5) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  const queryEmbedding = await embedQuery(query);
  const results = vectorStore.search(queryEmbedding, topK);

  const context = buildContext(results);
  const sources = [...new Set(results.map(result => result.metadata.sourceUrl))];

  return {
    query,
    context,
    sources,
    results,
  };
}

module.exports = {
  vectorStore,
  retrieveContext,
};

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let openai;
if (config.openaiApiKey) {
  openai = new OpenAI({
    apiKey: config.openaiApiKey,
  });
}

/**
 * Generate embeddings for text chunks
 * @param {Array} chunks - Array of chunk objects with { text, chunkId, sourceUrl }
 * @returns {Promise<Array>} Array of embeddings with metadata
 */
async function generateEmbeddings(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Chunks must be a non-empty array');
  }

  const vectorsDir = config.vectorStorePath;
  if (!fs.existsSync(vectorsDir)) {
    fs.mkdirSync(vectorsDir, { recursive: true });
  }

  const embeddings = [];
  const batchSize = 10; // OpenAI API batch processing
  const useMock = !config.openaiApiKey;

  try {
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map(chunk => chunk.text);

      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);

      let embeddings_data;
      
      if (useMock) {
        console.log('⚠️  Using mock embeddings (no API key provided)');
        // Generate mock embeddings (1536-dimensional vectors for ada-002)
        embeddings_data = texts.map(() => ({
          embedding: Array.from({ length: 1536 }, () => Math.random() * 2 - 1),
        }));
      } else {
        const response = await openai.embeddings.create({
          model: config.model,
          input: texts,
        });
        embeddings_data = response.data;
      }

      for (let j = 0; j < embeddings_data.length; j++) {
        const embedding = embeddings_data[j].embedding;
        const chunk = batch[j];

        embeddings.push({
          embedding,
          text: chunk.text,
          metadata: {
            chunkId: chunk.chunkId,
            sourceUrl: chunk.sourceUrl,
          },
        });
      }
    }

    // Save to file
    const filename = `embeddings_${Date.now()}.json`;
    const filepath = path.join(vectorsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(embeddings, null, 2));

    console.log(`✅ Saved ${embeddings.length} embeddings to ${filepath}`);
    return embeddings;
  } catch (error) {
    console.error(`❌ Error generating embeddings: ${error.message}`);
    throw error;
  }
}

module.exports = generateEmbeddings;

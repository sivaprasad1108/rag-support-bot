/**
 * Generates a deterministic 1536-dimensional mock embedding for a given text.
 * Used in place of real OpenAI embeddings when no API key is available.
 * Both storage (generateEmbeddings) and query (retrieveContext) use this
 * function so that cosine similarity works correctly in mock mode.
 *
 * @param {string} text - Input text to embed
 * @param {number} [length=1536] - Embedding dimension
 * @returns {number[]} Deterministic embedding vector
 */
function deterministicMockEmbedding(text, length = 1536) {
  const embedding = new Array(length);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < length; i++) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    embedding[i] = ((hash % 2000) - 1000) / 1000;
  }
  return embedding;
}

module.exports = deterministicMockEmbedding;

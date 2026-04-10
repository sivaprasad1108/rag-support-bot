// in-memory vector store with cosine similarity search

class VectorStore {
  constructor() {
    this.vectors = [];
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} vecA - First vector
   * @param {Array} vecB - Second vector
   * @returns {number} Cosine similarity score (0 to 1)
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Insert a vector with metadata
   * @param {Array} embedding - The embedding vector
   * @param {string} text - The text content
   * @param {Object} metadata - Metadata including chunkId and sourceUrl
   */
  insert(embedding, text, metadata) {
    if (!Array.isArray(embedding)) {
      throw new Error('Embedding must be an array');
    }

    this.vectors.push({
      embedding,
      text,
      metadata,
    });
  }

  /**
   * Insert multiple vectors at once
   * @param {Array} documents - Array of { embedding, text, metadata }
   */
  insertBatch(documents) {
    if (!Array.isArray(documents)) {
      throw new Error('Documents must be an array');
    }

    documents.forEach(doc => {
      this.insert(doc.embedding, doc.text, doc.metadata);
    });
  }

  /**
   * Search for top-k similar vectors using cosine similarity
   * @param {Array} queryVector - The query embedding vector
   * @param {number} k - Number of results to return (default: 5)
   * @returns {Array} Array of top-k similar chunks with scores
   */
  search(queryVector, k = 5) {
    if (!Array.isArray(queryVector)) {
      throw new Error('Query vector must be an array');
    }

    if (this.vectors.length === 0) {
      return [];
    }

    // Calculate similarity for all vectors
    const results = this.vectors.map((doc, index) => ({
      index,
      score: this.cosineSimilarity(queryVector, doc.embedding),
      text: doc.text,
      metadata: doc.metadata,
    }));

    // Sort by score (descending) and return top-k
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(({ score, text, metadata }) => ({
        score,
        text,
        metadata,
      }));
  }

  /**
   * Get the total number of vectors stored
   * @returns {number} Count of vectors
   */
  size() {
    return this.vectors.length;
  }

  /**
   * Clear all vectors from the store
   */
  clear() {
    this.vectors = [];
  }

  /**
   * Get all vectors (useful for debugging or persistence)
   * @returns {Array} All stored vectors
   */
  getAll() {
    return this.vectors;
  }
}

module.exports = VectorStore;

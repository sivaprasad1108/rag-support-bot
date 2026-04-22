const fs = require('fs');
const path = require('path');

class VectorStore {
  constructor() {
    this.vectors = [];
  }

  cosineSimilarity(a, b) {
    if (a.length !== b.length) throw new Error('Vectors must have the same dimension');

    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
  }

  insert(embedding, text, metadata) {
    if (!Array.isArray(embedding)) throw new Error('Embedding must be an array');
    this.vectors.push({ embedding, text, metadata });
  }

  insertBatch(documents) {
    if (!Array.isArray(documents)) throw new Error('Documents must be an array');
    documents.forEach(doc => this.insert(doc.embedding, doc.text, doc.metadata));
  }

  search(queryVector, k = 5) {
    if (!Array.isArray(queryVector)) throw new Error('Query vector must be an array');
    if (this.vectors.length === 0) return [];

    return this.vectors
      .map(doc => ({
        score: this.cosineSimilarity(queryVector, doc.embedding),
        text: doc.text,
        metadata: doc.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  size() {
    return this.vectors.length;
  }

  clear() {
    this.vectors = [];
  }

  loadFromDirectory(dir) {
    if (!dir || !fs.existsSync(dir)) return;
    fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .forEach(file => {
        try {
          const docs = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
          if (Array.isArray(docs)) this.insertBatch(docs);
        } catch (err) {
          console.warn(`Could not load ${file}: ${err.message}`);
        }
      });
  }
}

module.exports = VectorStore;

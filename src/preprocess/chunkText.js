const { v4: uuidv4 } = require('uuid');

function chunkText(text, sourceUrl, chunkSize = 1000, overlap = 200) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }
  if (!sourceUrl || typeof sourceUrl !== 'string') {
    throw new Error('Source URL must be provided');
  }
  if (overlap >= chunkSize) {
    throw new Error(`Overlap (${overlap}) must be less than chunkSize (${chunkSize})`);
  }

  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    const chunk = text.slice(i, i + chunkSize).trim();
    if (chunk.length > 0) {
      chunks.push({ text: chunk, chunkId: uuidv4(), sourceUrl });
    }
  }
  return chunks;
}

module.exports = chunkText;

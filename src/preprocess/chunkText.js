const { v4: uuidv4 } = require('uuid');

function chunkText(text, sourceUrl, chunkSize = 1000, overlap = 200) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  if (!sourceUrl || typeof sourceUrl !== 'string') {
    throw new Error('Source URL must be provided');
  }

  const chunks = [];
  const textLength = text.length;

  for (let i = 0; i < textLength; i += chunkSize - overlap) {
    const end = Math.min(i + chunkSize, textLength);
    const chunkText = text.slice(i, end).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        chunkId: uuidv4(),
        sourceUrl,
      });
    }
  }

  return chunks;
}

module.exports = chunkText;
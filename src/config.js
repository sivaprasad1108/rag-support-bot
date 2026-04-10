require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY,
  dataPath: process.env.DATA_PATH || './data',
  vectorStorePath: process.env.VECTOR_STORE_PATH || './data/vectors',
  chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
  overlap: parseInt(process.env.OVERLAP) || 200,
  model: process.env.MODEL || 'text-embedding-3-small',
  maxTokens: parseInt(process.env.MAX_TOKENS) || 150,
  answerModel: process.env.ANSWER_MODEL || 'gpt-4.1-mini',
};

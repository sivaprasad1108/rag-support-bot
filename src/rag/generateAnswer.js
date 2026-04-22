const OpenAI = require('openai');
const config = require('../config');

const openai = config.openaiApiKey?.startsWith('sk-')
  ? new OpenAI({ apiKey: config.openaiApiKey })
  : null;

const FALLBACK = `I don't have enough information from the provided source.`;

async function generateAnswer(question, context, sources = []) {
  if (!question || typeof question !== 'string') {
    throw new Error('Question must be a non-empty string');
  }
  if (context == null || typeof context !== 'string') {
    throw new Error('Context must be provided as a string');
  }

  const uniqueSources = Array.isArray(sources) ? [...new Set(sources)] : [];

  if (!openai) {
    return { answer: FALLBACK, sources: uniqueSources };
  }

  const response = await openai.chat.completions.create({
    model: config.answerModel,
    messages: [
      {
        role: 'system',
        content: `You are a support assistant. Answer questions only using the provided context. If the answer is not in the context, say exactly: "${FALLBACK}"`,
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0,
    max_tokens: 512,
  });

  const answer = response?.choices?.[0]?.message?.content?.trim() || FALLBACK;
  return { answer, sources: uniqueSources };
}

module.exports = generateAnswer;

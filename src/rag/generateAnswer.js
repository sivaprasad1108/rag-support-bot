const OpenAI = require('openai');
const config = require('../config');

const validApiKey = typeof config.openaiApiKey === 'string' && config.openaiApiKey.startsWith('sk-');
let openai = null;
if (validApiKey) {
  openai = new OpenAI({
    apiKey: config.openaiApiKey,
  });
} else if (config.openaiApiKey) {
  console.warn('OPENAI_API_KEY is missing or invalid; generateAnswer will use a mock response for testing.');
}

const DEFAULT_MODEL = 'gpt-3.5-turbo';

async function generateAnswer(question, context, sources = []) {
  if (!question || typeof question !== 'string') {
    throw new Error('Question must be a non-empty string');
  }

  if (context == null || typeof context !== 'string') {
    throw new Error('Context must be provided as a string');
  }

  const model = config.answerModel || DEFAULT_MODEL;
  const systemPrompt = `You are an assistant that answers questions only using the provided context. Do not answer from your own knowledge or invent facts. If the answer cannot be found in the provided context, respond exactly:\n\n"I don’t have enough information from the provided source."`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer only from the provided context.` },
  ];

  if (!openai) {
    console.warn('OPENAI_API_KEY not available; generateAnswer is returning a mock test response.');
    return {
      answer: 'I don’t have enough information from the provided source.',
      sources: Array.isArray(sources) ? [...new Set(sources)] : [],
    };
  }

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0,
    max_tokens: 512,
  });

  const answer = response?.choices?.[0]?.message?.content?.trim();

  return {
    answer: answer || 'I don’t have enough information from the provided source.',
    sources: Array.isArray(sources) ? [...new Set(sources)] : [],
  };
}

module.exports = generateAnswer;

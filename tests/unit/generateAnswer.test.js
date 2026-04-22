const generateAnswer = require('../../src/rag/generateAnswer');

const FALLBACK = `I don't have enough information from the provided source.`;

describe('generateAnswer (mock mode)', () => {
  test('throws for non-string question', async () => {
    await expect(generateAnswer(null, 'context')).rejects.toThrow('Question must be a non-empty string');
    await expect(generateAnswer(42, 'context')).rejects.toThrow();
  });

  test('throws for non-string context', async () => {
    await expect(generateAnswer('Who?', null)).rejects.toThrow('Context must be provided as a string');
    await expect(generateAnswer('Who?', 42)).rejects.toThrow();
  });

  test('returns fallback answer with empty context in mock mode', async () => {
    const result = await generateAnswer('What is Node.js?', '');
    expect(result.answer).toBe(FALLBACK);
  });

  test('fallback answer uses ASCII apostrophe (not curly quote)', () => {
    // Ensure the apostrophe in "don't" is U+0027, not U+2019
    expect(FALLBACK.charCodeAt(FALLBACK.indexOf("'"))).toBe(0x27);
  });

  test('returns object with answer and sources', async () => {
    const result = await generateAnswer('A question?', 'Some context.', ['http://a.com']);
    expect(typeof result.answer).toBe('string');
    expect(Array.isArray(result.sources)).toBe(true);
  });

  test('deduplicates sources', async () => {
    const result = await generateAnswer('Q?', 'ctx', ['http://a.com', 'http://a.com', 'http://b.com']);
    expect(result.sources).toHaveLength(2);
    expect(new Set(result.sources).size).toBe(2);
  });

  test('handles empty sources array', async () => {
    const result = await generateAnswer('Q?', 'ctx', []);
    expect(result.sources).toEqual([]);
  });

  test('sources defaults to empty array when omitted', async () => {
    const result = await generateAnswer('Q?', 'ctx');
    expect(Array.isArray(result.sources)).toBe(true);
  });
});

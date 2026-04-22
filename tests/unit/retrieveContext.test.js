const mockEmbedding = require('../../src/utils/mockEmbedding');
const { vectorStore, retrieveContext } = require('../../src/rag/retrieveContext');

const SOURCE_URL = 'https://example.com';

function seedStore(texts) {
  vectorStore.clear();
  texts.forEach((text, i) => {
    vectorStore.insert(
      mockEmbedding(text),
      text,
      { chunkId: `chunk-${i}`, sourceUrl: SOURCE_URL }
    );
  });
}

describe('retrieveContext (mock mode)', () => {
  afterEach(() => {
    vectorStore.clear();
  });

  test('throws for non-string query', async () => {
    await expect(retrieveContext(null)).rejects.toThrow('Query must be a non-empty string');
    await expect(retrieveContext(42)).rejects.toThrow();
  });

  test('returns empty results for an empty vector store', async () => {
    const result = await retrieveContext('anything');
    expect(result.results).toHaveLength(0);
    expect(result.context).toBe('');
    expect(result.sources).toEqual([]);
  });

  test('returns the query back in the result', async () => {
    seedStore(['some text']);
    const result = await retrieveContext('some text');
    expect(result.query).toBe('some text');
  });

  test('top result score is ~1.0 when query matches stored text exactly', async () => {
    const text = 'Node.js is a JavaScript runtime';
    seedStore([text]);
    const result = await retrieveContext(text, 1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].score).toBeCloseTo(1.0, 2);
    expect(result.results[0].text).toBe(text);
  });

  test('topK limits the number of results', async () => {
    seedStore(['a', 'b', 'c', 'd', 'e']);
    const result = await retrieveContext('a', 2);
    expect(result.results.length).toBeLessThanOrEqual(2);
  });

  test('sources contains unique URLs from retrieved chunks', async () => {
    seedStore(['alpha', 'beta']);
    const result = await retrieveContext('alpha', 5);
    result.sources.forEach(s => expect(s).toBe(SOURCE_URL));
    expect(new Set(result.sources).size).toBe(result.sources.length);
  });

  test('context string includes chunk text', async () => {
    const text = 'hello world context';
    seedStore([text]);
    const result = await retrieveContext(text, 1);
    expect(result.context).toContain(text);
  });
});

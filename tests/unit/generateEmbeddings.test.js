const fs = require('fs');
const path = require('path');
const generateEmbeddings = require('../../src/embeddings/generateEmbeddings');

const VECTORS_DIR = '/tmp/test-rag-vectors';

beforeAll(() => {
  fs.mkdirSync(VECTORS_DIR, { recursive: true });
});

afterAll(() => {
  fs.rmSync(VECTORS_DIR, { recursive: true, force: true });
});

describe('generateEmbeddings (mock mode)', () => {
  const chunks = [
    { text: 'First chunk of text', chunkId: 'id-1', sourceUrl: 'https://example.com/page1' },
    { text: 'Second chunk of text', chunkId: 'id-2', sourceUrl: 'https://example.com/page2' },
  ];

  test('throws for empty or non-array input', async () => {
    await expect(generateEmbeddings([])).rejects.toThrow();
    await expect(generateEmbeddings(null)).rejects.toThrow();
    await expect(generateEmbeddings('bad')).rejects.toThrow();
  });

  test('returns an array with one entry per chunk', async () => {
    const results = await generateEmbeddings(chunks);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(chunks.length);
  });

  test('each result has embedding, text, and metadata', async () => {
    const results = await generateEmbeddings(chunks);
    results.forEach((r, i) => {
      expect(Array.isArray(r.embedding)).toBe(true);
      expect(r.embedding).toHaveLength(1536);
      expect(r.text).toBe(chunks[i].text);
      expect(r.metadata.chunkId).toBe(chunks[i].chunkId);
      expect(r.metadata.sourceUrl).toBe(chunks[i].sourceUrl);
    });
  });

  test('mock embeddings are deterministic (not random)', async () => {
    const results1 = await generateEmbeddings(chunks);
    const results2 = await generateEmbeddings(chunks);
    expect(results1[0].embedding).toEqual(results2[0].embedding);
  });

  test('writes a JSON file to the vectors directory', async () => {
    const before = fs.readdirSync(VECTORS_DIR).length;
    await generateEmbeddings(chunks);
    const after = fs.readdirSync(VECTORS_DIR).length;
    expect(after).toBeGreaterThan(before);
  });
});

const deterministicMockEmbedding = require('../../src/utils/mockEmbedding');

describe('deterministicMockEmbedding', () => {
  test('returns an array of the default length (1536)', () => {
    const emb = deterministicMockEmbedding('hello');
    expect(Array.isArray(emb)).toBe(true);
    expect(emb).toHaveLength(1536);
  });

  test('returns an array of the requested length', () => {
    const emb = deterministicMockEmbedding('hello', 64);
    expect(emb).toHaveLength(64);
  });

  test('all values are in the range [-1, 1]', () => {
    const emb = deterministicMockEmbedding('test text');
    emb.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    });
  });

  test('same input always produces the same vector (deterministic)', () => {
    const a = deterministicMockEmbedding('repeat me');
    const b = deterministicMockEmbedding('repeat me');
    expect(a).toEqual(b);
  });

  test('different inputs produce different vectors', () => {
    const a = deterministicMockEmbedding('text one');
    const b = deterministicMockEmbedding('text two');
    expect(a).not.toEqual(b);
  });

  test('empty string produces a valid deterministic vector', () => {
    const emb = deterministicMockEmbedding('');
    expect(emb).toHaveLength(1536);
    const emb2 = deterministicMockEmbedding('');
    expect(emb).toEqual(emb2);
  });
});

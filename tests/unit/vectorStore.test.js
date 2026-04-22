const fs = require('fs');
const path = require('path');
const VectorStore = require('../../src/vectorstore/vectorStore');

const DIM = 4; // small dimension for test speed

function makeVec(values) {
  return values; // just an array
}

describe('VectorStore', () => {
  let store;

  beforeEach(() => {
    store = new VectorStore();
  });

  // --- cosineSimilarity ---
  describe('cosineSimilarity', () => {
    test('identical vectors return 1', () => {
      const v = [1, 2, 3, 4];
      expect(store.cosineSimilarity(v, v)).toBeCloseTo(1.0);
    });

    test('orthogonal vectors return 0', () => {
      expect(store.cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
    });

    test('opposite vectors return -1', () => {
      expect(store.cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
    });

    test('zero vector returns 0', () => {
      expect(store.cosineSimilarity([0, 0], [1, 1])).toBe(0);
    });

    test('throws for mismatched dimensions', () => {
      expect(() => store.cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });

  // --- insert / size ---
  describe('insert and size', () => {
    test('size starts at 0', () => {
      expect(store.size()).toBe(0);
    });

    test('insert increments size', () => {
      store.insert([1, 0, 0, 0], 'hello', { chunkId: '1', sourceUrl: 'http://a.com' });
      expect(store.size()).toBe(1);
    });

    test('throws for non-array embedding', () => {
      expect(() => store.insert('not-array', 'text', {})).toThrow();
    });
  });

  // --- insertBatch ---
  describe('insertBatch', () => {
    test('inserts multiple documents', () => {
      store.insertBatch([
        { embedding: [1, 0, 0, 0], text: 'a', metadata: { chunkId: '1', sourceUrl: 'http://a.com' } },
        { embedding: [0, 1, 0, 0], text: 'b', metadata: { chunkId: '2', sourceUrl: 'http://b.com' } },
      ]);
      expect(store.size()).toBe(2);
    });

    test('throws for non-array documents', () => {
      expect(() => store.insertBatch('bad')).toThrow();
    });
  });

  // --- search ---
  describe('search', () => {
    test('returns empty array for empty store', () => {
      expect(store.search([1, 0, 0, 0])).toEqual([]);
    });

    test('returns top-k results sorted by descending score', () => {
      store.insert([1, 0, 0, 0], 'exact match', { chunkId: '1', sourceUrl: 'http://x.com' });
      store.insert([0, 1, 0, 0], 'orthogonal', { chunkId: '2', sourceUrl: 'http://y.com' });
      store.insert([-1, 0, 0, 0], 'opposite', { chunkId: '3', sourceUrl: 'http://z.com' });

      const results = store.search([1, 0, 0, 0], 3);
      expect(results[0].score).toBeCloseTo(1.0);
      expect(results[1].score).toBeCloseTo(0.0);
      expect(results[2].score).toBeCloseTo(-1.0);
    });

    test('limits results to k', () => {
      for (let i = 0; i < 10; i++) {
        store.insert([Math.random(), Math.random(), Math.random(), Math.random()], `text${i}`, { chunkId: `${i}`, sourceUrl: 'http://x.com' });
      }
      expect(store.search([1, 0, 0, 0], 3)).toHaveLength(3);
    });

    test('result shape includes score, text, metadata', () => {
      store.insert([1, 0, 0, 0], 'hello', { chunkId: 'abc', sourceUrl: 'http://x.com' });
      const [result] = store.search([1, 0, 0, 0], 1);
      expect(typeof result.score).toBe('number');
      expect(result.text).toBe('hello');
      expect(result.metadata.chunkId).toBe('abc');
    });
  });

  // --- clear ---
  describe('clear', () => {
    test('resets size to 0', () => {
      store.insert([1, 0, 0, 0], 'text', { chunkId: '1', sourceUrl: 'http://x.com' });
      store.clear();
      expect(store.size()).toBe(0);
    });
  });

  // --- loadFromDirectory ---
  describe('loadFromDirectory', () => {
    const tmpDir = '/tmp/test-vectorstore-load';

    beforeAll(() => {
      fs.mkdirSync(tmpDir, { recursive: true });
      const docs = [
        { embedding: [1, 0, 0, 0], text: 'loaded doc', metadata: { chunkId: 'x1', sourceUrl: 'http://a.com' } },
      ];
      fs.writeFileSync(path.join(tmpDir, 'test.json'), JSON.stringify(docs));
    });

    afterAll(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('does not throw for non-existent directory', () => {
      expect(() => store.loadFromDirectory('/tmp/definitely-does-not-exist-xyz')).not.toThrow();
    });

    test('loads documents from JSON files', () => {
      store.loadFromDirectory(tmpDir);
      expect(store.size()).toBe(1);
    });
  });
});

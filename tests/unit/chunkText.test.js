const chunkText = require('../../src/preprocess/chunkText');

describe('chunkText', () => {
  const url = 'https://example.com';

  test('throws for non-string text', () => {
    expect(() => chunkText(null, url)).toThrow('Text must be a non-empty string');
    expect(() => chunkText(42, url)).toThrow();
  });

  test('throws for missing sourceUrl', () => {
    expect(() => chunkText('some text', null)).toThrow('Source URL must be provided');
    expect(() => chunkText('some text', '')).toThrow();
  });

  test('throws when overlap >= chunkSize', () => {
    expect(() => chunkText('text', url, 100, 100)).toThrow('Overlap');
    expect(() => chunkText('text', url, 100, 200)).toThrow('Overlap');
  });

  test('returns a single chunk for short text', () => {
    const chunks = chunkText('Hello world', url, 1000, 200);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('Hello world');
    expect(chunks[0].sourceUrl).toBe(url);
    expect(typeof chunks[0].chunkId).toBe('string');
    expect(chunks[0].chunkId.length).toBeGreaterThan(0);
  });

  test('produces multiple chunks for long text', () => {
    const text = 'a'.repeat(2500);
    const chunks = chunkText(text, url, 1000, 200);
    expect(chunks.length).toBeGreaterThan(1);
  });

  test('each chunk is at most chunkSize characters', () => {
    const text = 'x'.repeat(3000);
    const chunks = chunkText(text, url, 1000, 200);
    chunks.forEach(c => expect(c.text.length).toBeLessThanOrEqual(1000));
  });

  test('consecutive chunks overlap by approximately the overlap amount', () => {
    const text = 'abcdefghij'.repeat(200); // 2000 chars
    const chunkSize = 100;
    const overlap = 20;
    const chunks = chunkText(text, url, chunkSize, overlap);
    expect(chunks.length).toBeGreaterThan(1);
    // The tail of chunk[0] should equal the head of chunk[1]
    const tail = chunks[0].text.slice(-overlap);
    const head = chunks[1].text.slice(0, overlap);
    expect(tail).toBe(head);
  });

  test('each chunk has a unique chunkId', () => {
    const text = 'word '.repeat(500);
    const chunks = chunkText(text, url);
    const ids = chunks.map(c => c.chunkId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('all chunks carry the correct sourceUrl', () => {
    const text = 'x'.repeat(3000);
    const chunks = chunkText(text, url);
    chunks.forEach(c => expect(c.sourceUrl).toBe(url));
  });
});

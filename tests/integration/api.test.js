const request = require('supertest');
const app = require('../../src/app');
const mockEmbedding = require('../../src/utils/mockEmbedding');
const { vectorStore } = require('../../src/rag/retrieveContext');

beforeEach(() => {
  vectorStore.clear();
});

afterAll(() => {
  vectorStore.clear();
});

describe('POST /ask', () => {
  test('returns 400 when question is missing', async () => {
    const res = await request(app).post('/ask').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when question is not a string', async () => {
    const res = await request(app).post('/ask').send({ question: 123 });
    expect(res.status).toBe(400);
  });

  test('returns 400 for empty string question', async () => {
    const res = await request(app).post('/ask').send({ question: '' });
    expect(res.status).toBe(400);
  });

  test('returns 200 with correct shape for valid question', async () => {
    const res = await request(app).post('/ask').send({ question: 'What is this about?' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('question', 'What is this about?');
    expect(res.body).toHaveProperty('answer');
    expect(res.body).toHaveProperty('sources');
    expect(res.body).toHaveProperty('retrievedChunks');
    expect(Array.isArray(res.body.retrievedChunks)).toBe(true);
  });

  test('returns empty retrievedChunks when store is empty', async () => {
    const res = await request(app).post('/ask').send({ question: 'Anything?' });
    expect(res.status).toBe(200);
    expect(res.body.retrievedChunks).toHaveLength(0);
  });

  test('returns correct top chunk when store is seeded with matching text', async () => {
    const text = 'Node.js is a JavaScript runtime built on V8';
    vectorStore.insert(
      mockEmbedding(text),
      text,
      { chunkId: 'c1', sourceUrl: 'https://nodejs.org' }
    );

    const res = await request(app).post('/ask').send({ question: text, topK: 1 });
    expect(res.status).toBe(200);
    expect(res.body.retrievedChunks).toHaveLength(1);
    expect(res.body.retrievedChunks[0].score).toBeCloseTo(1.0, 2);
    expect(res.body.retrievedChunks[0].text).toBe(text);
  });

  test('topK limits the number of retrieved chunks', async () => {
    for (let i = 0; i < 10; i++) {
      const t = `document ${i}`;
      vectorStore.insert(mockEmbedding(t), t, { chunkId: `c${i}`, sourceUrl: 'https://example.com' });
    }
    const res = await request(app).post('/ask').send({ question: 'document', topK: 3 });
    expect(res.status).toBe(200);
    expect(res.body.retrievedChunks.length).toBeLessThanOrEqual(3);
  });

  test('extra fields in body are ignored', async () => {
    const res = await request(app).post('/ask').send({ question: 'test?', unknownField: true });
    expect(res.status).toBe(200);
  });

  test('fallback answer uses ASCII apostrophe (not curly quote)', async () => {
    const res = await request(app).post('/ask').send({ question: 'Something nobody knows?' });
    expect(res.status).toBe(200);
    expect(res.body.answer.includes('\u2019')).toBe(false);
  });
});

# RAG Support Bot

A Node.js-based Retrieval-Augmented Generation (RAG) bot that crawls websites, processes content, generates embeddings, and answers questions using retrieved context.

## Quick Start

### 1. Setup
```bash
npm install
```

### 2. Configure OpenAI API Key
Create a `.env` file:
```
OPENAI_API_KEY=sk-your-api-key-here
PORT=3000
```

### 3. Run the Integrated Pipeline

**Option A: Using `npm run crawl` (recommended)**
```bash
npm run crawl https://example.com 5
```

**Option B: Using `npm run pipeline`**
```bash
npm run pipeline https://example.com 5
```

**Parameters:**
- First parameter: URL to crawl (required)
- Second parameter: Maximum pages to crawl (optional, default: 10)

**What it does:**
1. Clears old data
2. Crawls the website
3. Cleans and chunks text
4. Generates embeddings via OpenAI
5. Saves embeddings to `data/vectors/`
6. Reports completion — run `npm start` to load and serve

### 4. Start the Server
```bash
npm start
```

Server runs on `http://localhost:3000`

### 5. Ask Questions
```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this website about?"}'
```


## Architecture

```
Crawler        Clean & Chunk      Embeddings         Vector Store      RAG
├─ crawlWebsite.js  ├─ cleanText.js     ├─ generateEmbeddings.js  ├─ vectorStore.js    ├─ retrieveContext.js
└─ data/raw/        └─ chunkText.js     └─ data/vectors/          └─ in-memory         └─ generateAnswer.js
```

## Data Flow

1. **Crawl**: `crawlWebsite()` → saves raw HTML to `data/raw/`
2. **Clean**: `cleanText()` → removes HTML entities and extra whitespace
3. **Chunk**: `chunkText()` → splits text into overlapping chunks
4. **Embed**: `generateEmbeddings()` → creates OpenAI embeddings → `data/vectors/`
5. **Retrieve**: Query embedding → cosine similarity search → top-k chunks
6. **Answer**: Pass question + retrieved context to OpenAI → response

## Running Tests

```bash
npm test
```

Tests run in mock mode (no API key required). The suite covers unit tests for every module and integration tests for the HTTP API.

## API Reference

### POST /ask
Retrieve context and generate an answer.

**Request:**
```json
{
  "question": "Your question here",
  "topK": 5
}
```

**Response:**
```json
{
  "question": "Your question here",
  "answer": "Generated answer from context",
  "sources": ["https://..."],
  "retrievedChunks": [...]
}
```


## Key Files

- `src/runPipeline.js` - Integrated end-to-end pipeline
- `src/crawler/crawlWebsite.js` - Website crawler
- `src/preprocess/cleanText.js` - Text cleaning
- `src/preprocess/chunkText.js` - Text chunking
- `src/embeddings/generateEmbeddings.js` - Embedding generation
- `src/vectorstore/vectorStore.js` - In-memory vector search
- `src/rag/retrieveContext.js` - Context retrieval
- `src/rag/generateAnswer.js` - Answer generation
- `src/api/ragRoute.js` - Express route handler for /ask
- `src/utils/mockEmbedding.js` - Deterministic mock embedding used when no API key is set

## Configuration

See `src/config.js` for environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `PORT` - Server port (default: 3000)
- `MODEL` - Embedding model (default: text-embedding-3-small)
- `ANSWER_MODEL` - Chat model (default: gpt-4.1-mini)
- `CHUNK_SIZE` - Text chunk size (default: 1000)
- `OVERLAP` - Chunk overlap (default: 200)

## Examples

**Crawl OpenAI docs:**
```bash
npm run crawl https://developers.openai.com 20
npm start
# Then ask: "What is the OpenAI API?"
```

**Crawl Node.js docs:**
```bash
npm run crawl https://nodejs.org 50
npm start
# Then ask: "What is Node.js?"
```

**Custom site:**
```bash
npm run crawl https://yoursite.com 10
npm start
```

## Error Handling

- Invalid OpenAI API key → falls back to mock responses
- Empty vector store → returns fallback message
- Network errors → logged to console

## Performance

- **Crawling**: 5-10 pages/minute depending on site size
- **Embedding**: ~100 chunks/minute (batched for efficiency)
- **Retrieval**: <100ms per query
- **Answer generation**: 1-5 seconds depending on OpenAI latency

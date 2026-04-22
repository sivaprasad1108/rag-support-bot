# RAG Support Bot

A small Node.js Retrieval-Augmented Generation (RAG) project that crawls a site, stores extracted text, builds embeddings, loads them into an in-memory vector store, and answers questions through a simple HTTP API.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Optional configuration
Create a `.env` file if you want to use real OpenAI models or change defaults:

```env
OPENAI_API_KEY=sk-your-api-key-here
PORT=3000
DATA_PATH=./data
VECTOR_STORE_PATH=./data/vectors
MODEL=text-embedding-3-small
ANSWER_MODEL=gpt-4.1-mini
CHUNK_SIZE=1000
OVERLAP=200
```

If `OPENAI_API_KEY` is missing, or does not start with `sk-`, the project runs in mock mode:
- embeddings are generated with `src/utils/mockEmbedding.js`
- answer generation returns a fixed fallback string instead of calling OpenAI

### 3. Build the local knowledge base
`npm run crawl` and `npm run pipeline` are aliases for the same command.

```bash
npm run crawl https://example.com 5
```

Arguments:
- first argument: seed URL to crawl
- second argument: maximum number of pages to crawl, default `10`

What the pipeline does:
1. clears previous raw and vector data
2. crawls same-domain pages starting from the seed URL
3. cleans extracted text
4. chunks text using `CHUNK_SIZE` and `OVERLAP`
5. generates embeddings in batches
6. writes embedding JSON files to `VECTOR_STORE_PATH`

### 4. Start the API server
```bash
npm start
```

By default the server runs on `http://localhost:3000`.

The vector store is loaded once when the server starts. If you rerun the pipeline, restart the server to pick up the new embeddings.

### 5. Ask a question
```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is this website about?"}'
```

## How It Works

1. `src/runPipeline.js` clears old data, crawls the site, and processes the saved pages.
2. `src/crawler/crawlWebsite.js` fetches pages with `axios`, extracts `$('body').text()`, and saves `{ url, text }` JSON files under `data/raw/` or `DATA_PATH/raw`.
3. `src/processData.js` cleans text, chunks it, and passes chunks to the embedding step.
4. `src/embeddings/generateEmbeddings.js` uses OpenAI embeddings when a valid-looking API key is present, otherwise deterministic mock embeddings.
5. `src/rag/retrieveContext.js` loads saved vectors into `VectorStore`, embeds the user query, and returns the top-k cosine-similar chunks.
6. `src/rag/generateAnswer.js` uses the configured chat model when OpenAI is enabled; in mock mode it returns the fallback answer directly.

## API Reference

### `POST /ask`
Retrieves context and generates an answer.

Request body:

```json
{
  "question": "Your question here",
  "topK": 5
}
```

Notes:
- `question` is required and must be a non-empty string
- `topK` is optional and defaults to `5`

Success response shape:

```json
{
  "question": "Your question here",
  "answer": "Generated answer from context",
  "sources": ["https://example.com/page"],
  "retrievedChunks": [
    {
      "score": 0.99,
      "text": "Relevant chunk text",
      "metadata": {
        "chunkId": "chunk-id",
        "sourceUrl": "https://example.com/page"
      }
    }
  ]
}
```

Error responses:
- `400` when `question` is missing or not a string
- `500` when retrieval or answer generation throws

## Configuration

Environment variables read by [`src/config.js`](./src/config.js):

- `OPENAI_API_KEY`: enables real OpenAI calls only when the value starts with `sk-`
- `PORT`: HTTP port, default `3000`
- `DATA_PATH`: base directory for crawled raw data, default `./data`
- `VECTOR_STORE_PATH`: directory for saved embedding JSON files, default `./data/vectors`
- `MODEL`: embedding model, default `text-embedding-3-small`
- `ANSWER_MODEL`: chat model, default `gpt-4.1-mini`
- `CHUNK_SIZE`: chunk size passed to `chunkText`, default `1000`
- `OVERLAP`: chunk overlap passed to `chunkText`, default `200`

## Testing

```bash
npm test
```

The Jest setup forces mock mode and redirects data paths to `/tmp`, so tests do not call the real OpenAI API or write into your project `data/` directory.

## Key Files

- `src/app.js`: Express app entry point
- `src/runPipeline.js`: end-to-end ingestion pipeline
- `src/processData.js`: raw-data processing step
- `src/crawler/crawlWebsite.js`: crawler and optional crawler CLI
- `src/preprocess/cleanText.js`: text cleanup
- `src/preprocess/chunkText.js`: chunk generation
- `src/embeddings/generateEmbeddings.js`: embedding generation and JSON persistence
- `src/vectorstore/vectorStore.js`: in-memory cosine-similarity store
- `src/rag/retrieveContext.js`: retrieval step
- `src/rag/generateAnswer.js`: answer generation
- `src/api/ragRoute.js`: `POST /ask` route
- `src/utils/mockEmbedding.js`: deterministic mock embedding helper

## Current Limitations

- the crawler only follows links on the same hostname as the seed URL
- extraction is based on raw `<body>` text, without special handling for navigation or boilerplate
- the vector store lives in memory and is only populated during server startup
- a missing or non-`sk-` API key triggers mock mode, but a bad `sk-...` key may still cause OpenAI request failures instead of automatically falling back
- every pipeline run clears previously generated raw files and vectors before rebuilding

// Must run before any src/* module is loaded.
// Setting a non-sk- value prevents the validApiKey check from passing,
// ensuring all tests run in mock mode (no real OpenAI API calls).
// dotenv will NOT override an already-set env var, so this sticks.
process.env.OPENAI_API_KEY = 'mock-key-not-real';

// Redirect data paths to temp directories so tests never touch real data/
process.env.VECTOR_STORE_PATH = '/tmp/test-rag-vectors';
process.env.DATA_PATH = '/tmp/test-rag-data';

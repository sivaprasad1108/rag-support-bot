const express = require('express');
const config = require('./config');
const askRoute = require('./api/askRoute');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Register the /ask route
app.use('/ask', askRoute);

// Start the server
app.listen(config.port, () => {
  console.log(`RAG Support Bot server running on port ${config.port}`);
});

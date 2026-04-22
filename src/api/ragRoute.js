const express = require('express');
const { retrieveContext } = require('../rag/retrieveContext');
const generateAnswer = require('../rag/generateAnswer');

const router = express.Router();

router.post('/', async (req, res) => {
  const { question, topK } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question must be a non-empty string' });
  }

  try {
    const { context, sources, results } = await retrieveContext(question, Number(topK) || 5);
    const { answer } = await generateAnswer(question, context, sources);

    res.json({ question, answer, sources, retrievedChunks: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;

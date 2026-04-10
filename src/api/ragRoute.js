const express = require('express');
const { retrieveContext } = require('../rag/retrieveContext');
const generateAnswer = require('../rag/generateAnswer');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { question, topK } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Request body must include a non-empty question string.' });
    }

    const results = await retrieveContext(question, Number(topK) || 5);
    // console.log(`Retrieved ${results.results.length} chunks for question: ${question}`);
    
    const answerResponse = await generateAnswer(question, results.context, results.sources);
    console.log(`Generated answer for question: ${answerResponse.answer}`);
    
    return res.json({
      question,
      answer: answerResponse.answer,
      sources: answerResponse.sources,
      retrievedChunks: results.results,
    });
  } catch (error) {
    console.error('Error handling /ask request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

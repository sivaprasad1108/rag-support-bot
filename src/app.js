const express = require('express');
const config = require('./config');
const ragRoute = require('./api/ragRoute');

const app = express();
app.use(express.json());
app.use('/ask', ragRoute);

module.exports = app;

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

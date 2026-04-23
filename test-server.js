console.log('Starting test server...');
console.log('Module type:', typeof module);
console.log('Import meta:', typeof import.meta);

const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Test server working!' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});

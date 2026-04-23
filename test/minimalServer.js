// Minimal server test
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Minimal server running on http://localhost:${PORT}`);
});

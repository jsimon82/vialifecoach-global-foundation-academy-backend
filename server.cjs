// CommonJS server entry point
const app = require('./src/app.js');
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`🚀 Vialifecoach Academy Backend running on http://localhost:${PORT}`);
    console.log('📋 Server started successfully!');
});

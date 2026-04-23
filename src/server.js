import app from './app.js';
// import { PORT } from './config/env.js';
const PORT = 5000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

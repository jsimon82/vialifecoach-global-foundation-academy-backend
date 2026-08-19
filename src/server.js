import app, { databaseInitialization } from './app.js';
const PORT = Number(process.env.PORT || 5000);

await databaseInitialization;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

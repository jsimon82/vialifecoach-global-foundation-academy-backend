// Robust startup script that runs the real app with all routes (ESM-safe)
console.log('🚀 Starting Vialifecoach Academy Backend (real app)...');
import 'dotenv/config';

const PORT = 5000;

try {
  const { default: app } = await import('./src/app.js');
  app.listen(PORT, () => {
    console.log(`🚀 Vialifecoach Academy Backend running on http://localhost:${PORT}`);
    console.log('📋 Real app routes enabled (admin, support tickets, applications, etc.)');
  });
} catch (error) {
  console.error('❌ Failed to start real app:', error);
}

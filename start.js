// Bypass script to start server without ES module issues
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vialifecoach Academy Backend...');

// Start server with CommonJS override
const serverProcess = spawn('node', ['--input-type=commonjs', 'src/server.js'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_OPTIONS: undefined // Clear any NODE_OPTIONS that might interfere
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
});

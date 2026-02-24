import fetch from 'node-fetch';

async function createUser() {
  const url = 'http://localhost:5500/api/v1/users';
  const payload = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Response from API:', data);
  } catch (error) {
    console.error('Error making request:', error);
  }
}

createUser();

import mysql from 'mysql2/promise';

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'Si82monG@))$', // <-- Replace this with your actual MySQL root password
      port: 3306,
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS vialifecoach;');
    console.log('Database "vialifecoach" created or already exists.');

    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
  }
}

createDatabase();

import 'dotenv/config.js';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function createCoordinatorsTable() {
  try {
    console.log('🔧 Creating coordinators table...\n');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS coordinators (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        department VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createTableQuery);
    console.log('✅ Coordinators table created successfully!\n');

    // Create index on email for faster lookups
    await pool.query('CREATE INDEX IF NOT EXISTS idx_coordinators_email ON coordinators(email)');
    console.log('✅ Email index created!\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createCoordinatorsTable();

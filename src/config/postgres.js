import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.PG_USER || process.env.DB_USER,
  host: process.env.PG_HOST || process.env.DB_HOST,
  database: process.env.PG_DATABASE || process.env.DB_NAME,
  password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
  port: Number(process.env.PG_PORT || process.env.DB_PORT || 5432),
});

pool.on('connect', () => console.log('PostgreSQL connected'));
pool.on('error', (err) => console.error('PostgreSQL connection error:', err.message));

import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const connectionString =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PG_CONNECTION_STRING ||
  process.env.DATABASE_URI ||
  process.env.POSTGRES_CONNECTION_STRING ||
  null;

const hasExplicitPoolConfig =
  Boolean(connectionString) ||
  Boolean(process.env.PG_USER || process.env.DB_USER) ||
  Boolean(process.env.PG_HOST || process.env.DB_HOST) ||
  Boolean(process.env.PG_DATABASE || process.env.DB_NAME) ||
  Boolean(process.env.PG_PASSWORD || process.env.DB_PASSWORD);

const sslMode = String(
  process.env.PGSSLMODE ||
    process.env.DB_SSL ||
    process.env.POSTGRES_SSL ||
    ''
).toLowerCase();

const useSsl =
  sslMode === 'disable' || sslMode === 'false' || sslMode === '0'
    ? false
    : sslMode === 'require' || sslMode === 'true' || sslMode === '1'
      ? { rejectUnauthorized: false }
      : connectionString && (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true')
        ? { rejectUnauthorized: false }
        : false;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: useSsl,
      max: Number(process.env.PG_POOL_MAX || 10),
    }
  : {
      user: process.env.PG_USER || process.env.DB_USER,
      host: process.env.PG_HOST || process.env.DB_HOST,
      database: process.env.PG_DATABASE || process.env.DB_NAME,
      password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
      port: Number(process.env.PG_PORT || process.env.DB_PORT || 5432),
      ssl: useSsl,
      max: Number(process.env.PG_POOL_MAX || 10),
    };

export const hasDatabaseConfig = hasExplicitPoolConfig;
export const pool = new Pool(poolConfig);

if (!hasDatabaseConfig) {
  console.warn(
    'PostgreSQL configuration is missing. Set DATABASE_URL or PG/DB_* env vars to enable database access.'
  );
}

pool.on('connect', () => console.log('PostgreSQL connected'));
pool.on('error', (err) => console.error('PostgreSQL connection error:', err.message));

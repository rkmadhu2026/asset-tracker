import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL?.trim();

export const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 2_000,
      }
    : {
        host: process.env.PG_HOST || 'localhost',
        port: Number(process.env.PG_PORT) || 5432,
        database: process.env.PG_DATABASE || 'argus',
        user: process.env.PG_USER || 'argus',
        password: process.env.PG_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 2_000,
      },
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

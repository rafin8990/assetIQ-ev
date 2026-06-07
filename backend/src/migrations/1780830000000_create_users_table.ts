import pool from '../utils/dbClient';

export const name = '1780830000000_create_users_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      mobile_no VARCHAR(50),
      email VARCHAR(255),
      image TEXT,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user'
        CHECK (role IN ('super_admin', 'admin', 'user')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
    ON users (email) WHERE email IS NOT NULL;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_no_unique_idx
    ON users (mobile_no) WHERE mobile_no IS NOT NULL;
  `);
};

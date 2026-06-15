import pool from '../utils/dbClient';

export const name = '1781507306220_create_location_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS locations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location_code VARCHAR(50),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS locations_name_idx
    ON locations (name);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS locations_location_code_idx
    ON locations (location_code);
  `);
};

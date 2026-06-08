import pool from '../utils/dbClient';

export const name = '1780832000000_create_vendors_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id SERIAL PRIMARY KEY,
      vendor_name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255),
      mobile_number VARCHAR(50),
      email VARCHAR(255),
      image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendors_vendor_name_idx
    ON vendors (vendor_name);
  `);
};

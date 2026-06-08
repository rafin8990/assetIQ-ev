import pool from '../utils/dbClient';

export const name = '1780835000000_create_stocks_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stocks (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL UNIQUE REFERENCES items(id) ON DELETE RESTRICT,
      quantity NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS stocks_item_id_idx ON stocks (item_id);
  `);
};

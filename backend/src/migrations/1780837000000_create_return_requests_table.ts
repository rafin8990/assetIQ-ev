import pool from '../utils/dbClient';

export const name = '1780837000000_create_return_requests_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS return_requests (
      id SERIAL PRIMARY KEY,
      return_id VARCHAR(50) NOT NULL UNIQUE,
      out_request_id INTEGER NOT NULL REFERENCES out_requests(id) ON DELETE RESTRICT,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'cancelled')),
      requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS return_request_items (
      id SERIAL PRIMARY KEY,
      return_request_id INTEGER NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
      out_request_item_id INTEGER NOT NULL REFERENCES out_request_items(id) ON DELETE RESTRICT,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      return_quantity NUMERIC NOT NULL CHECK (return_quantity > 0),
      unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (return_request_id, item_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS return_requests_status_idx
    ON return_requests (status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS return_requests_requested_by_idx
    ON return_requests (requested_by);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS return_requests_out_request_id_idx
    ON return_requests (out_request_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS return_request_items_return_request_id_idx
    ON return_request_items (return_request_id);
  `);
};

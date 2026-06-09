import pool from '../utils/dbClient';

export const name = '1780836000000_create_out_requests_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS out_requests (
      id SERIAL PRIMARY KEY,
      request_id VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'cancelled', 'out')),
      requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      out_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS out_request_items (
      id SERIAL PRIMARY KEY,
      out_request_id INTEGER NOT NULL REFERENCES out_requests(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      requested_quantity NUMERIC NOT NULL CHECK (requested_quantity > 0),
      out_quantity NUMERIC CHECK (out_quantity IS NULL OR out_quantity >= 0),
      unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'partial', 'out')),
      out_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (out_request_id, item_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS out_requests_status_idx
    ON out_requests (status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS out_requests_requested_by_idx
    ON out_requests (requested_by);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS out_request_items_out_request_id_idx
    ON out_request_items (out_request_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS out_request_items_status_idx
    ON out_request_items (status);
  `);
};

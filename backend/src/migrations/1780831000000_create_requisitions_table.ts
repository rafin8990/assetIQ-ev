import pool from '../utils/dbClient';

export const name = '1780831000000_create_requisitions_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requisitions (
      id SERIAL PRIMARY KEY,
      req_id VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'cancelled')),
      attachment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS requisition_items (
      id SERIAL PRIMARY KEY,
      requisition_id INTEGER NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      quantity NUMERIC NOT NULL CHECK (quantity > 0),
      unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (requisition_id, item_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS requisition_items_requisition_id_idx
    ON requisition_items (requisition_id);
  `);
};

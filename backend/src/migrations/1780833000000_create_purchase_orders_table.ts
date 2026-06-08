import pool from '../utils/dbClient';

export const name = '1780833000000_create_purchase_orders_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      po_number VARCHAR(50) NOT NULL UNIQUE,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'cancelled', 'received')),
      total_amount NUMERIC,
      paid_amount NUMERIC,
      due_amount NUMERIC,
      discount_amount NUMERIC,
      attachment TEXT,
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      order_type VARCHAR(50) NOT NULL DEFAULT 'by_requisition'
        CHECK (order_type IN ('by_requisition', 'direct')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS po_items (
      id SERIAL PRIMARY KEY,
      po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      quantity NUMERIC NOT NULL CHECK (quantity > 0),
      unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
      per_unit_amount NUMERIC,
      total_amount NUMERIC,
      discount_amount NUMERIC,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (po_id, item_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS po_items_po_id_idx ON po_items (po_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS purchase_orders_status_idx ON purchase_orders (status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS purchase_orders_order_type_idx
    ON purchase_orders (order_type);
  `);
};

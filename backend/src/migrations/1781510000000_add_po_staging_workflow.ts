import pool from '../utils/dbClient';

export const name = '1781510000000_add_po_staging_workflow';

export const run = async () => {
  await pool.query(`
    ALTER TABLE purchase_orders
    DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
  `);

  await pool.query(`
    ALTER TABLE purchase_orders
    ADD CONSTRAINT purchase_orders_status_check
    CHECK (status IN (
      'pending', 'approved', 'cancelled', 'received',
      'in_staging', 'partially_received', 'fully_received'
    ));
  `);

  await pool.query(`
    ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS staged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS staged_at TIMESTAMPTZ;
  `);

  await pool.query(`
    ALTER TABLE po_items
    ADD COLUMN IF NOT EXISTS received_quantity NUMERIC NOT NULL DEFAULT 0
      CHECK (received_quantity >= 0),
    ADD COLUMN IF NOT EXISTS returned_quantity NUMERIC NOT NULL DEFAULT 0
      CHECK (returned_quantity >= 0);
  `);

  await pool.query(`
    ALTER TABLE po_items
    DROP CONSTRAINT IF EXISTS po_items_returned_lte_received_check;
  `);

  await pool.query(`
    ALTER TABLE po_items
    ADD CONSTRAINT po_items_returned_lte_received_check
    CHECK (returned_quantity <= received_quantity);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS po_vendor_returns (
      id SERIAL PRIMARY KEY,
      po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      po_item_id INTEGER NOT NULL REFERENCES po_items(id) ON DELETE CASCADE,
      quantity NUMERIC NOT NULL CHECK (quantity > 0),
      reason TEXT NOT NULL,
      returned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS po_vendor_returns_po_id_idx
    ON po_vendor_returns (po_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS po_vendor_returns_po_item_id_idx
    ON po_vendor_returns (po_item_id);
  `);
};

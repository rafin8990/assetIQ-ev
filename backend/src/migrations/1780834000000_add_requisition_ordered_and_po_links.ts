import pool from '../utils/dbClient';

export const name = '1780834000000_add_requisition_ordered_and_po_links';

export const run = async () => {
  await pool.query(`
    ALTER TABLE requisitions
    DROP CONSTRAINT IF EXISTS requisitions_status_check;
  `);

  await pool.query(`
    ALTER TABLE requisitions
    ADD CONSTRAINT requisitions_status_check
    CHECK (status IN ('pending', 'approved', 'cancelled', 'ordered'));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_order_requisitions (
      id SERIAL PRIMARY KEY,
      po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      requisition_id INTEGER NOT NULL UNIQUE REFERENCES requisitions(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS purchase_order_requisitions_po_id_idx
    ON purchase_order_requisitions (po_id);
  `);
};

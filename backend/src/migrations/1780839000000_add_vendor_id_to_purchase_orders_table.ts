import pool from '../utils/dbClient';

export const name = '1780839000000_add_vendor_id_to_purchase_orders_table';

export const run = async () => {
  await pool.query(`
    ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS purchase_orders_vendor_id_idx
    ON purchase_orders (vendor_id);
  `);
};

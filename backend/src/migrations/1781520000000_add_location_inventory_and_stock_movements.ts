import pool from '../utils/dbClient';

export const name = '1781520000000_add_location_inventory_and_stock_movements';

export const run = async () => {
  await pool.query(`
    ALTER TABLE po_items
    ADD COLUMN IF NOT EXISTS accepted_quantity NUMERIC NOT NULL DEFAULT 0
      CHECK (accepted_quantity >= 0);
  `);

  await pool.query(`
    ALTER TABLE po_items
    DROP CONSTRAINT IF EXISTS po_items_accepted_lte_staging_check;
  `);

  await pool.query(`
    ALTER TABLE po_items
    ADD CONSTRAINT po_items_accepted_lte_staging_check
    CHECK (accepted_quantity <= received_quantity - returned_quantity);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_lots (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
      vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
      po_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
      po_item_id INTEGER REFERENCES po_items(id) ON DELETE SET NULL,
      quantity NUMERIC NOT NULL CHECK (quantity > 0),
      quantity_remaining NUMERIC NOT NULL CHECK (quantity_remaining >= 0),
      unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
      source_type VARCHAR(50) NOT NULL
        CHECK (source_type IN ('po_accept', 'manual', 'transfer', 'return')),
      source_id INTEGER,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS stock_lots_location_item_vendor_received_idx
    ON stock_lots (location_id, item_id, vendor_id, received_at);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS stock_lots_vendor_id_idx ON stock_lots (vendor_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS stock_lots_po_id_idx ON stock_lots (po_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_lot_consumptions (
      id SERIAL PRIMARY KEY,
      lot_id INTEGER NOT NULL REFERENCES stock_lots(id) ON DELETE RESTRICT,
      quantity NUMERIC NOT NULL CHECK (quantity > 0),
      consumption_type VARCHAR(50) NOT NULL
        CHECK (consumption_type IN ('out_request', 'transfer', 'adjustment')),
      consumption_id INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS stock_lot_consumptions_lot_id_idx
    ON stock_lot_consumptions (lot_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      movement_number VARCHAR(50) NOT NULL UNIQUE,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'ready', 'in_transit', 'completed', 'cancelled')),
      source_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
      destination_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
      notes TEXT,
      requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ready_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      transferred_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_movement_items (
      id SERIAL PRIMARY KEY,
      movement_id INTEGER NOT NULL REFERENCES stock_movements(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      requested_quantity NUMERIC NOT NULL CHECK (requested_quantity > 0),
      ready_quantity NUMERIC NOT NULL DEFAULT 0 CHECK (ready_quantity >= 0),
      transferred_quantity NUMERIC NOT NULL DEFAULT 0 CHECK (transferred_quantity >= 0),
      confirmed_quantity NUMERIC NOT NULL DEFAULT 0 CHECK (confirmed_quantity >= 0),
      unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN (
          'pending', 'partial_ready', 'ready', 'partial_transit',
          'in_transit', 'partial_confirmed', 'completed'
        )),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (movement_id, item_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS stock_movements_status_idx ON stock_movements (status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS stock_movement_items_movement_id_idx
    ON stock_movement_items (movement_id);
  `);

  await pool.query(`
    ALTER TABLE out_requests
    ADD COLUMN IF NOT EXISTS source_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL;
  `);

  const defaultLocation = await pool.query<{ id: number }>(
    `INSERT INTO locations (name, location_code)
     SELECT 'Main Warehouse', 'location-000'
     WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Main Warehouse')
     RETURNING id`
  );

  let defaultLocationId = defaultLocation.rows[0]?.id;

  if (!defaultLocationId) {
    const existing = await pool.query<{ id: number }>(
      `SELECT id FROM locations ORDER BY id ASC LIMIT 1`
    );
    defaultLocationId = existing.rows[0]?.id;
  }

  if (defaultLocationId) {
    await pool.query(
      `UPDATE out_requests SET source_location_id = $1 WHERE source_location_id IS NULL`,
      [defaultLocationId]
    );

    const legacyStocks = await pool.query<{
      item_id: number;
      quantity: string;
      unit_id: number | null;
    }>(`SELECT item_id, quantity, unit_id FROM stocks WHERE quantity > 0`);

    for (const row of legacyStocks.rows) {
      const existingLot = await pool.query(
        `SELECT id FROM stock_lots
         WHERE item_id = $1 AND location_id = $2 AND source_type = 'manual' AND source_id IS NULL
         LIMIT 1`,
        [row.item_id, defaultLocationId]
      );

      if (existingLot.rows.length) continue;

      await pool.query(
        `INSERT INTO stock_lots (
          item_id, location_id, vendor_id, quantity, quantity_remaining,
          unit_id, source_type, source_id
        ) VALUES ($1, $2, NULL, $3, $3, $4, 'manual', NULL)`,
        [row.item_id, defaultLocationId, row.quantity, row.unit_id]
      );
    }
  }
};

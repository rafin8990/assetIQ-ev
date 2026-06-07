import pool from '../utils/dbClient';

export const name = '1780829533419_create_items_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sub_category_id INTEGER REFERENCES sub_categories(id) ON DELETE SET NULL,
      description TEXT,
      brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
      model VARCHAR(255),
      type VARCHAR(255),
      material VARCHAR(255),
      unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
      low_stock_amount NUMERIC,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS item_images (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      image TEXT
    );
  `);
};

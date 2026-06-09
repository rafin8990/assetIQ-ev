import pool from '../utils/dbClient';
import { ALL_PERMISSION_KEYS } from '../app/modules/permissions/permissions.constant';

export const name = '1780838000000_create_user_permissions_table';

export const run = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission_key VARCHAR(120) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, permission_key)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS user_permissions_user_id_idx
    ON user_permissions (user_id);
  `);

  const adminResult = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE role = 'admin'`
  );

  for (const admin of adminResult.rows) {
    for (const key of ALL_PERMISSION_KEYS) {
      await pool.query(
        `
        INSERT INTO user_permissions (user_id, permission_key)
        VALUES ($1, $2)
        ON CONFLICT (user_id, permission_key) DO NOTHING
        `,
        [admin.id, key]
      );
    }
  }

  const userResult = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE role = 'user'`
  );

  for (const user of userResult.rows) {
    await pool.query(
      `
      INSERT INTO user_permissions (user_id, permission_key)
      VALUES ($1, 'route.dashboard')
      ON CONFLICT (user_id, permission_key) DO NOTHING
      `,
      [user.id]
    );
  }
};

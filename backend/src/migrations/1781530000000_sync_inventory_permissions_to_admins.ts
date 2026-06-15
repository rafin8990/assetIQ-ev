import pool from '../utils/dbClient';
import { ALL_PERMISSION_KEYS } from '../app/modules/permissions/permissions.constant';

export const name = '1781530000000_sync_inventory_permissions_to_admins';

export const run = async () => {
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
};

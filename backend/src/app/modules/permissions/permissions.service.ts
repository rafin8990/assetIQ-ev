import httpStatus from 'http-status';

import { ENUM_USER_ROLE } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import pool from '../../../utils/dbClient';
import { UsersService } from '../users/users.service';
import {
  ACTION_PERMISSIONS,
  PERMISSION_DEFINITIONS,
  ROUTE_PERMISSIONS,
  VALID_PERMISSION_KEY_SET,
} from './permissions.constant';
import {
  IPermissionGroup,
  IPermissionsRegistry,
  IUserPermissionsPayload,
} from './permissions.interface';

const isSuperAdmin = (role: string) => role === ENUM_USER_ROLE.SUPER_ADMIN;

const getUserPermissionKeys = async (userId: number): Promise<string[]> => {
  const result = await pool.query<{ permission_key: string }>(
    `SELECT permission_key FROM user_permissions WHERE user_id = $1 ORDER BY permission_key`,
    [userId]
  );

  return result.rows.map(row => row.permission_key);
};

const hasPermission = async (
  userId: number,
  role: string,
  permissionKey: string
): Promise<boolean> => {
  if (isSuperAdmin(role)) {
    return true;
  }

  const result = await pool.query<{ exists: boolean }>(
    `
    SELECT EXISTS(
      SELECT 1 FROM user_permissions
      WHERE user_id = $1 AND permission_key = $2
    ) AS exists
    `,
    [userId, permissionKey]
  );

  return result.rows[0]?.exists ?? false;
};

const hasAnyPermission = async (
  userId: number,
  role: string,
  permissionKeys: string[]
): Promise<boolean> => {
  if (isSuperAdmin(role)) {
    return true;
  }

  if (permissionKeys.length === 0) {
    return false;
  }

  const result = await pool.query<{ exists: boolean }>(
    `
    SELECT EXISTS(
      SELECT 1 FROM user_permissions
      WHERE user_id = $1 AND permission_key = ANY($2::text[])
    ) AS exists
    `,
    [userId, permissionKeys]
  );

  return result.rows[0]?.exists ?? false;
};

const getPermissionsRegistry = (): IPermissionsRegistry => {
  const groupNames = [...new Set(PERMISSION_DEFINITIONS.map(p => p.group))];

  const groups: IPermissionGroup[] = groupNames.map(group => ({
    group,
    routes: ROUTE_PERMISSIONS.filter(p => p.group === group),
    actions: ACTION_PERMISSIONS.filter(p => p.group === group),
  }));

  return {
    groups,
    allKeys: PERMISSION_DEFINITIONS.map(p => p.key),
  };
};

const getUserPermissions = async (userId: number): Promise<string[]> => {
  await UsersService.getSingleUser(userId);
  return getUserPermissionKeys(userId);
};

const setUserPermissions = async (
  userId: number,
  payload: IUserPermissionsPayload
): Promise<string[]> => {
  const user = await UsersService.getSingleUser(userId);

  if (isSuperAdmin(user.role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot modify permissions for super admin users'
    );
  }

  const invalidKeys = payload.permissionKeys.filter(
    key => !VALID_PERMISSION_KEY_SET.has(key)
  );

  if (invalidKeys.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid permission keys: ${invalidKeys.join(', ')}`
    );
  }

  const uniqueKeys = [...new Set(payload.permissionKeys)];

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM user_permissions WHERE user_id = $1`, [
      userId,
    ]);

    for (const key of uniqueKeys) {
      await client.query(
        `INSERT INTO user_permissions (user_id, permission_key) VALUES ($1, $2)`,
        [userId, key]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return uniqueKeys;
};

const assertPermission = async (
  userId: number,
  role: string,
  permissionKey: string
): Promise<void> => {
  const allowed = await hasPermission(userId, role, permissionKey);

  if (!allowed) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
};

export const PermissionsService = {
  getUserPermissionKeys,
  hasPermission,
  hasAnyPermission,
  getPermissionsRegistry,
  getUserPermissions,
  setUserPermissions,
  assertPermission,
  isSuperAdmin,
};

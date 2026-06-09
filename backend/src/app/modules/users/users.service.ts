import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';

import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { ALL_PERMISSION_KEYS } from '../permissions/permissions.constant';
import { PermissionsService } from '../permissions/permissions.service';
import {
  USER_PUBLIC_FIELDS,
  USERS_SORTABLE_FIELDS,
} from './users.constant';
import {
  ICreateUserPayload,
  IUser,
  IUserFilters,
  IUserWithPassword,
  IUpdateUserPayload,
} from './users.interface';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, Number(config.bycrypt_salt_rounds) || 12);
};

const buildWhereClause = (filters: IUserFilters) => {
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(name ILIKE $${index} OR email ILIKE $${index} OR mobile_no ILIKE $${index})`
    );
  }

  if (filters.role) {
    values.push(filters.role);
    conditions.push(`role = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  return { whereClause, values };
};

const createUser = async (payload: ICreateUserPayload): Promise<IUser> => {
  const hashedPassword = await hashPassword(payload.password);

  const result = await pool.query<IUser>(
    `INSERT INTO users (name, mobile_no, email, image, password, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${USER_PUBLIC_FIELDS}`,
    [
      payload.name,
      payload.mobile_no ?? null,
      payload.email ?? null,
      payload.image ?? null,
      hashedPassword,
      payload.role,
    ]
  );

  const user = result.rows[0];

  if (payload.role === ENUM_USER_ROLE.ADMIN) {
    await PermissionsService.setUserPermissions(user.id, {
      permissionKeys: ALL_PERMISSION_KEYS,
    });
  } else if (payload.role === ENUM_USER_ROLE.USER) {
    await PermissionsService.setUserPermissions(user.id, {
      permissionKeys: ['route.dashboard'],
    });
  }

  return user;
};

const getAllUsers = async (
  filters: IUserFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = USERS_SORTABLE_FIELDS.includes(
    sortBy as (typeof USERS_SORTABLE_FIELDS)[number]
  )
    ? sortBy
    : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const { whereClause, values } = buildWhereClause(filters);

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IUser>(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  return {
    meta: {
      page,
      limit,
      total,
      ...paginationHelpers.calculatePaginationMetadata(page, limit, total),
    },
    data: dataResult.rows,
  };
};

const getAdminUsers = async (
  filters: Omit<IUserFilters, 'role'>,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = USERS_SORTABLE_FIELDS.includes(
    sortBy as (typeof USERS_SORTABLE_FIELDS)[number]
  )
    ? sortBy
    : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [
    [ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN],
  ];
  const conditions = [`role = ANY($1::text[])`];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(name ILIKE $${index} OR email ILIKE $${index} OR mobile_no ILIKE $${index})`
    );
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IUser>(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  return {
    meta: {
      page,
      limit,
      total,
      ...paginationHelpers.calculatePaginationMetadata(page, limit, total),
    },
    data: dataResult.rows,
  };
};

const getSingleUser = async (id: number): Promise<IUser> => {
  const result = await pool.query<IUser>(
    `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return result.rows[0];
};

const findUserByIdentifier = async (
  identifier: string
): Promise<IUserWithPassword | null> => {
  const result = await pool.query<IUserWithPassword>(
    `SELECT * FROM users WHERE email = $1 OR mobile_no = $1 LIMIT 1`,
    [identifier.trim()]
  );

  return result.rows[0] ?? null;
};

const getUserWithPasswordById = async (
  id: number
): Promise<IUserWithPassword> => {
  const result = await pool.query<IUserWithPassword>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return result.rows[0];
};

const updateUser = async (
  id: number,
  payload: IUpdateUserPayload
): Promise<IUser> => {
  await getSingleUser(id);

  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.name !== undefined) {
    values.push(payload.name);
    fields.push(`name = $${values.length}`);
  }

  if (payload.mobile_no !== undefined) {
    values.push(payload.mobile_no);
    fields.push(`mobile_no = $${values.length}`);
  }

  if (payload.email !== undefined) {
    values.push(payload.email);
    fields.push(`email = $${values.length}`);
  }

  if (payload.image !== undefined) {
    values.push(payload.image);
    fields.push(`image = $${values.length}`);
  }

  if (payload.role !== undefined) {
    values.push(payload.role);
    fields.push(`role = $${values.length}`);
  }

  if (payload.password) {
    values.push(await hashPassword(payload.password));
    fields.push(`password = $${values.length}`);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await pool.query<IUser>(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING ${USER_PUBLIC_FIELDS}`,
    values
  );

  return result.rows[0];
};

const deleteUser = async (id: number): Promise<IUser> => {
  await getSingleUser(id);

  const result = await pool.query<IUser>(
    `DELETE FROM users WHERE id = $1 RETURNING ${USER_PUBLIC_FIELDS}`,
    [id]
  );

  return result.rows[0];
};

export const UsersService = {
  createUser,
  getAllUsers,
  getAdminUsers,
  getSingleUser,
  findUserByIdentifier,
  getUserWithPasswordById,
  updateUser,
  deleteUser,
};

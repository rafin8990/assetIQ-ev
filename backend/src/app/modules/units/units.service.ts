import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { UNITS_SORTABLE_FIELDS } from './units.constant';
import {
  ICreateUnitPayload,
  IUnit,
  IUnitFilters,
  IUpdateUnitPayload,
} from './units.interface';

const createUnit = async (payload: ICreateUnitPayload): Promise<IUnit> => {
  const result = await pool.query<IUnit>(
    `INSERT INTO units (name) VALUES ($1) RETURNING *`,
    [payload.name]
  );

  return result.rows[0];
};

const getAllUnits = async (
  filters: IUnitFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = UNITS_SORTABLE_FIELDS.includes(
    sortBy as (typeof UNITS_SORTABLE_FIELDS)[number]
  )
    ? sortBy
    : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  let whereClause = '';

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    whereClause = `WHERE name ILIKE $${values.length}`;
  }

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM units ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IUnit>(
    `SELECT * FROM units ${whereClause}
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

const getSingleUnit = async (id: number): Promise<IUnit> => {
  const result = await pool.query<IUnit>(
    `SELECT * FROM units WHERE id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Unit not found');
  }

  return result.rows[0];
};

const updateUnit = async (
  id: number,
  payload: IUpdateUnitPayload
): Promise<IUnit> => {
  await getSingleUnit(id);

  const result = await pool.query<IUnit>(
    `UPDATE units
     SET name = COALESCE($1, name), updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [payload.name ?? null, id]
  );

  return result.rows[0];
};

const deleteUnit = async (id: number): Promise<IUnit> => {
  await getSingleUnit(id);

  const result = await pool.query<IUnit>(
    `DELETE FROM units WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

export const UnitsService = {
  createUnit,
  getAllUnits,
  getSingleUnit,
  updateUnit,
  deleteUnit,
};

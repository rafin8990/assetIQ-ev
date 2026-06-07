import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { BRANDS_SORTABLE_FIELDS } from './brands.constant';
import {
  IBrand,
  IBrandFilters,
  ICreateBrandPayload,
  IUpdateBrandPayload,
} from './brands.interface';

const createBrand = async (payload: ICreateBrandPayload): Promise<IBrand> => {
  const result = await pool.query<IBrand>(
    `INSERT INTO brands (name, slug, image) VALUES ($1, $2, $3) RETURNING *`,
    [payload.name, payload.slug ?? null, payload.image ?? null]
  );

  return result.rows[0];
};

const getAllBrands = async (
  filters: IBrandFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = BRANDS_SORTABLE_FIELDS.includes(
    sortBy as (typeof BRANDS_SORTABLE_FIELDS)[number]
  )
    ? sortBy
    : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  let whereClause = '';

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    whereClause = `WHERE name ILIKE $${values.length} OR slug ILIKE $${values.length}`;
  }

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM brands ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IBrand>(
    `SELECT * FROM brands ${whereClause}
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

const getSingleBrand = async (id: number): Promise<IBrand> => {
  const result = await pool.query<IBrand>(
    `SELECT * FROM brands WHERE id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Brand not found');
  }

  return result.rows[0];
};

const updateBrand = async (
  id: number,
  payload: IUpdateBrandPayload
): Promise<IBrand> => {
  await getSingleBrand(id);

  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.name !== undefined) {
    values.push(payload.name);
    fields.push(`name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'slug')) {
    values.push(payload.slug ?? null);
    fields.push(`slug = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'image')) {
    values.push(payload.image ?? null);
    fields.push(`image = $${values.length}`);
  }

  if (!fields.length) {
    return getSingleBrand(id);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await pool.query<IBrand>(
    `UPDATE brands
     SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteBrand = async (id: number): Promise<IBrand> => {
  await getSingleBrand(id);

  const result = await pool.query<IBrand>(
    `DELETE FROM brands WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

export const BrandsService = {
  createBrand,
  getAllBrands,
  getSingleBrand,
  updateBrand,
  deleteBrand,
};

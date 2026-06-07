import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { CATEGORIES_SORTABLE_FIELDS } from './categories.constant';
import {
  ICategory,
  ICategoryFilters,
  ICreateCategoryPayload,
  IUpdateCategoryPayload,
} from './categories.interface';

const createCategory = async (
  payload: ICreateCategoryPayload
): Promise<ICategory> => {
  const result = await pool.query<ICategory>(
    `INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *`,
    [payload.name, payload.slug ?? null]
  );

  return result.rows[0];
};

const getAllCategories = async (
  filters: ICategoryFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = CATEGORIES_SORTABLE_FIELDS.includes(
    sortBy as (typeof CATEGORIES_SORTABLE_FIELDS)[number]
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
    `SELECT COUNT(*) FROM categories ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<ICategory>(
    `SELECT * FROM categories ${whereClause}
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

const getSingleCategory = async (id: number): Promise<ICategory> => {
  const result = await pool.query<ICategory>(
    `SELECT * FROM categories WHERE id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  return result.rows[0];
};

const updateCategory = async (
  id: number,
  payload: IUpdateCategoryPayload
): Promise<ICategory> => {
  await getSingleCategory(id);

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

  if (!fields.length) {
    return getSingleCategory(id);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await pool.query<ICategory>(
    `UPDATE categories
     SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteCategory = async (id: number): Promise<ICategory> => {
  await getSingleCategory(id);

  const result = await pool.query<ICategory>(
    `DELETE FROM categories WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

export const CategoriesService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};

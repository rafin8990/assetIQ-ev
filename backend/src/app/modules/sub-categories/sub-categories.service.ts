import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { CategoriesService } from '../categories/categories.service';
import {
  SUB_CATEGORIES_SORTABLE_FIELDS,
  SUB_CATEGORIES_SORT_COLUMN_MAP,
} from './sub-categories.constant';
import {
  ICreateSubCategoryPayload,
  ISubCategory,
  ISubCategoryFilters,
  ISubCategoryWithCategory,
  IUpdateSubCategoryPayload,
} from './sub-categories.interface';

const ensureCategoryExists = async (categoryId: number) => {
  await CategoriesService.getSingleCategory(categoryId);
};

const createSubCategory = async (
  payload: ICreateSubCategoryPayload
): Promise<ISubCategory> => {
  await ensureCategoryExists(payload.category_id);

  const result = await pool.query<ISubCategory>(
    `INSERT INTO sub_categories (name, slug, category_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [payload.name, payload.slug ?? null, payload.category_id]
  );

  return result.rows[0];
};

const getAllSubCategories = async (
  filters: ISubCategoryFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = SUB_CATEGORIES_SORTABLE_FIELDS.includes(
    sortBy as (typeof SUB_CATEGORIES_SORTABLE_FIELDS)[number]
  )
    ? SUB_CATEGORIES_SORT_COLUMN_MAP[
        sortBy as keyof typeof SUB_CATEGORIES_SORT_COLUMN_MAP
      ]
    : SUB_CATEGORIES_SORT_COLUMN_MAP.created_at;
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(sc.name ILIKE $${index} OR sc.slug ILIKE $${index} OR c.name ILIKE $${index})`
    );
  }

  if (filters.categoryId) {
    values.push(filters.categoryId);
    conditions.push(`sc.category_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM sub_categories sc
     INNER JOIN categories c ON c.id = sc.category_id
     ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<ISubCategoryWithCategory>(
    `SELECT sc.id, sc.name, sc.slug, sc.category_id, sc.created_at, sc.updated_at,
            c.name AS category_name
     FROM sub_categories sc
     INNER JOIN categories c ON c.id = sc.category_id
     ${whereClause}
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

const getSingleSubCategory = async (id: number): Promise<ISubCategoryWithCategory> => {
  const result = await pool.query<ISubCategoryWithCategory>(
    `SELECT sc.id, sc.name, sc.slug, sc.category_id, sc.created_at, sc.updated_at,
            c.name AS category_name
     FROM sub_categories sc
     INNER JOIN categories c ON c.id = sc.category_id
     WHERE sc.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sub category not found');
  }

  return result.rows[0];
};

const updateSubCategory = async (
  id: number,
  payload: IUpdateSubCategoryPayload
): Promise<ISubCategory> => {
  await getSingleSubCategory(id);

  if (payload.category_id !== undefined) {
    await ensureCategoryExists(payload.category_id);
  }

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

  if (payload.category_id !== undefined) {
    values.push(payload.category_id);
    fields.push(`category_id = $${values.length}`);
  }

  if (!fields.length) {
    const existing = await getSingleSubCategory(id);
    return existing;
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await pool.query<ISubCategory>(
    `UPDATE sub_categories
     SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

const deleteSubCategory = async (id: number): Promise<ISubCategory> => {
  await getSingleSubCategory(id);

  const result = await pool.query<ISubCategory>(
    `DELETE FROM sub_categories WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

export const SubCategoriesService = {
  createSubCategory,
  getAllSubCategories,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory,
};

import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { generateLocationCode } from '../../../helpers/locationCodeHelper';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { LOCATIONS_SORTABLE_FIELDS } from './locations.constant';
import {
  ICreateLocationPayload,
  ILocation,
  ILocationFilters,
  IUpdateLocationPayload,
} from './locations.interface';

const createLocation = async (
  payload: ICreateLocationPayload
): Promise<ILocation> => {
  const locationCode = await generateLocationCode();

  const result = await pool.query<ILocation>(
    `INSERT INTO locations (name, location_code) VALUES ($1, $2) RETURNING *`,
    [payload.name, locationCode]
  );

  return result.rows[0];
};

const getAllLocations = async (
  filters: ILocationFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = LOCATIONS_SORTABLE_FIELDS.includes(
    sortBy as (typeof LOCATIONS_SORTABLE_FIELDS)[number]
  )
    ? sortBy
    : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  let whereClause = '';

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    whereClause = `WHERE name ILIKE $${values.length} OR location_code ILIKE $${values.length}`;
  }

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM locations ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<ILocation>(
    `SELECT * FROM locations ${whereClause}
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

const getSingleLocation = async (id: number): Promise<ILocation> => {
  const result = await pool.query<ILocation>(
    `SELECT * FROM locations WHERE id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Location not found');
  }

  return result.rows[0];
};

const updateLocation = async (
  id: number,
  payload: IUpdateLocationPayload
): Promise<ILocation> => {
  await getSingleLocation(id);

  const result = await pool.query<ILocation>(
    `UPDATE locations
     SET name = COALESCE($1, name), updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [payload.name ?? null, id]
  );

  return result.rows[0];
};

const deleteLocation = async (id: number): Promise<ILocation> => {
  await getSingleLocation(id);

  const result = await pool.query<ILocation>(
    `DELETE FROM locations WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

export const LocationsService = {
  createLocation,
  getAllLocations,
  getSingleLocation,
  updateLocation,
  deleteLocation,
};

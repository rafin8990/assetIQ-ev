import fs from 'fs';
import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { getVendorImageDiskPath } from '../../middlewares/uploadVendorImage';
import { VENDORS_SORTABLE_FIELDS } from './vendors.constant';
import {
  ICreateVendorPayload,
  IUpdateVendorPayload,
  IVendor,
  IVendorFilters,
} from './vendors.interface';

const removeVendorImageFile = (imagePath: string | null | undefined) => {
  if (!imagePath) return;

  const filePath = getVendorImageDiskPath(imagePath);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const createVendor = async (
  payload: ICreateVendorPayload,
  imagePath: string | null = null
): Promise<IVendor> => {
  try {
    const result = await pool.query<IVendor>(
      `INSERT INTO vendors (
        vendor_name, company_name, mobile_number, email, image
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        payload.vendor_name,
        payload.company_name ?? null,
        payload.mobile_number ?? null,
        payload.email ?? null,
        imagePath,
      ]
    );

    return result.rows[0];
  } catch (error) {
    if (imagePath) {
      removeVendorImageFile(imagePath);
    }
    throw error;
  }
};

const getAllVendors = async (
  filters: IVendorFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = VENDORS_SORTABLE_FIELDS.includes(
    sortBy as (typeof VENDORS_SORTABLE_FIELDS)[number]
  )
    ? sortBy
    : 'created_at';
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  let whereClause = '';

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    whereClause = `WHERE vendor_name ILIKE $${index}
      OR company_name ILIKE $${index}
      OR email ILIKE $${index}
      OR mobile_number ILIKE $${index}`;
  }

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM vendors ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IVendor>(
    `SELECT * FROM vendors ${whereClause}
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

const getSingleVendor = async (id: number): Promise<IVendor> => {
  const result = await pool.query<IVendor>(
    `SELECT * FROM vendors WHERE id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  return result.rows[0];
};

const updateVendor = async (
  id: number,
  payload: IUpdateVendorPayload,
  imagePath?: string | null
): Promise<IVendor> => {
  const existing = await getSingleVendor(id);
  let oldImageToRemove: string | null = null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.vendor_name !== undefined) {
    values.push(payload.vendor_name);
    fields.push(`vendor_name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'company_name')) {
    values.push(payload.company_name ?? null);
    fields.push(`company_name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'mobile_number')) {
    values.push(payload.mobile_number ?? null);
    fields.push(`mobile_number = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
    values.push(payload.email ?? null);
    fields.push(`email = $${values.length}`);
  }

  if (imagePath !== undefined) {
    if (existing.image && existing.image !== imagePath) {
      oldImageToRemove = existing.image;
    }
    values.push(imagePath ?? null);
    fields.push(`image = $${values.length}`);
  } else if (Object.prototype.hasOwnProperty.call(payload, 'image')) {
    if (existing.image && payload.image !== existing.image) {
      oldImageToRemove = existing.image;
    }
    values.push(payload.image ?? null);
    fields.push(`image = $${values.length}`);
  }

  if (!fields.length) {
    return existing;
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  try {
    const result = await pool.query<IVendor>(
      `UPDATE vendors
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (oldImageToRemove) {
      removeVendorImageFile(oldImageToRemove);
    }

    return result.rows[0];
  } catch (error) {
    if (imagePath) {
      removeVendorImageFile(imagePath);
    }
    throw error;
  }
};

const deleteVendor = async (id: number): Promise<IVendor> => {
  const vendor = await getSingleVendor(id);

  const result = await pool.query<IVendor>(
    `DELETE FROM vendors WHERE id = $1 RETURNING *`,
    [id]
  );

  removeVendorImageFile(vendor.image);

  return result.rows[0];
};

export const VendorsService = {
  createVendor,
  getAllVendors,
  getSingleVendor,
  updateVendor,
  deleteVendor,
};

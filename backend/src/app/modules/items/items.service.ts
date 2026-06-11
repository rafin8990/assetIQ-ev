import fs from 'fs';
import httpStatus from 'http-status';
import * as XLSX from 'xlsx';

import ApiError from '../../../errors/ApiError';
import { getItemImageDiskPath } from '../../middlewares/uploadImage';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { BrandsService } from '../brands/brands.service';
import { CategoriesService } from '../categories/categories.service';
import { SubCategoriesService } from '../sub-categories/sub-categories.service';
import { UnitsService } from '../units/units.service';
import {
  BULK_IMPORT_TEMPLATE_HEADERS,
  ITEMS_SORTABLE_FIELDS,
  ITEMS_SORT_COLUMN_MAP,
} from './items.constant';
import {
  IBulkImportResult,
  IBulkImportRow,
  ICreateItemPayload,
  IItem,
  IItemFilters,
  IItemImage,
  IItemWithRelations,
  IUpdateItemPayload,
} from './items.interface';

const ITEM_SELECT_FIELDS = `
  i.id, i.name, i.category_id, i.sub_category_id, i.description,
  i.brand_id, i.model, i.type, i.material, i.unit_id, i.low_stock_amount,
  i.created_at, i.updated_at,
  c.name AS category_name,
  sc.name AS sub_category_name,
  b.name AS brand_name,
  u.name AS unit_name
`;

const ITEM_JOINS = `
  FROM items i
  LEFT JOIN categories c ON c.id = i.category_id
  LEFT JOIN sub_categories sc ON sc.id = i.sub_category_id
  LEFT JOIN brands b ON b.id = i.brand_id
  LEFT JOIN units u ON u.id = i.unit_id
`;

const ensureCategoryExists = async (categoryId: number) => {
  await CategoriesService.getSingleCategory(categoryId);
};

const ensureSubCategoryExists = async (subCategoryId: number) => {
  await SubCategoriesService.getSingleSubCategory(subCategoryId);
};

const ensureBrandExists = async (brandId: number) => {
  await BrandsService.getSingleBrand(brandId);
};

const ensureUnitExists = async (unitId: number) => {
  await UnitsService.getSingleUnit(unitId);
};

const validateRelations = async (payload: {
  category_id?: number | null;
  sub_category_id?: number | null;
  brand_id?: number | null;
  unit_id?: number | null;
}) => {
  if (payload.category_id) {
    await ensureCategoryExists(payload.category_id);
  }

  if (payload.sub_category_id) {
    const subCategory = await SubCategoriesService.getSingleSubCategory(
      payload.sub_category_id
    );

    if (
      payload.category_id &&
      subCategory.category_id !== payload.category_id
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Sub category does not belong to the selected category'
      );
    }
  }

  if (payload.brand_id) {
    await ensureBrandExists(payload.brand_id);
  }

  if (payload.unit_id) {
    await ensureUnitExists(payload.unit_id);
  }
};

const getItemImages = async (itemId: number): Promise<IItemImage[]> => {
  const result = await pool.query<IItemImage>(
    `SELECT id, item_id, image FROM item_images WHERE item_id = $1 ORDER BY id ASC`,
    [itemId]
  );

  return result.rows;
};

const insertItemImages = async (
  itemId: number,
  imagePaths: string[]
): Promise<IItemImage[]> => {
  if (!imagePaths.length) return [];

  const inserted: IItemImage[] = [];

  for (const imagePath of imagePaths) {
    const result = await pool.query<IItemImage>(
      `INSERT INTO item_images (item_id, image) VALUES ($1, $2) RETURNING *`,
      [itemId, imagePath]
    );
    inserted.push(result.rows[0]);
  }

  return inserted;
};

const createItem = async (
  payload: ICreateItemPayload,
  imagePaths: string[] = []
): Promise<IItemWithRelations> => {
  await validateRelations(payload);

  const result = await pool.query<IItem>(
    `INSERT INTO items (
      name, category_id, sub_category_id, description, brand_id,
      model, type, material, unit_id, low_stock_amount
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      payload.name,
      payload.category_id ?? null,
      payload.sub_category_id ?? null,
      payload.description ?? null,
      payload.brand_id ?? null,
      payload.model ?? null,
      payload.type ?? null,
      payload.material ?? null,
      payload.unit_id ?? null,
      payload.low_stock_amount ?? null,
    ]
  );

  const item = result.rows[0];
  const images = await insertItemImages(item.id, imagePaths);

  const withRelations = await getSingleItem(item.id);
  return { ...withRelations, images };
};

const getAllItems = async (
  filters: IItemFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = ITEMS_SORTABLE_FIELDS.includes(
    sortBy as (typeof ITEMS_SORTABLE_FIELDS)[number]
  )
    ? ITEMS_SORT_COLUMN_MAP[
        sortBy as keyof typeof ITEMS_SORT_COLUMN_MAP
      ]
    : ITEMS_SORT_COLUMN_MAP.created_at;
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(i.name ILIKE $${index} OR i.model ILIKE $${index} OR i.type ILIKE $${index} OR i.material ILIKE $${index} OR c.name ILIKE $${index} OR sc.name ILIKE $${index} OR b.name ILIKE $${index})`
    );
  }

  if (filters.categoryId) {
    values.push(filters.categoryId);
    conditions.push(`i.category_id = $${values.length}`);
  }

  if (filters.subCategoryId) {
    values.push(filters.subCategoryId);
    conditions.push(`i.sub_category_id = $${values.length}`);
  }

  if (filters.brandId) {
    values.push(filters.brandId);
    conditions.push(`i.brand_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) ${ITEM_JOINS} ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IItemWithRelations>(
    `SELECT ${ITEM_SELECT_FIELDS}
     ${ITEM_JOINS}
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

const getSingleItem = async (id: number): Promise<IItemWithRelations> => {
  const result = await pool.query<IItemWithRelations>(
    `SELECT ${ITEM_SELECT_FIELDS}
     ${ITEM_JOINS}
     WHERE i.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Item not found');
  }

  const images = await getItemImages(id);
  return { ...result.rows[0], images };
};

const updateItem = async (
  id: number,
  payload: IUpdateItemPayload
): Promise<IItemWithRelations> => {
  const existing = await getSingleItem(id);

  const nextRelations = {
    category_id:
      payload.category_id !== undefined
        ? payload.category_id
        : existing.category_id,
    sub_category_id:
      payload.sub_category_id !== undefined
        ? payload.sub_category_id
        : existing.sub_category_id,
    brand_id:
      payload.brand_id !== undefined ? payload.brand_id : existing.brand_id,
    unit_id:
      payload.unit_id !== undefined ? payload.unit_id : existing.unit_id,
  };

  await validateRelations(nextRelations);

  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.name !== undefined) {
    values.push(payload.name);
    fields.push(`name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'category_id')) {
    values.push(payload.category_id ?? null);
    fields.push(`category_id = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'sub_category_id')) {
    values.push(payload.sub_category_id ?? null);
    fields.push(`sub_category_id = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    values.push(payload.description ?? null);
    fields.push(`description = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'brand_id')) {
    values.push(payload.brand_id ?? null);
    fields.push(`brand_id = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'model')) {
    values.push(payload.model ?? null);
    fields.push(`model = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'type')) {
    values.push(payload.type ?? null);
    fields.push(`type = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'material')) {
    values.push(payload.material ?? null);
    fields.push(`material = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'unit_id')) {
    values.push(payload.unit_id ?? null);
    fields.push(`unit_id = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'low_stock_amount')) {
    values.push(payload.low_stock_amount ?? null);
    fields.push(`low_stock_amount = $${values.length}`);
  }

  if (fields.length) {
    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE items SET ${fields.join(', ')} WHERE id = $${values.length}`,
      values
    );
  }

  return getSingleItem(id);
};

const deleteItem = async (id: number): Promise<IItem> => {
  const item = await getSingleItem(id);
  const images = item.images ?? [];

  const result = await pool.query<IItem>(
    `DELETE FROM items WHERE id = $1 RETURNING *`,
    [id]
  );

  for (const image of images) {
    if (image.image) {
      removeImageFile(image.image);
    }
  }

  return result.rows[0];
};

const removeImageFile = (imagePath: string) => {
  const filePath = getItemImageDiskPath(imagePath);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const addItemImages = async (
  itemId: number,
  imagePaths: string[]
): Promise<IItemWithRelations> => {
  await getSingleItem(itemId);
  await insertItemImages(itemId, imagePaths);
  return getSingleItem(itemId);
};

const deleteItemImage = async (
  itemId: number,
  imageId: number
): Promise<IItemWithRelations> => {
  await getSingleItem(itemId);

  const result = await pool.query<IItemImage>(
    `DELETE FROM item_images WHERE id = $1 AND item_id = $2 RETURNING *`,
    [imageId, itemId]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Item image not found');
  }

  if (result.rows[0].image) {
    removeImageFile(result.rows[0].image);
  }

  return getSingleItem(itemId);
};

const normalizeBulkRow = (row: Record<string, unknown>): IBulkImportRow | null => {
  const name = String(row.name ?? row.Name ?? '').trim();
  if (!name) return null;

  const parseNum = (value: unknown) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const parseStr = (value: unknown) => {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    name,
    category_id: parseNum(row.category_id ?? row.categoryId),
    sub_category_id: parseNum(row.sub_category_id ?? row.subCategoryId),
    description: parseStr(row.description),
    brand_id: parseNum(row.brand_id ?? row.brandId),
    model: parseStr(row.model),
    type: parseStr(row.type),
    material: parseStr(row.material),
    unit_id: parseNum(row.unit_id ?? row.unitId),
    low_stock_amount: parseNum(row.low_stock_amount ?? row.lowStockAmount),
  };
};

const bulkImportItems = async (buffer: Buffer): Promise<IBulkImportResult> => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Excel file has no sheets');
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName]
  );

  const result: IBulkImportResult = {
    created: 0,
    failed: 0,
    errors: [],
  };

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const normalized = normalizeBulkRow(rows[index]);

    if (!normalized) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        message: 'Name is required',
      });
      continue;
    }

    try {
      await createItem(normalized);
      result.created += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        message:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Failed to import row',
      });
    }
  }

  return result;
};

const generateBulkImportTemplate = (): Buffer => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...BULK_IMPORT_TEMPLATE_HEADERS],
    [
      'Sample Item',
      1,
      1,
      'Optional description',
      1,
      'Model-X',
      'Type-A',
      'Steel',
      1,
      10,
    ],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};

export const ItemsService = {
  createItem,
  getAllItems,
  getSingleItem,
  updateItem,
  deleteItem,
  addItemImages,
  deleteItemImage,
  bulkImportItems,
  generateBulkImportTemplate,
};

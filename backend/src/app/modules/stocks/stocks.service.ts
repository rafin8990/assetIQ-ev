import httpStatus from 'http-status';
import XLSX from 'xlsx';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { ItemsService } from '../items/items.service';
import { UnitsService } from '../units/units.service';
import {
  BULK_STOCK_TEMPLATE_HEADERS,
  STOCKS_SORTABLE_FIELDS,
  STOCKS_SORT_COLUMN_MAP,
} from './stocks.constant';
import {
  IBulkStockImportResult,
  ICreateManualStockPayload,
  IStockFilters,
  IStockDecreaseItem,
  IStockIncreaseItem,
  IStockWithRelations,
  IUpdateStockPayload,
} from './stocks.interface';

type DbClient = { query: typeof pool.query };

const STOCK_SELECT_FIELDS = `
  s.id, s.item_id, s.quantity, s.unit_id, s.created_at, s.updated_at,
  i.name AS item_name,
  u.name AS unit_name
`;

const STOCK_JOINS = `
  FROM stocks s
  LEFT JOIN items i ON i.id = s.item_id
  LEFT JOIN units u ON u.id = s.unit_id
`;

const increaseStockForItem = async (
  client: DbClient,
  item: IStockIncreaseItem
) => {
  const quantity = Number(item.quantity);

  if (Number.isNaN(quantity) || quantity <= 0) {
    return;
  }

  const updated = await client.query(
    `UPDATE stocks
     SET quantity = quantity + $2,
         unit_id = COALESCE($3, unit_id),
         updated_at = NOW()
     WHERE item_id = $1`,
    [item.item_id, quantity, item.unit_id ?? null]
  );

  if (updated.rowCount) {
    return;
  }

  await client.query(
    `INSERT INTO stocks (item_id, quantity, unit_id)
     VALUES ($1, $2, $3)`,
    [item.item_id, quantity, item.unit_id ?? null]
  );
};

const decreaseStockForItem = async (
  client: DbClient,
  item: IStockDecreaseItem
) => {
  const quantity = Number(item.quantity);

  if (Number.isNaN(quantity) || quantity <= 0) {
    return;
  }

  const updated = await client.query(
    `UPDATE stocks
     SET quantity = quantity - $2,
         updated_at = NOW()
     WHERE item_id = $1 AND quantity >= $2`,
    [item.item_id, quantity]
  );

  if (!updated.rowCount) {
    const stock = await getStockByItemId(item.item_id);
    const available = stock ? Number(stock.quantity) : 0;

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Insufficient stock for item id ${item.item_id}. Available: ${available}, requested: ${quantity}`
    );
  }
};

const decreaseStockFromOutRequestItems = async (
  client: DbClient,
  items: IStockDecreaseItem[]
) => {
  for (const item of items) {
    await decreaseStockForItem(client, item);
  }
};

const increaseStockFromReturnItems = async (
  client: DbClient,
  items: IStockIncreaseItem[]
) => {
  for (const item of items) {
    await increaseStockForItem(client, item);
  }
};

const increaseStockFromPurchaseOrderItems = async (
  client: DbClient,
  items: IStockIncreaseItem[]
) => {
  const merged = new Map<number, IStockIncreaseItem>();

  for (const item of items) {
    const existing = merged.get(item.item_id);

    if (existing) {
      existing.quantity = Number(existing.quantity) + Number(item.quantity);
      if (!existing.unit_id && item.unit_id) {
        existing.unit_id = item.unit_id;
      }
    } else {
      merged.set(item.item_id, {
        item_id: item.item_id,
        quantity: Number(item.quantity),
        unit_id: item.unit_id ?? null,
      });
    }
  }

  for (const item of merged.values()) {
    await increaseStockForItem(client, item);
  }
};

const getAllStocks = async (
  filters: IStockFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = STOCKS_SORTABLE_FIELDS.includes(
    sortBy as (typeof STOCKS_SORTABLE_FIELDS)[number]
  )
    ? STOCKS_SORT_COLUMN_MAP[
        sortBy as keyof typeof STOCKS_SORT_COLUMN_MAP
      ]
    : STOCKS_SORT_COLUMN_MAP.updated_at;
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(`(i.name ILIKE $${index} OR u.name ILIKE $${index})`);
  }

  if (filters.itemId) {
    values.push(filters.itemId);
    conditions.push(`s.item_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) ${STOCK_JOINS} ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IStockWithRelations>(
    `SELECT ${STOCK_SELECT_FIELDS}
     ${STOCK_JOINS}
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

const getSingleStock = async (id: number): Promise<IStockWithRelations> => {
  const result = await pool.query<IStockWithRelations>(
    `SELECT ${STOCK_SELECT_FIELDS}
     ${STOCK_JOINS}
     WHERE s.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Stock not found');
  }

  return result.rows[0];
};

const getStockByItemId = async (
  itemId: number
): Promise<IStockWithRelations | null> => {
  const result = await pool.query<IStockWithRelations>(
    `SELECT ${STOCK_SELECT_FIELDS}
     ${STOCK_JOINS}
     WHERE s.item_id = $1`,
    [itemId]
  );

  return result.rows[0] ?? null;
};

const validateManualStockRefs = async (payload: ICreateManualStockPayload) => {
  await ItemsService.getSingleItem(payload.item_id);

  if (payload.unit_id) {
    await UnitsService.getSingleUnit(payload.unit_id);
  }
};

const addManualStock = async (
  payload: ICreateManualStockPayload
): Promise<IStockWithRelations> => {
  await validateManualStockRefs(payload);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await increaseStockForItem(client, payload);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const stock = await getStockByItemId(payload.item_id);

  if (!stock) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update stock');
  }

  return stock;
};

const parseBulkNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeBulkStockRow = (row: Record<string, unknown>) => {
  const itemId = parseBulkNumber(row.item_id ?? row.itemId);
  const quantity = parseBulkNumber(row.quantity);
  const unitId = parseBulkNumber(row.unit_id ?? row.unitId);

  if (!itemId || !quantity) {
    return null;
  }

  return {
    item_id: itemId,
    quantity,
    unit_id: unitId,
  } satisfies ICreateManualStockPayload;
};

const bulkImportStock = async (buffer: Buffer): Promise<IBulkStockImportResult> => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Import file has no sheets');
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName]
  );

  const result: IBulkStockImportResult = {
    processed: 0,
    failed: 0,
    errors: [],
  };

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const normalized = normalizeBulkStockRow(rows[index]);

    if (!normalized) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        message: 'item_id and quantity are required',
      });
      continue;
    }

    try {
      await addManualStock(normalized);
      result.processed += 1;
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

const updateStock = async (
  id: number,
  payload: IUpdateStockPayload
): Promise<IStockWithRelations> => {
  await getSingleStock(id);

  if (payload.unit_id) {
    await UnitsService.getSingleUnit(payload.unit_id);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.quantity !== undefined) {
    values.push(payload.quantity);
    fields.push(`quantity = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'unit_id')) {
    values.push(payload.unit_id ?? null);
    fields.push(`unit_id = $${values.length}`);
  }

  if (!fields.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No fields to update');
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  await pool.query(
    `UPDATE stocks SET ${fields.join(', ')} WHERE id = $${values.length}`,
    values
  );

  return getSingleStock(id);
};

const deleteStock = async (id: number): Promise<IStockWithRelations> => {
  const stock = await getSingleStock(id);

  await pool.query(`DELETE FROM stocks WHERE id = $1`, [id]);

  return stock;
};

const generateBulkImportTemplate = (): Buffer => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...BULK_STOCK_TEMPLATE_HEADERS],
    [1, 25, 1],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};

export const StocksService = {
  increaseStockFromPurchaseOrderItems,
  increaseStockFromReturnItems,
  decreaseStockFromOutRequestItems,
  addManualStock,
  updateStock,
  deleteStock,
  bulkImportStock,
  generateBulkImportTemplate,
  getAllStocks,
  getSingleStock,
  getStockByItemId,
};

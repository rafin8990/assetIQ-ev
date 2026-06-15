import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { ItemsService } from '../items/items.service';
import { LocationsService } from '../locations/locations.service';
import { UnitsService } from '../units/units.service';
import { VendorsService } from '../vendors/vendors.service';
import {
  IConsumedLotChunk,
  ICreateManualLotPayload,
  ICreateStockLotPayload,
  IInventoryFilters,
  ILocationStockRow,
  StockLotConsumptionType,
  IStockLotWithRelations,
  ITotalStockLocationBreakdown,
  ITotalStockRow,
} from './inventory.interface';

type DbClient = { query: typeof pool.query };

const getAvailableQuantity = async (
  locationId: number,
  itemId: number,
  vendorId?: number | null
): Promise<number> => {
  const values: unknown[] = [locationId, itemId];
  let vendorClause = '';

  if (vendorId !== undefined && vendorId !== null) {
    values.push(vendorId);
    vendorClause = ` AND vendor_id = $${values.length}`;
  }

  const result = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(quantity_remaining), 0) AS total
     FROM stock_lots
     WHERE location_id = $1 AND item_id = $2 AND quantity_remaining > 0${vendorClause}`,
    values
  );

  return Number(result.rows[0]?.total ?? 0);
};

const getTotalAvailableQuantity = async (
  itemId: number,
  vendorId?: number | null
): Promise<number> => {
  const values: unknown[] = [itemId];
  let vendorClause = '';

  if (vendorId !== undefined && vendorId !== null) {
    values.push(vendorId);
    vendorClause = ` AND vendor_id = $${values.length}`;
  }

  const result = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(quantity_remaining), 0) AS total
     FROM stock_lots
     WHERE item_id = $1 AND quantity_remaining > 0${vendorClause}`,
    values
  );

  return Number(result.rows[0]?.total ?? 0);
};

const createLots = async (
  client: DbClient,
  lots: ICreateStockLotPayload[]
): Promise<IStockLotWithRelations[]> => {
  const created: IStockLotWithRelations[] = [];

  for (const lot of lots) {
    const qty = Number(lot.quantity);
    if (qty <= 0) continue;

    const result = await client.query<IStockLotWithRelations>(
      `INSERT INTO stock_lots (
        item_id, location_id, vendor_id, po_id, po_item_id,
        quantity, quantity_remaining, unit_id, source_type, source_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9)
      RETURNING *`,
      [
        lot.item_id,
        lot.location_id,
        lot.vendor_id ?? null,
        lot.po_id ?? null,
        lot.po_item_id ?? null,
        qty,
        lot.unit_id ?? null,
        lot.source_type,
        lot.source_id ?? null,
      ]
    );

    created.push(result.rows[0]);
  }

  return created;
};

const consumeLotsFifo = async (
  client: DbClient,
  params: {
    locationId: number;
    itemId: number;
    quantity: number;
    consumptionType: StockLotConsumptionType;
    consumptionId: number;
    vendorId?: number | null;
  }
): Promise<IConsumedLotChunk[]> => {
  const qtyNeeded = Number(params.quantity);
  if (qtyNeeded <= 0) return [];

  const values: unknown[] = [params.locationId, params.itemId];
  let vendorClause = '';

  if (params.vendorId !== undefined && params.vendorId !== null) {
    values.push(params.vendorId);
    vendorClause = ` AND vendor_id = $${values.length}`;
  }

  const lotsResult = await client.query<{
    id: number;
    quantity_remaining: string;
    vendor_id: number | null;
    po_id: number | null;
    po_item_id: number | null;
    unit_id: number | null;
  }>(
    `SELECT id, quantity_remaining, vendor_id, po_id, po_item_id, unit_id
     FROM stock_lots
     WHERE location_id = $1 AND item_id = $2 AND quantity_remaining > 0${vendorClause}
     ORDER BY received_at ASC, id ASC
     FOR UPDATE`,
    values
  );

  let remaining = qtyNeeded;
  const consumed: IConsumedLotChunk[] = [];

  for (const lot of lotsResult.rows) {
    if (remaining <= 0) break;

    const available = Number(lot.quantity_remaining);
    const take = Math.min(available, remaining);

    await client.query(
      `UPDATE stock_lots
       SET quantity_remaining = quantity_remaining - $1, updated_at = NOW()
       WHERE id = $2`,
      [take, lot.id]
    );

    await client.query(
      `INSERT INTO stock_lot_consumptions (lot_id, quantity, consumption_type, consumption_id)
       VALUES ($1, $2, $3, $4)`,
      [lot.id, take, params.consumptionType, params.consumptionId]
    );

    consumed.push({
      lot_id: lot.id,
      quantity: take,
      vendor_id: lot.vendor_id,
      po_id: lot.po_id,
      po_item_id: lot.po_item_id,
      unit_id: lot.unit_id,
    });

    remaining -= take;
  }

  if (remaining > 0) {
    const available = await getAvailableQuantity(
      params.locationId,
      params.itemId,
      params.vendorId
    );
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Insufficient stock at location for item ${params.itemId}. Available: ${available}, requested: ${qtyNeeded}`
    );
  }

  return consumed;
};

const buildInventoryWhere = (
  filters: IInventoryFilters,
  options: { requireLocation?: boolean } = {}
) => {
  const values: unknown[] = [];
  const conditions: string[] = ['sl.quantity_remaining > 0'];

  if (options.requireLocation) {
    if (!filters.locationId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'locationId is required');
    }
    values.push(filters.locationId);
    conditions.push(`sl.location_id = $${values.length}`);
  } else if (filters.locationId) {
    values.push(filters.locationId);
    conditions.push(`sl.location_id = $${values.length}`);
  }

  if (filters.itemId) {
    values.push(filters.itemId);
    conditions.push(`sl.item_id = $${values.length}`);
  }

  if (filters.vendorId) {
    values.push(filters.vendorId);
    conditions.push(`sl.vendor_id = $${values.length}`);
  }

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(i.name ILIKE $${index} OR v.vendor_name ILIKE $${index} OR v.company_name ILIKE $${index} OR l.name ILIKE $${index})`
    );
  }

  return { values, whereClause: `WHERE ${conditions.join(' AND ')}` };
};

const getLocationStock = async (
  filters: IInventoryFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { values, whereClause } = buildInventoryWhere(filters, {
    requireLocation: true,
  });

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM (
      SELECT sl.location_id, sl.item_id, sl.vendor_id
      FROM stock_lots sl
      LEFT JOIN items i ON i.id = sl.item_id
      LEFT JOIN vendors v ON v.id = sl.vendor_id
      LEFT JOIN locations l ON l.id = sl.location_id
      ${whereClause}
      GROUP BY sl.location_id, sl.item_id, sl.vendor_id, sl.unit_id
    ) grouped`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<ILocationStockRow>(
    `SELECT
      sl.location_id,
      l.name AS location_name,
      l.location_code,
      sl.item_id,
      i.name AS item_name,
      sl.vendor_id,
      v.vendor_name,
      v.company_name AS vendor_company_name,
      SUM(sl.quantity_remaining) AS quantity,
      sl.unit_id,
      u.name AS unit_name
     FROM stock_lots sl
     LEFT JOIN items i ON i.id = sl.item_id
     LEFT JOIN vendors v ON v.id = sl.vendor_id
     LEFT JOIN locations l ON l.id = sl.location_id
     LEFT JOIN units u ON u.id = sl.unit_id
     ${whereClause}
     GROUP BY sl.location_id, l.name, l.location_code, sl.item_id, i.name,
              sl.vendor_id, v.vendor_name, v.company_name, sl.unit_id, u.name
     ORDER BY i.name ASC, v.vendor_name ASC NULLS LAST
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
    data: dataResult.rows.map(row => ({
      ...row,
      quantity: Number(row.quantity),
    })),
  };
};

const getTotalStock = async (
  filters: IInventoryFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { values, whereClause } = buildInventoryWhere(filters);

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM (
      SELECT sl.item_id, sl.vendor_id
      FROM stock_lots sl
      LEFT JOIN items i ON i.id = sl.item_id
      LEFT JOIN vendors v ON v.id = sl.vendor_id
      LEFT JOIN locations l ON l.id = sl.location_id
      ${whereClause}
      GROUP BY sl.item_id, sl.vendor_id, sl.unit_id
    ) grouped`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<ITotalStockRow>(
    `SELECT
      sl.item_id,
      i.name AS item_name,
      sl.vendor_id,
      v.vendor_name,
      v.company_name AS vendor_company_name,
      SUM(sl.quantity_remaining) AS quantity,
      sl.unit_id,
      u.name AS unit_name
     FROM stock_lots sl
     LEFT JOIN items i ON i.id = sl.item_id
     LEFT JOIN vendors v ON v.id = sl.vendor_id
     LEFT JOIN locations l ON l.id = sl.location_id
     LEFT JOIN units u ON u.id = sl.unit_id
     ${whereClause}
     GROUP BY sl.item_id, i.name, sl.vendor_id, v.vendor_name, v.company_name,
              sl.unit_id, u.name
     ORDER BY i.name ASC, v.vendor_name ASC NULLS LAST
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
    data: dataResult.rows.map(row => ({
      ...row,
      quantity: Number(row.quantity),
    })),
  };
};

const getTotalStockLocationBreakdown = async (
  itemId: number,
  vendorId?: number | null
): Promise<ITotalStockLocationBreakdown[]> => {
  const values: unknown[] = [itemId];
  let vendorClause = '';

  if (vendorId !== undefined && vendorId !== null) {
    values.push(vendorId);
    vendorClause = ` AND sl.vendor_id = $${values.length}`;
  } else if (vendorId === null) {
    vendorClause = ' AND sl.vendor_id IS NULL';
  }

  const result = await pool.query<ITotalStockLocationBreakdown>(
    `SELECT sl.location_id, l.name AS location_name,
            SUM(sl.quantity_remaining) AS quantity
     FROM stock_lots sl
     LEFT JOIN locations l ON l.id = sl.location_id
     WHERE sl.item_id = $1 AND sl.quantity_remaining > 0${vendorClause}
     GROUP BY sl.location_id, l.name
     ORDER BY l.name ASC`,
    values
  );

  return result.rows.map(row => ({
    ...row,
    quantity: Number(row.quantity),
  }));
};

const getLots = async (filters: IInventoryFilters) => {
  const { values, whereClause } = buildInventoryWhere(filters);

  const result = await pool.query<IStockLotWithRelations>(
    `SELECT
      sl.id, sl.item_id, sl.location_id, sl.vendor_id, sl.po_id, sl.po_item_id,
      sl.quantity, sl.quantity_remaining, sl.unit_id, sl.source_type, sl.source_id,
      sl.received_at, sl.created_at, sl.updated_at,
      i.name AS item_name,
      u.name AS unit_name,
      v.vendor_name,
      v.company_name AS vendor_company_name,
      l.name AS location_name,
      l.location_code,
      po.po_number
     FROM stock_lots sl
     LEFT JOIN items i ON i.id = sl.item_id
     LEFT JOIN units u ON u.id = sl.unit_id
     LEFT JOIN vendors v ON v.id = sl.vendor_id
     LEFT JOIN locations l ON l.id = sl.location_id
     LEFT JOIN purchase_orders po ON po.id = sl.po_id
     ${whereClause}
     ORDER BY sl.received_at ASC, sl.id ASC`,
    values
  );

  return result.rows.map(row => ({
    ...row,
    quantity: Number(row.quantity),
    quantity_remaining: Number(row.quantity_remaining),
  }));
};

const addManualLot = async (payload: ICreateManualLotPayload) => {
  await ItemsService.getSingleItem(payload.item_id);
  await LocationsService.getSingleLocation(payload.location_id);

  if (payload.unit_id) {
    await UnitsService.getSingleUnit(payload.unit_id);
  }

  if (payload.vendor_id) {
    await VendorsService.getSingleVendor(payload.vendor_id);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const lots = await createLots(client, [
      {
        ...payload,
        source_type: 'manual',
      },
    ]);
    await client.query('COMMIT');
    return lots[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const decreaseFromOutRequestItems = async (
  client: DbClient,
  locationId: number,
  outRequestId: number,
  items: Array<{ item_id: number; quantity: number }>
) => {
  for (const item of items) {
    await consumeLotsFifo(client, {
      locationId,
      itemId: item.item_id,
      quantity: item.quantity,
      consumptionType: 'out_request',
      consumptionId: outRequestId,
    });
  }
};

const increaseFromReturnItems = async (
  client: DbClient,
  locationId: number,
  returnRequestId: number,
  outRequestId: number,
  items: Array<{
    item_id: number;
    quantity: number;
    unit_id?: number | null;
  }>
) => {
  for (const item of items) {
    const consumptions = await client.query<{
      quantity: string;
      vendor_id: number | null;
      po_id: number | null;
      po_item_id: number | null;
      unit_id: number | null;
    }>(
      `SELECT slc.quantity, sl.vendor_id, sl.po_id, sl.po_item_id, sl.unit_id
       FROM stock_lot_consumptions slc
       JOIN stock_lots sl ON sl.id = slc.lot_id
       WHERE slc.consumption_type = 'out_request'
         AND slc.consumption_id = $1
         AND sl.item_id = $2
       ORDER BY slc.created_at DESC, slc.id DESC`,
      [outRequestId, item.item_id]
    );

    let remaining = Number(item.quantity);
    const lotsToCreate: ICreateStockLotPayload[] = [];

    for (const cons of consumptions.rows) {
      if (remaining <= 0) break;

      const restore = Math.min(Number(cons.quantity), remaining);
      lotsToCreate.push({
        item_id: item.item_id,
        location_id: locationId,
        vendor_id: cons.vendor_id,
        po_id: cons.po_id,
        po_item_id: cons.po_item_id,
        quantity: restore,
        unit_id: cons.unit_id ?? item.unit_id ?? null,
        source_type: 'return',
        source_id: returnRequestId,
      });
      remaining -= restore;
    }

    if (remaining > 0) {
      lotsToCreate.push({
        item_id: item.item_id,
        location_id: locationId,
        vendor_id: null,
        quantity: remaining,
        unit_id: item.unit_id ?? null,
        source_type: 'return',
        source_id: returnRequestId,
      });
    }

    await createLots(client, lotsToCreate);
  }
};

export const InventoryService = {
  getAvailableQuantity,
  getTotalAvailableQuantity,
  createLots,
  consumeLotsFifo,
  getLocationStock,
  getTotalStock,
  getTotalStockLocationBreakdown,
  getLots,
  addManualLot,
  decreaseFromOutRequestItems,
  increaseFromReturnItems,
};

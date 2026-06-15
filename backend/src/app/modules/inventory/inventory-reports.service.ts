import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import pool from '../../../utils/dbClient';
import {
  IDailyMovementReport,
  IDateRangeMovementReport,
  IInventoryMovementReportSummary,
  IMainStockUpdateReport,
  IMainStockUpdateReportSummary,
  IMonthwiseMovementReport,
  IUserWiseMovementReport,
} from './inventory-reports.interface';

const MAIN_WAREHOUSE_NAME = 'Main Warehouse';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const parseDateOnly = (value: string, fieldName: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${fieldName} must be in YYYY-MM-DD format`
    );
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid ${fieldName}`);
  }

  return value;
};

const toNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0);

const buildMovementSummary = (rows: {
  movement_count: string | number;
  item_count?: string | number;
  total_requested_quantity: string | number | null;
  total_confirmed_quantity: string | number | null;
}): IInventoryMovementReportSummary => ({
  movement_count: Number(rows.movement_count ?? 0),
  item_count:
    rows.item_count !== undefined ? Number(rows.item_count ?? 0) : undefined,
  total_requested_quantity: toNumber(rows.total_requested_quantity),
  total_confirmed_quantity: toNumber(rows.total_confirmed_quantity),
});

const buildMainStockSummary = (rows: {
  entry_count: string | number;
  item_count?: string | number;
  total_quantity: string | number | null;
}): IMainStockUpdateReportSummary => ({
  entry_count: Number(rows.entry_count ?? 0),
  item_count:
    rows.item_count !== undefined ? Number(rows.item_count ?? 0) : undefined,
  total_quantity: toNumber(rows.total_quantity),
});

const getMainWarehouseId = async (): Promise<number> => {
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM locations WHERE name = $1 LIMIT 1`,
    [MAIN_WAREHOUSE_NAME]
  );

  if (!result.rows[0]) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `${MAIN_WAREHOUSE_NAME} location not found`
    );
  }

  return result.rows[0].id;
};

const getDailyMovementReport = async (
  date: string
): Promise<IDailyMovementReport> => {
  const reportDate = parseDateOnly(date, 'date');

  const itemsResult = await pool.query<{
    movement_number: string;
    movement_date: Date;
    movement_status: string;
    source_location_name: string | null;
    destination_location_name: string | null;
    item_name: string | null;
    requested_quantity: string;
    confirmed_quantity: string | null;
    unit_name: string | null;
    requested_by_name: string | null;
  }>(
    `SELECT
      sm.movement_number,
      sm.created_at AS movement_date,
      sm.status AS movement_status,
      src.name AS source_location_name,
      dest.name AS destination_location_name,
      i.name AS item_name,
      smi.requested_quantity,
      smi.confirmed_quantity,
      u.name AS unit_name,
      requester.name AS requested_by_name
     FROM stock_movements sm
     INNER JOIN stock_movement_items smi ON smi.movement_id = sm.id
     LEFT JOIN locations src ON src.id = sm.source_location_id
     LEFT JOIN locations dest ON dest.id = sm.destination_location_id
     LEFT JOIN items i ON i.id = smi.item_id
     LEFT JOIN units u ON u.id = smi.unit_id
     LEFT JOIN users requester ON requester.id = sm.requested_by
     WHERE sm.created_at::date = $1::date
       AND sm.status <> 'cancelled'
     ORDER BY sm.created_at ASC, smi.id ASC`,
    [reportDate]
  );

  const summaryResult = await pool.query<{
    movement_count: string;
    item_count: string;
    total_requested_quantity: string | null;
    total_confirmed_quantity: string | null;
  }>(
    `SELECT
      COUNT(DISTINCT sm.id)::text AS movement_count,
      COUNT(smi.id)::text AS item_count,
      COALESCE(SUM(smi.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(smi.confirmed_quantity), 0)::text AS total_confirmed_quantity
     FROM stock_movements sm
     INNER JOIN stock_movement_items smi ON smi.movement_id = sm.id
     WHERE sm.created_at::date = $1::date
       AND sm.status <> 'cancelled'`,
    [reportDate]
  );

  return {
    date: reportDate,
    items: itemsResult.rows.map(row => ({
      movement_number: row.movement_number,
      movement_date: row.movement_date.toISOString(),
      movement_status: row.movement_status,
      source_location_name: row.source_location_name,
      destination_location_name: row.destination_location_name,
      item_name: row.item_name,
      requested_quantity: Number(row.requested_quantity),
      confirmed_quantity:
        row.confirmed_quantity !== null
          ? Number(row.confirmed_quantity)
          : null,
      unit_name: row.unit_name,
      requested_by_name: row.requested_by_name,
    })),
    summary: buildMovementSummary(summaryResult.rows[0] ?? { movement_count: 0 }),
  };
};

const getDateRangeMovementReport = async (
  fromDate: string,
  toDate: string
): Promise<IDateRangeMovementReport> => {
  const from = parseDateOnly(fromDate, 'fromDate');
  const to = parseDateOnly(toDate, 'toDate');

  if (from > to) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromDate must be on or before toDate'
    );
  }

  const movementsResult = await pool.query<{
    id: number;
    movement_number: string;
    created_at: Date;
    status: string;
    source_location_name: string | null;
    destination_location_name: string | null;
    item_count: string;
    total_requested_quantity: string | null;
    total_confirmed_quantity: string | null;
    requested_by_name: string | null;
  }>(
    `SELECT
      sm.id,
      sm.movement_number,
      sm.created_at,
      sm.status,
      src.name AS source_location_name,
      dest.name AS destination_location_name,
      COUNT(smi.id)::text AS item_count,
      COALESCE(SUM(smi.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(smi.confirmed_quantity), 0)::text AS total_confirmed_quantity,
      requester.name AS requested_by_name
     FROM stock_movements sm
     LEFT JOIN stock_movement_items smi ON smi.movement_id = sm.id
     LEFT JOIN locations src ON src.id = sm.source_location_id
     LEFT JOIN locations dest ON dest.id = sm.destination_location_id
     LEFT JOIN users requester ON requester.id = sm.requested_by
     WHERE sm.created_at::date BETWEEN $1::date AND $2::date
       AND sm.status <> 'cancelled'
     GROUP BY sm.id, src.name, dest.name, requester.name
     ORDER BY sm.created_at ASC`,
    [from, to]
  );

  const summaryResult = await pool.query<{
    movement_count: string;
    item_count: string;
    total_requested_quantity: string | null;
    total_confirmed_quantity: string | null;
  }>(
    `SELECT
      COUNT(DISTINCT sm.id)::text AS movement_count,
      COUNT(smi.id)::text AS item_count,
      COALESCE(SUM(smi.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(smi.confirmed_quantity), 0)::text AS total_confirmed_quantity
     FROM stock_movements sm
     LEFT JOIN stock_movement_items smi ON smi.movement_id = sm.id
     WHERE sm.created_at::date BETWEEN $1::date AND $2::date
       AND sm.status <> 'cancelled'`,
    [from, to]
  );

  return {
    from_date: from,
    to_date: to,
    movements: movementsResult.rows.map(row => ({
      id: row.id,
      movement_number: row.movement_number,
      created_at: row.created_at.toISOString(),
      status: row.status,
      source_location_name: row.source_location_name,
      destination_location_name: row.destination_location_name,
      item_count: Number(row.item_count),
      total_requested_quantity: toNumber(row.total_requested_quantity),
      total_confirmed_quantity: toNumber(row.total_confirmed_quantity),
      requested_by_name: row.requested_by_name,
    })),
    summary: buildMovementSummary(summaryResult.rows[0] ?? { movement_count: 0 }),
  };
};

const getMonthwiseMovementReport = async (
  year: number
): Promise<IMonthwiseMovementReport> => {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid year');
  }

  const monthsResult = await pool.query<{
    month: string;
    movement_count: string;
    item_count: string;
    total_requested_quantity: string | null;
    total_confirmed_quantity: string | null;
  }>(
    `SELECT
      EXTRACT(MONTH FROM sm.created_at)::int::text AS month,
      COUNT(DISTINCT sm.id)::text AS movement_count,
      COUNT(smi.id)::text AS item_count,
      COALESCE(SUM(smi.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(smi.confirmed_quantity), 0)::text AS total_confirmed_quantity
     FROM stock_movements sm
     LEFT JOIN stock_movement_items smi ON smi.movement_id = sm.id
     WHERE EXTRACT(YEAR FROM sm.created_at) = $1
       AND sm.status <> 'cancelled'
     GROUP BY EXTRACT(MONTH FROM sm.created_at)
     ORDER BY EXTRACT(MONTH FROM sm.created_at) ASC`,
    [year]
  );

  const summaryResult = await pool.query<{
    movement_count: string;
    item_count: string;
    total_requested_quantity: string | null;
    total_confirmed_quantity: string | null;
  }>(
    `SELECT
      COUNT(DISTINCT sm.id)::text AS movement_count,
      COUNT(smi.id)::text AS item_count,
      COALESCE(SUM(smi.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(smi.confirmed_quantity), 0)::text AS total_confirmed_quantity
     FROM stock_movements sm
     LEFT JOIN stock_movement_items smi ON smi.movement_id = sm.id
     WHERE EXTRACT(YEAR FROM sm.created_at) = $1
       AND sm.status <> 'cancelled'`,
    [year]
  );

  const monthMap = new Map(
    monthsResult.rows.map(row => [Number(row.month), row])
  );

  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const row = monthMap.get(month);

    return {
      month,
      month_label: `${MONTH_LABELS[index]} ${year}`,
      movement_count: row ? Number(row.movement_count) : 0,
      item_count: row ? Number(row.item_count) : 0,
      total_requested_quantity: row
        ? toNumber(row.total_requested_quantity)
        : 0,
      total_confirmed_quantity: row
        ? toNumber(row.total_confirmed_quantity)
        : 0,
    };
  }).filter(
    row =>
      row.movement_count > 0 ||
      row.item_count > 0 ||
      row.total_requested_quantity > 0 ||
      row.total_confirmed_quantity > 0
  );

  return {
    year,
    months:
      months.length > 0
        ? months
        : Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            month_label: `${MONTH_LABELS[index]} ${year}`,
            movement_count: 0,
            item_count: 0,
            total_requested_quantity: 0,
            total_confirmed_quantity: 0,
          })),
    summary: buildMovementSummary(summaryResult.rows[0] ?? { movement_count: 0 }),
  };
};

const getUserWiseMovementReport = async (
  fromDate: string,
  toDate: string,
  userId?: number
): Promise<IUserWiseMovementReport> => {
  const from = parseDateOnly(fromDate, 'fromDate');
  const to = parseDateOnly(toDate, 'toDate');

  if (from > to) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromDate must be on or before toDate'
    );
  }

  if (userId !== undefined && (!Number.isInteger(userId) || userId <= 0)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid userId');
  }

  const usersResult = await pool.query<{
    user_id: number;
    user_name: string | null;
    movement_count: string;
    item_count: string;
    total_requested_quantity: string | null;
    total_confirmed_quantity: string | null;
  }>(
    `SELECT
      u.id AS user_id,
      u.name AS user_name,
      COUNT(DISTINCT sm.id)::text AS movement_count,
      COUNT(smi.id)::text AS item_count,
      COALESCE(SUM(smi.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(smi.confirmed_quantity), 0)::text AS total_confirmed_quantity
     FROM stock_movements sm
     INNER JOIN users u ON u.id = sm.requested_by
     LEFT JOIN stock_movement_items smi ON smi.movement_id = sm.id
     WHERE sm.created_at::date BETWEEN $1::date AND $2::date
       AND sm.status <> 'cancelled'
       AND ($3::int IS NULL OR u.id = $3)
     GROUP BY u.id, u.name
     ORDER BY u.name ASC NULLS LAST`,
    [from, to, userId ?? null]
  );

  const summaryResult = await pool.query<{
    movement_count: string;
    item_count: string;
    total_requested_quantity: string | null;
    total_confirmed_quantity: string | null;
  }>(
    `SELECT
      COUNT(DISTINCT sm.id)::text AS movement_count,
      COUNT(smi.id)::text AS item_count,
      COALESCE(SUM(smi.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(smi.confirmed_quantity), 0)::text AS total_confirmed_quantity
     FROM stock_movements sm
     LEFT JOIN stock_movement_items smi ON smi.movement_id = sm.id
     WHERE sm.created_at::date BETWEEN $1::date AND $2::date
       AND sm.status <> 'cancelled'
       AND ($3::int IS NULL OR sm.requested_by = $3)`,
    [from, to, userId ?? null]
  );

  return {
    from_date: from,
    to_date: to,
    user_id: userId,
    users: usersResult.rows.map(row => ({
      user_id: row.user_id,
      user_name: row.user_name,
      movement_count: Number(row.movement_count),
      item_count: Number(row.item_count),
      total_requested_quantity: toNumber(row.total_requested_quantity),
      total_confirmed_quantity: toNumber(row.total_confirmed_quantity),
    })),
    summary: buildMovementSummary(summaryResult.rows[0] ?? { movement_count: 0 }),
  };
};

const getMainStockUpdateReport = async (
  fromDate: string,
  toDate: string,
  itemId?: number,
  vendorId?: number
): Promise<IMainStockUpdateReport> => {
  const from = parseDateOnly(fromDate, 'fromDate');
  const to = parseDateOnly(toDate, 'toDate');

  if (from > to) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromDate must be on or before toDate'
    );
  }

  if (itemId !== undefined && (!Number.isInteger(itemId) || itemId <= 0)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid itemId');
  }

  if (vendorId !== undefined && (!Number.isInteger(vendorId) || vendorId <= 0)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid vendorId');
  }

  const mainWarehouseId = await getMainWarehouseId();

  const itemsResult = await pool.query<{
    created_at: Date;
    item_name: string | null;
    vendor_name: string | null;
    quantity: string;
    unit_name: string | null;
    source_type: string;
    reference: string | null;
  }>(
    `SELECT
      sl.created_at,
      i.name AS item_name,
      COALESCE(v.company_name, v.vendor_name) AS vendor_name,
      sl.quantity,
      u.name AS unit_name,
      sl.source_type,
      CASE
        WHEN sl.source_type = 'po_accept' THEN po.po_number
        WHEN sl.source_type = 'transfer' THEN sm.movement_number
        WHEN sl.source_type = 'return' THEN rr.return_id
        WHEN sl.source_type = 'manual' THEN 'Manual'
        ELSE NULL
      END AS reference
     FROM stock_lots sl
     INNER JOIN items i ON i.id = sl.item_id
     LEFT JOIN vendors v ON v.id = sl.vendor_id
     LEFT JOIN units u ON u.id = sl.unit_id
     LEFT JOIN purchase_orders po ON po.id = sl.po_id
     LEFT JOIN stock_movements sm ON sm.id = sl.source_id AND sl.source_type = 'transfer'
     LEFT JOIN return_requests rr ON rr.id = sl.source_id AND sl.source_type = 'return'
     WHERE sl.location_id = $1
       AND sl.created_at::date BETWEEN $2::date AND $3::date
       AND sl.source_type IN ('manual', 'po_accept', 'transfer', 'return')
       AND ($4::int IS NULL OR sl.item_id = $4)
       AND ($5::int IS NULL OR sl.vendor_id = $5)
     ORDER BY sl.created_at ASC, sl.id ASC`,
    [mainWarehouseId, from, to, itemId ?? null, vendorId ?? null]
  );

  const summaryResult = await pool.query<{
    entry_count: string;
    item_count: string;
    total_quantity: string | null;
  }>(
    `SELECT
      COUNT(sl.id)::text AS entry_count,
      COUNT(DISTINCT sl.item_id)::text AS item_count,
      COALESCE(SUM(sl.quantity), 0)::text AS total_quantity
     FROM stock_lots sl
     WHERE sl.location_id = $1
       AND sl.created_at::date BETWEEN $2::date AND $3::date
       AND sl.source_type IN ('manual', 'po_accept', 'transfer', 'return')
       AND ($4::int IS NULL OR sl.item_id = $4)
       AND ($5::int IS NULL OR sl.vendor_id = $5)`,
    [mainWarehouseId, from, to, itemId ?? null, vendorId ?? null]
  );

  return {
    from_date: from,
    to_date: to,
    location_name: MAIN_WAREHOUSE_NAME,
    items: itemsResult.rows.map(row => ({
      created_at: row.created_at.toISOString(),
      item_name: row.item_name,
      vendor_name: row.vendor_name,
      quantity: Number(row.quantity),
      unit_name: row.unit_name,
      source_type: row.source_type,
      reference: row.reference,
    })),
    summary: buildMainStockSummary(summaryResult.rows[0] ?? { entry_count: 0 }),
  };
};

export const InventoryReportsService = {
  getDailyMovementReport,
  getDateRangeMovementReport,
  getMonthwiseMovementReport,
  getUserWiseMovementReport,
  getMainStockUpdateReport,
};

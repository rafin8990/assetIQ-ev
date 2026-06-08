import httpStatus from 'http-status'

import ApiError from '../../../errors/ApiError'
import pool from '../../../utils/dbClient'
import {
  IDailyReport,
  IDateRangeReport,
  IDuePaidReport,
  IMonthwiseReport,
  IPurchaseOrderReportSummary,
} from './purchase-orders-reports.interface'

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
]

const parseDateOnly = (value: string, fieldName: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${fieldName} must be in YYYY-MM-DD format`
    )
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid ${fieldName}`)
  }

  return value
}

const toNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0)

const buildSummary = (rows: {
  order_count: string | number
  item_count?: string | number
  total_amount: string | number | null
  total_paid: string | number | null
  total_due: string | number | null
}): IPurchaseOrderReportSummary => ({
  order_count: Number(rows.order_count ?? 0),
  item_count:
    rows.item_count !== undefined ? Number(rows.item_count ?? 0) : undefined,
  total_amount: toNumber(rows.total_amount),
  total_paid: toNumber(rows.total_paid),
  total_due: toNumber(rows.total_due),
})

const getDailyReport = async (date: string): Promise<IDailyReport> => {
  const reportDate = parseDateOnly(date, 'date')

  const itemsResult = await pool.query<{
    po_number: string
    po_date: Date
    status: string
    item_name: string | null
    quantity: string
    unit_name: string | null
    per_unit_amount: string | null
    line_total: string | null
    po_total_amount: string | null
    po_paid_amount: string | null
    po_due_amount: string | null
  }>(
    `SELECT
      po.po_number,
      po.created_at AS po_date,
      po.status,
      i.name AS item_name,
      pi.quantity,
      u.name AS unit_name,
      pi.per_unit_amount,
      pi.total_amount AS line_total,
      po.total_amount AS po_total_amount,
      po.paid_amount AS po_paid_amount,
      po.due_amount AS po_due_amount
     FROM purchase_orders po
     INNER JOIN po_items pi ON pi.po_id = po.id
     LEFT JOIN items i ON i.id = pi.item_id
     LEFT JOIN units u ON u.id = pi.unit_id
     WHERE po.created_at::date = $1::date
       AND po.status <> 'cancelled'
     ORDER BY po.created_at ASC, pi.id ASC`,
    [reportDate]
  )

  const poTotals = await pool.query<{
    total_amount: string | null
    total_paid: string | null
    total_due: string | null
    order_count: string
  }>(
    `SELECT
      COUNT(*)::text AS order_count,
      COALESCE(SUM(total_amount), 0)::text AS total_amount,
      COALESCE(SUM(paid_amount), 0)::text AS total_paid,
      COALESCE(SUM(due_amount), 0)::text AS total_due
     FROM purchase_orders
     WHERE created_at::date = $1::date
       AND status <> 'cancelled'`,
    [reportDate]
  )

  return {
    date: reportDate,
    items: itemsResult.rows.map(row => ({
      po_number: row.po_number,
      po_date: row.po_date.toISOString(),
      status: row.status,
      item_name: row.item_name,
      quantity: Number(row.quantity),
      unit_name: row.unit_name,
      per_unit_amount:
        row.per_unit_amount !== null ? Number(row.per_unit_amount) : null,
      line_total: row.line_total !== null ? Number(row.line_total) : null,
      po_total_amount:
        row.po_total_amount !== null ? Number(row.po_total_amount) : null,
      po_paid_amount:
        row.po_paid_amount !== null ? Number(row.po_paid_amount) : null,
      po_due_amount:
        row.po_due_amount !== null ? Number(row.po_due_amount) : null,
    })),
    summary: buildSummary({
      order_count: poTotals.rows[0]?.order_count ?? 0,
      item_count: itemsResult.rows.length,
      total_amount: poTotals.rows[0]?.total_amount ?? 0,
      total_paid: poTotals.rows[0]?.total_paid ?? 0,
      total_due: poTotals.rows[0]?.total_due ?? 0,
    }),
  }
}

const getDateRangeReport = async (
  fromDate: string,
  toDate: string
): Promise<IDateRangeReport> => {
  const from = parseDateOnly(fromDate, 'fromDate')
  const to = parseDateOnly(toDate, 'toDate')

  if (from > to) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromDate must be on or before toDate'
    )
  }

  const ordersResult = await pool.query<{
    id: number
    po_number: string
    created_at: Date
    status: string
    order_type: string
    total_amount: string | null
    paid_amount: string | null
    due_amount: string | null
    created_by_name: string | null
  }>(
    `SELECT
      po.id,
      po.po_number,
      po.created_at,
      po.status,
      po.order_type,
      po.total_amount,
      po.paid_amount,
      po.due_amount,
      creator.name AS created_by_name
     FROM purchase_orders po
     LEFT JOIN users creator ON creator.id = po.created_by
     WHERE po.created_at::date BETWEEN $1::date AND $2::date
       AND po.status <> 'cancelled'
     ORDER BY po.created_at ASC`,
    [from, to]
  )

  const summaryResult = await pool.query<{
    order_count: string
    total_amount: string | null
    total_paid: string | null
    total_due: string | null
  }>(
    `SELECT
      COUNT(*)::text AS order_count,
      COALESCE(SUM(total_amount), 0)::text AS total_amount,
      COALESCE(SUM(paid_amount), 0)::text AS total_paid,
      COALESCE(SUM(due_amount), 0)::text AS total_due
     FROM purchase_orders
     WHERE created_at::date BETWEEN $1::date AND $2::date
       AND status <> 'cancelled'`,
    [from, to]
  )

  return {
    from_date: from,
    to_date: to,
    orders: ordersResult.rows.map(row => ({
      id: row.id,
      po_number: row.po_number,
      created_at: row.created_at.toISOString(),
      status: row.status,
      order_type: row.order_type,
      total_amount:
        row.total_amount !== null ? Number(row.total_amount) : null,
      paid_amount: row.paid_amount !== null ? Number(row.paid_amount) : null,
      due_amount: row.due_amount !== null ? Number(row.due_amount) : null,
      created_by_name: row.created_by_name,
    })),
    summary: buildSummary(summaryResult.rows[0] ?? { order_count: 0 }),
  }
}

const getDuePaidReport = async (
  fromDate: string,
  toDate: string,
  paymentType: 'due' | 'paid'
): Promise<IDuePaidReport> => {
  const from = parseDateOnly(fromDate, 'fromDate')
  const to = parseDateOnly(toDate, 'toDate')

  if (from > to) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromDate must be on or before toDate'
    )
  }

  const paymentCondition =
    paymentType === 'due'
      ? 'po.due_amount > 0'
      : 'po.paid_amount > 0'

  const ordersResult = await pool.query<{
    id: number
    po_number: string
    created_at: Date
    status: string
    order_type: string
    total_amount: string | null
    paid_amount: string | null
    due_amount: string | null
    created_by_name: string | null
  }>(
    `SELECT
      po.id,
      po.po_number,
      po.created_at,
      po.status,
      po.order_type,
      po.total_amount,
      po.paid_amount,
      po.due_amount,
      creator.name AS created_by_name
     FROM purchase_orders po
     LEFT JOIN users creator ON creator.id = po.created_by
     WHERE po.created_at::date BETWEEN $1::date AND $2::date
       AND po.status <> 'cancelled'
       AND ${paymentCondition}
     ORDER BY po.created_at ASC`,
    [from, to]
  )

  const summaryResult = await pool.query<{
    order_count: string
    total_amount: string | null
    total_paid: string | null
    total_due: string | null
  }>(
    `SELECT
      COUNT(*)::text AS order_count,
      COALESCE(SUM(total_amount), 0)::text AS total_amount,
      COALESCE(SUM(paid_amount), 0)::text AS total_paid,
      COALESCE(SUM(due_amount), 0)::text AS total_due
     FROM purchase_orders po
     WHERE po.created_at::date BETWEEN $1::date AND $2::date
       AND po.status <> 'cancelled'
       AND ${paymentCondition}`,
    [from, to]
  )

  return {
    from_date: from,
    to_date: to,
    payment_type: paymentType,
    orders: ordersResult.rows.map(row => ({
      id: row.id,
      po_number: row.po_number,
      created_at: row.created_at.toISOString(),
      status: row.status,
      order_type: row.order_type,
      total_amount:
        row.total_amount !== null ? Number(row.total_amount) : null,
      paid_amount: row.paid_amount !== null ? Number(row.paid_amount) : null,
      due_amount: row.due_amount !== null ? Number(row.due_amount) : null,
      created_by_name: row.created_by_name,
    })),
    summary: buildSummary(summaryResult.rows[0] ?? { order_count: 0 }),
  }
}

const getMonthwiseReport = async (year: number): Promise<IMonthwiseReport> => {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid year')
  }

  const monthsResult = await pool.query<{
    month: string
    order_count: string
    total_amount: string | null
    total_paid: string | null
    total_due: string | null
  }>(
    `SELECT
      EXTRACT(MONTH FROM created_at)::int::text AS month,
      COUNT(*)::text AS order_count,
      COALESCE(SUM(total_amount), 0)::text AS total_amount,
      COALESCE(SUM(paid_amount), 0)::text AS total_paid,
      COALESCE(SUM(due_amount), 0)::text AS total_due
     FROM purchase_orders
     WHERE EXTRACT(YEAR FROM created_at) = $1
       AND status <> 'cancelled'
     GROUP BY EXTRACT(MONTH FROM created_at)
     ORDER BY EXTRACT(MONTH FROM created_at) ASC`,
    [year]
  )

  const summaryResult = await pool.query<{
    order_count: string
    total_amount: string | null
    total_paid: string | null
    total_due: string | null
  }>(
    `SELECT
      COUNT(*)::text AS order_count,
      COALESCE(SUM(total_amount), 0)::text AS total_amount,
      COALESCE(SUM(paid_amount), 0)::text AS total_paid,
      COALESCE(SUM(due_amount), 0)::text AS total_due
     FROM purchase_orders
     WHERE EXTRACT(YEAR FROM created_at) = $1
       AND status <> 'cancelled'`,
    [year]
  )

  const monthMap = new Map(
    monthsResult.rows.map(row => [Number(row.month), row])
  )

  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const row = monthMap.get(month)

    return {
      month,
      month_label: `${MONTH_LABELS[index]} ${year}`,
      order_count: row ? Number(row.order_count) : 0,
      total_amount: row ? toNumber(row.total_amount) : 0,
      total_paid: row ? toNumber(row.total_paid) : 0,
      total_due: row ? toNumber(row.total_due) : 0,
    }
  }).filter(
    row =>
      row.order_count > 0 ||
      row.total_amount > 0 ||
      row.total_paid > 0 ||
      row.total_due > 0
  )

  return {
    year,
    months:
      months.length > 0
        ? months
        : Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            month_label: `${MONTH_LABELS[index]} ${year}`,
            order_count: 0,
            total_amount: 0,
            total_paid: 0,
            total_due: 0,
          })),
    summary: buildSummary(summaryResult.rows[0] ?? { order_count: 0 }),
  }
}

export const PurchaseOrdersReportsService = {
  getDailyReport,
  getDateRangeReport,
  getDuePaidReport,
  getMonthwiseReport,
}

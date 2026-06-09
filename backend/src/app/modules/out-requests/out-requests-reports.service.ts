import httpStatus from 'http-status'

import ApiError from '../../../errors/ApiError'
import pool from '../../../utils/dbClient'
import {
  IDailyOutRequestReport,
  IDateRangeOutRequestReport,
  IMonthwiseOutRequestReport,
  IOutRequestReportSummary,
  IUserWiseOutRequestReport,
} from './out-requests-reports.interface'

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
  request_count: string | number
  item_count?: string | number
  total_requested_quantity: string | number | null
  total_out_quantity: string | number | null
}): IOutRequestReportSummary => ({
  request_count: Number(rows.request_count ?? 0),
  item_count:
    rows.item_count !== undefined ? Number(rows.item_count ?? 0) : undefined,
  total_requested_quantity: toNumber(rows.total_requested_quantity),
  total_out_quantity: toNumber(rows.total_out_quantity),
})

const getDailyReport = async (date: string): Promise<IDailyOutRequestReport> => {
  const reportDate = parseDateOnly(date, 'date')

  const itemsResult = await pool.query<{
    request_id: string
    request_date: Date
    request_status: string
    item_name: string | null
    requested_quantity: string
    out_quantity: string | null
    unit_name: string | null
    item_status: string
  }>(
    `SELECT
      oreq.request_id,
      oreq.created_at AS request_date,
      oreq.status AS request_status,
      i.name AS item_name,
      ori.requested_quantity,
      ori.out_quantity,
      u.name AS unit_name,
      ori.status AS item_status
     FROM out_requests oreq
     INNER JOIN out_request_items ori ON ori.out_request_id = oreq.id
     LEFT JOIN items i ON i.id = ori.item_id
     LEFT JOIN units u ON u.id = ori.unit_id
     WHERE oreq.created_at::date = $1::date
       AND oreq.status <> 'cancelled'
     ORDER BY oreq.created_at ASC, ori.id ASC`,
    [reportDate]
  )

  const summaryResult = await pool.query<{
    request_count: string
    item_count: string
    total_requested_quantity: string | null
    total_out_quantity: string | null
  }>(
    `SELECT
      COUNT(DISTINCT oreq.id)::text AS request_count,
      COUNT(ori.id)::text AS item_count,
      COALESCE(SUM(ori.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(ori.out_quantity), 0)::text AS total_out_quantity
     FROM out_requests oreq
     INNER JOIN out_request_items ori ON ori.out_request_id = oreq.id
     WHERE oreq.created_at::date = $1::date
       AND oreq.status <> 'cancelled'`,
    [reportDate]
  )

  return {
    date: reportDate,
    items: itemsResult.rows.map(row => ({
      request_id: row.request_id,
      request_date: row.request_date.toISOString(),
      request_status: row.request_status,
      item_name: row.item_name,
      requested_quantity: Number(row.requested_quantity),
      out_quantity:
        row.out_quantity !== null ? Number(row.out_quantity) : null,
      unit_name: row.unit_name,
      item_status: row.item_status,
    })),
    summary: buildSummary(summaryResult.rows[0] ?? { request_count: 0 }),
  }
}

const getDateRangeReport = async (
  fromDate: string,
  toDate: string
): Promise<IDateRangeOutRequestReport> => {
  const from = parseDateOnly(fromDate, 'fromDate')
  const to = parseDateOnly(toDate, 'toDate')

  if (from > to) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromDate must be on or before toDate'
    )
  }

  const requestsResult = await pool.query<{
    id: number
    request_id: string
    created_at: Date
    status: string
    item_count: string
    total_requested_quantity: string | null
    total_out_quantity: string | null
    requested_by_name: string | null
  }>(
    `SELECT
      oreq.id,
      oreq.request_id,
      oreq.created_at,
      oreq.status,
      COUNT(ori.id)::text AS item_count,
      COALESCE(SUM(ori.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(ori.out_quantity), 0)::text AS total_out_quantity,
      requester.name AS requested_by_name
     FROM out_requests oreq
     LEFT JOIN out_request_items ori ON ori.out_request_id = oreq.id
     LEFT JOIN users requester ON requester.id = oreq.requested_by
     WHERE oreq.created_at::date BETWEEN $1::date AND $2::date
       AND oreq.status <> 'cancelled'
     GROUP BY oreq.id, requester.name
     ORDER BY oreq.created_at ASC`,
    [from, to]
  )

  const summaryResult = await pool.query<{
    request_count: string
    item_count: string
    total_requested_quantity: string | null
    total_out_quantity: string | null
  }>(
    `SELECT
      COUNT(DISTINCT oreq.id)::text AS request_count,
      COUNT(ori.id)::text AS item_count,
      COALESCE(SUM(ori.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(ori.out_quantity), 0)::text AS total_out_quantity
     FROM out_requests oreq
     LEFT JOIN out_request_items ori ON ori.out_request_id = oreq.id
     WHERE oreq.created_at::date BETWEEN $1::date AND $2::date
       AND oreq.status <> 'cancelled'`,
    [from, to]
  )

  return {
    from_date: from,
    to_date: to,
    requests: requestsResult.rows.map(row => ({
      id: row.id,
      request_id: row.request_id,
      created_at: row.created_at.toISOString(),
      status: row.status,
      item_count: Number(row.item_count),
      total_requested_quantity: toNumber(row.total_requested_quantity),
      total_out_quantity: toNumber(row.total_out_quantity),
      requested_by_name: row.requested_by_name,
    })),
    summary: buildSummary(summaryResult.rows[0] ?? { request_count: 0 }),
  }
}

const getMonthwiseReport = async (
  year: number
): Promise<IMonthwiseOutRequestReport> => {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid year')
  }

  const monthsResult = await pool.query<{
    month: string
    request_count: string
    item_count: string
    total_requested_quantity: string | null
    total_out_quantity: string | null
  }>(
    `SELECT
      EXTRACT(MONTH FROM oreq.created_at)::int::text AS month,
      COUNT(DISTINCT oreq.id)::text AS request_count,
      COUNT(ori.id)::text AS item_count,
      COALESCE(SUM(ori.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(ori.out_quantity), 0)::text AS total_out_quantity
     FROM out_requests oreq
     LEFT JOIN out_request_items ori ON ori.out_request_id = oreq.id
     WHERE EXTRACT(YEAR FROM oreq.created_at) = $1
       AND oreq.status <> 'cancelled'
     GROUP BY EXTRACT(MONTH FROM oreq.created_at)
     ORDER BY EXTRACT(MONTH FROM oreq.created_at) ASC`,
    [year]
  )

  const summaryResult = await pool.query<{
    request_count: string
    item_count: string
    total_requested_quantity: string | null
    total_out_quantity: string | null
  }>(
    `SELECT
      COUNT(DISTINCT oreq.id)::text AS request_count,
      COUNT(ori.id)::text AS item_count,
      COALESCE(SUM(ori.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(ori.out_quantity), 0)::text AS total_out_quantity
     FROM out_requests oreq
     LEFT JOIN out_request_items ori ON ori.out_request_id = oreq.id
     WHERE EXTRACT(YEAR FROM oreq.created_at) = $1
       AND oreq.status <> 'cancelled'`,
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
      request_count: row ? Number(row.request_count) : 0,
      item_count: row ? Number(row.item_count) : 0,
      total_requested_quantity: row
        ? toNumber(row.total_requested_quantity)
        : 0,
      total_out_quantity: row ? toNumber(row.total_out_quantity) : 0,
    }
  }).filter(
    row =>
      row.request_count > 0 ||
      row.item_count > 0 ||
      row.total_requested_quantity > 0 ||
      row.total_out_quantity > 0
  )

  return {
    year,
    months:
      months.length > 0
        ? months
        : Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            month_label: `${MONTH_LABELS[index]} ${year}`,
            request_count: 0,
            item_count: 0,
            total_requested_quantity: 0,
            total_out_quantity: 0,
          })),
    summary: buildSummary(summaryResult.rows[0] ?? { request_count: 0 }),
  }
}

const getUserWiseReport = async (
  fromDate: string,
  toDate: string,
  userId?: number
): Promise<IUserWiseOutRequestReport> => {
  const from = parseDateOnly(fromDate, 'fromDate')
  const to = parseDateOnly(toDate, 'toDate')

  if (from > to) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromDate must be on or before toDate'
    )
  }

  if (userId !== undefined && (!Number.isInteger(userId) || userId <= 0)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid userId')
  }

  const usersResult = await pool.query<{
    user_id: number
    user_name: string | null
    request_count: string
    item_count: string
    total_requested_quantity: string | null
    total_out_quantity: string | null
  }>(
    `SELECT
      u.id AS user_id,
      u.name AS user_name,
      COUNT(DISTINCT oreq.id)::text AS request_count,
      COUNT(ori.id)::text AS item_count,
      COALESCE(SUM(ori.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(ori.out_quantity), 0)::text AS total_out_quantity
     FROM out_requests oreq
     INNER JOIN users u ON u.id = oreq.requested_by
     LEFT JOIN out_request_items ori ON ori.out_request_id = oreq.id
     WHERE oreq.created_at::date BETWEEN $1::date AND $2::date
       AND oreq.status <> 'cancelled'
       AND ($3::int IS NULL OR u.id = $3)
     GROUP BY u.id, u.name
     ORDER BY u.name ASC NULLS LAST`,
    [from, to, userId ?? null]
  )

  const summaryResult = await pool.query<{
    request_count: string
    item_count: string
    total_requested_quantity: string | null
    total_out_quantity: string | null
  }>(
    `SELECT
      COUNT(DISTINCT oreq.id)::text AS request_count,
      COUNT(ori.id)::text AS item_count,
      COALESCE(SUM(ori.requested_quantity), 0)::text AS total_requested_quantity,
      COALESCE(SUM(ori.out_quantity), 0)::text AS total_out_quantity
     FROM out_requests oreq
     LEFT JOIN out_request_items ori ON ori.out_request_id = oreq.id
     WHERE oreq.created_at::date BETWEEN $1::date AND $2::date
       AND oreq.status <> 'cancelled'
       AND ($3::int IS NULL OR oreq.requested_by = $3)`,
    [from, to, userId ?? null]
  )

  return {
    from_date: from,
    to_date: to,
    user_id: userId,
    users: usersResult.rows.map(row => ({
      user_id: row.user_id,
      user_name: row.user_name,
      request_count: Number(row.request_count),
      item_count: Number(row.item_count),
      total_requested_quantity: toNumber(row.total_requested_quantity),
      total_out_quantity: toNumber(row.total_out_quantity),
    })),
    summary: buildSummary(summaryResult.rows[0] ?? { request_count: 0 }),
  }
}

export const OutRequestsReportsService = {
  getDailyReport,
  getDateRangeReport,
  getMonthwiseReport,
  getUserWiseReport,
}

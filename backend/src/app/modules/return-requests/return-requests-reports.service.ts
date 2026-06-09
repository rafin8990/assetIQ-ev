import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import pool from '../../../utils/dbClient';
import {
  IDateRangeReturnReport,
  IReturnReportSummary,
} from './return-requests-reports.interface';

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

const buildSummary = (rows: {
  return_count: string | number;
  item_count: string | number;
  total_return_quantity: string | number | null;
}): IReturnReportSummary => ({
  return_count: Number(rows.return_count ?? 0),
  item_count: Number(rows.item_count ?? 0),
  total_return_quantity: toNumber(rows.total_return_quantity),
});

const getDateRangeReport = async (
  fromDate: string,
  toDate: string
): Promise<IDateRangeReturnReport> => {
  const from = parseDateOnly(fromDate, 'fromDate');
  const to = parseDateOnly(toDate, 'toDate');

  if (from > to) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'fromDate must be on or before toDate'
    );
  }

  const itemsResult = await pool.query<{
    return_id: string;
    out_request_id: string;
    return_date: Date;
    status: string;
    item_name: string | null;
    return_quantity: string;
    unit_name: string | null;
    requested_by_name: string | null;
    approved_by_name: string | null;
  }>(
    `SELECT
      rr.return_id,
      oreq.request_id AS out_request_id,
      rr.updated_at AS return_date,
      rr.status,
      i.name AS item_name,
      rri.return_quantity,
      u.name AS unit_name,
      requester.name AS requested_by_name,
      approver.name AS approved_by_name
     FROM return_requests rr
     INNER JOIN return_request_items rri ON rri.return_request_id = rr.id
     INNER JOIN out_requests oreq ON oreq.id = rr.out_request_id
     LEFT JOIN items i ON i.id = rri.item_id
     LEFT JOIN units u ON u.id = rri.unit_id
     LEFT JOIN users requester ON requester.id = rr.requested_by
     LEFT JOIN users approver ON approver.id = rr.approved_by
     WHERE rr.status = 'approved'
       AND rr.updated_at::date BETWEEN $1::date AND $2::date
     ORDER BY rr.updated_at ASC, rr.return_id ASC, rri.id ASC`,
    [from, to]
  );

  const summaryResult = await pool.query<{
    return_count: string;
    item_count: string;
    total_return_quantity: string | null;
  }>(
    `SELECT
      COUNT(DISTINCT rr.id)::text AS return_count,
      COUNT(rri.id)::text AS item_count,
      COALESCE(SUM(rri.return_quantity), 0)::text AS total_return_quantity
     FROM return_requests rr
     INNER JOIN return_request_items rri ON rri.return_request_id = rr.id
     WHERE rr.status = 'approved'
       AND rr.updated_at::date BETWEEN $1::date AND $2::date`,
    [from, to]
  );

  return {
    from_date: from,
    to_date: to,
    items: itemsResult.rows.map(row => ({
      return_id: row.return_id,
      out_request_id: row.out_request_id,
      return_date: row.return_date.toISOString(),
      status: row.status,
      item_name: row.item_name,
      return_quantity: toNumber(row.return_quantity),
      unit_name: row.unit_name,
      requested_by_name: row.requested_by_name,
      approved_by_name: row.approved_by_name,
    })),
    summary: buildSummary(summaryResult.rows[0] ?? { return_count: 0 }),
  };
};

export const ReturnRequestsReportsService = {
  getDateRangeReport,
};

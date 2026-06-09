import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { generateReturnRequestId } from '../../../helpers/returnRequestIdHelper';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { ItemsService } from '../items/items.service';
import { OutRequestsService } from '../out-requests/out-requests.service';
import { StocksService } from '../stocks/stocks.service';
import { UnitsService } from '../units/units.service';
import { PERMISSION_ACTION_DELETE_ANY_RETURN } from '../permissions/permissions.constant';
import { PermissionsService } from '../permissions/permissions.service';
import { UsersService } from '../users/users.service';
import {
  RETURN_REQUESTS_SORTABLE_FIELDS,
  RETURN_REQUESTS_SORT_COLUMN_MAP,
} from './return-requests.constant';
import {
  ICreateReturnRequestPayload,
  IReturnRequest,
  IReturnRequestFilters,
  IReturnRequestItemPayload,
  IReturnRequestItemWithRelations,
  IReturnRequestWithRelations,
  ReturnRequestStatus,
  IUpdateReturnRequestPayload,
} from './return-requests.interface';

const RETURN_REQUEST_SELECT_FIELDS = `
  rr.id, rr.return_id, rr.out_request_id, rr.description, rr.status,
  rr.requested_by, rr.approved_by,
  rr.created_at, rr.updated_at,
  oreq.request_id AS out_request_request_id,
  requester.name AS requested_by_name,
  approver.name AS approved_by_name
`;

const RETURN_REQUEST_JOINS = `
  FROM return_requests rr
  LEFT JOIN out_requests oreq ON oreq.id = rr.out_request_id
  LEFT JOIN users requester ON requester.id = rr.requested_by
  LEFT JOIN users approver ON approver.id = rr.approved_by
`;

const getApprovedReturnedQuantity = async (
  outRequestItemId: number,
  excludeReturnRequestId?: number
): Promise<number> => {
  const values: unknown[] = [outRequestItemId];
  let excludeClause = '';

  if (excludeReturnRequestId !== undefined) {
    values.push(excludeReturnRequestId);
    excludeClause = `AND rri.return_request_id <> $${values.length}`;
  }

  const result = await pool.query<{ total: string | null }>(
    `SELECT COALESCE(SUM(rri.return_quantity), 0)::text AS total
     FROM return_request_items rri
     INNER JOIN return_requests rr ON rr.id = rri.return_request_id
     WHERE rri.out_request_item_id = $1
       AND rr.status = 'approved'
       ${excludeClause}`,
    values
  );

  return Number(result.rows[0]?.total ?? 0);
};

const getReturnRequestItems = async (
  returnRequestId: number
): Promise<IReturnRequestItemWithRelations[]> => {
  const result = await pool.query<IReturnRequestItemWithRelations>(
    `SELECT
      rri.id, rri.return_request_id, rri.out_request_item_id, rri.item_id,
      rri.return_quantity, rri.unit_id, rri.created_at, rri.updated_at,
      i.name AS item_name,
      u.name AS unit_name,
      ori.out_quantity
     FROM return_request_items rri
     LEFT JOIN items i ON i.id = rri.item_id
     LEFT JOIN units u ON u.id = rri.unit_id
     LEFT JOIN out_request_items ori ON ori.id = rri.out_request_item_id
     WHERE rri.return_request_id = $1
     ORDER BY rri.id ASC`,
    [returnRequestId]
  );

  return Promise.all(
    result.rows.map(async row => {
      const outQuantity =
        row.out_quantity !== null && row.out_quantity !== undefined
          ? Number(row.out_quantity)
          : 0;
      const alreadyReturned = await getApprovedReturnedQuantity(
        row.out_request_item_id,
        returnRequestId
      );

      return {
        ...row,
        return_quantity: Number(row.return_quantity),
        out_quantity: outQuantity,
        already_returned_quantity: alreadyReturned,
        returnable_quantity: Math.max(0, outQuantity - alreadyReturned),
      };
    })
  );
};

const validateReturnItems = async (
  outRequestId: number,
  items: IReturnRequestItemPayload[],
  excludeReturnRequestId?: number
) => {
  const outRequest = await OutRequestsService.getSingleOutRequest(outRequestId);

  if (outRequest.status === 'cancelled') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot create return for a cancelled out request'
    );
  }

  const outItemMap = new Map(
    outRequest.items.map(item => [item.id, item])
  );

  const seenItemIds = new Set<number>();

  for (const item of items) {
    if (seenItemIds.has(item.item_id)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Duplicate item id ${item.item_id} in return payload`
      );
    }
    seenItemIds.add(item.item_id);

    await ItemsService.getSingleItem(item.item_id);

    if (item.unit_id) {
      await UnitsService.getSingleUnit(item.unit_id);
    }

    const outItem = outItemMap.get(item.out_request_item_id);

    if (!outItem) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Out request item ${item.out_request_item_id} does not belong to the selected out request`
      );
    }

    if (outItem.item_id !== item.item_id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Item id ${item.item_id} does not match out request item ${item.out_request_item_id}`
      );
    }

    const outQuantity = Number(outItem.out_quantity ?? 0);

    if (outQuantity <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Item ${outItem.item_name ?? item.item_id} has no outbound quantity to return`
      );
    }

    const alreadyReturned = await getApprovedReturnedQuantity(
      item.out_request_item_id,
      excludeReturnRequestId
    );
    const returnable = outQuantity - alreadyReturned;

    if (item.return_quantity > returnable) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Return quantity for ${outItem.item_name ?? `item #${item.item_id}`} cannot exceed returnable quantity (${returnable})`
      );
    }
  }

  const hasOutboundItems = outRequest.items.some(
    item => Number(item.out_quantity ?? 0) > 0
  );

  if (!hasOutboundItems) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Selected out request has no items with outbound quantity'
    );
  }
};

const insertReturnRequestItems = async (
  client: { query: typeof pool.query },
  returnRequestId: number,
  items: IReturnRequestItemPayload[]
) => {
  for (const item of items) {
    await client.query(
      `INSERT INTO return_request_items (
        return_request_id, out_request_item_id, item_id, return_quantity, unit_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        returnRequestId,
        item.out_request_item_id,
        item.item_id,
        item.return_quantity,
        item.unit_id ?? null,
      ]
    );
  }
};

const assertPendingForUpdate = (status: ReturnRequestStatus) => {
  if (status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending return requests can be updated'
    );
  }
};

const assertPendingForUserDelete = (status: ReturnRequestStatus) => {
  if (status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending return requests can be deleted'
    );
  }
};

const createReturnRequest = async (
  payload: ICreateReturnRequestPayload
): Promise<IReturnRequestWithRelations> => {
  await UsersService.getSingleUser(payload.requested_by);
  await OutRequestsService.getSingleOutRequest(payload.out_request_id);
  await validateReturnItems(payload.out_request_id, payload.items);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const returnId = await generateReturnRequestId();

    const result = await client.query<IReturnRequest>(
      `INSERT INTO return_requests (
        return_id, out_request_id, description, status, requested_by
      ) VALUES ($1, $2, $3, 'pending', $4)
      RETURNING *`,
      [
        returnId,
        payload.out_request_id,
        payload.description ?? null,
        payload.requested_by,
      ]
    );

    const returnRequest = result.rows[0];
    await insertReturnRequestItems(client, returnRequest.id, payload.items);

    await client.query('COMMIT');

    return getSingleReturnRequest(returnRequest.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getAllReturnRequests = async (
  filters: IReturnRequestFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = RETURN_REQUESTS_SORTABLE_FIELDS.includes(
    sortBy as (typeof RETURN_REQUESTS_SORTABLE_FIELDS)[number]
  )
    ? RETURN_REQUESTS_SORT_COLUMN_MAP[
        sortBy as keyof typeof RETURN_REQUESTS_SORT_COLUMN_MAP
      ]
    : RETURN_REQUESTS_SORT_COLUMN_MAP.created_at;
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(rr.return_id ILIKE $${index} OR rr.description ILIKE $${index} OR oreq.request_id ILIKE $${index} OR requester.name ILIKE $${index})`
    );
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`rr.status = $${values.length}`);
  }

  if (filters.requestedBy) {
    values.push(filters.requestedBy);
    conditions.push(`rr.requested_by = $${values.length}`);
  }

  if (filters.outRequestId) {
    values.push(filters.outRequestId);
    conditions.push(`rr.out_request_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) ${RETURN_REQUEST_JOINS} ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IReturnRequestWithRelations>(
    `SELECT ${RETURN_REQUEST_SELECT_FIELDS}
     ${RETURN_REQUEST_JOINS}
     ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  const data = await Promise.all(
    dataResult.rows.map(async row => {
      const items = await getReturnRequestItems(row.id);
      return { ...row, items };
    })
  );

  return {
    meta: {
      page,
      limit,
      total,
      ...paginationHelpers.calculatePaginationMetadata(page, limit, total),
    },
    data,
  };
};

const getSingleReturnRequest = async (
  id: number
): Promise<IReturnRequestWithRelations> => {
  const result = await pool.query<IReturnRequestWithRelations>(
    `SELECT ${RETURN_REQUEST_SELECT_FIELDS}
     ${RETURN_REQUEST_JOINS}
     WHERE rr.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Return request not found');
  }

  const items = await getReturnRequestItems(id);
  return { ...result.rows[0], items };
};

const updateReturnRequest = async (
  id: number,
  payload: IUpdateReturnRequestPayload
): Promise<IReturnRequestWithRelations> => {
  const existing = await getSingleReturnRequest(id);
  assertPendingForUpdate(existing.status);

  if (payload.requested_by !== undefined) {
    await UsersService.getSingleUser(payload.requested_by);
  }

  if (payload.items?.length) {
    await validateReturnItems(existing.out_request_id, payload.items, id);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.description !== undefined) {
      values.push(payload.description ?? null);
      fields.push(`description = $${values.length}`);
    }

    if (payload.requested_by !== undefined) {
      values.push(payload.requested_by);
      fields.push(`requested_by = $${values.length}`);
    }

    if (fields.length) {
      fields.push('updated_at = NOW()');
      values.push(id);

      await client.query(
        `UPDATE return_requests SET ${fields.join(', ')} WHERE id = $${values.length}`,
        values
      );
    }

    if (payload.items) {
      await client.query(
        `DELETE FROM return_request_items WHERE return_request_id = $1`,
        [id]
      );
      await insertReturnRequestItems(client, id, payload.items);
    }

    await client.query('COMMIT');

    return getSingleReturnRequest(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteReturnRequest = async (
  id: number,
  userId: number
): Promise<IReturnRequest> => {
  const existing = await getSingleReturnRequest(id);
  const actor = await UsersService.getSingleUser(userId);
  const canDeleteAny = await PermissionsService.hasPermission(
    userId,
    actor.role,
    PERMISSION_ACTION_DELETE_ANY_RETURN
  );

  if (!canDeleteAny) {
    assertPendingForUserDelete(existing.status);

    if (existing.requested_by !== userId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You can only delete your own return requests'
      );
    }
  }

  const result = await pool.query<IReturnRequest>(
    `DELETE FROM return_requests WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

const approveReturnRequest = async (
  id: number,
  approvedBy: number
): Promise<IReturnRequestWithRelations> => {
  await UsersService.getSingleUser(approvedBy);

  const existing = await getSingleReturnRequest(id);

  if (existing.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending return requests can be approved'
    );
  }

  await validateReturnItems(
    existing.out_request_id,
    existing.items.map(item => ({
      out_request_item_id: item.out_request_item_id,
      item_id: item.item_id,
      return_quantity: Number(item.return_quantity),
      unit_id: item.unit_id,
    })),
    id
  );

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await StocksService.increaseStockFromReturnItems(
      client,
      existing.items.map(item => ({
        item_id: item.item_id,
        quantity: Number(item.return_quantity),
        unit_id: item.unit_id,
      }))
    );

    await client.query(
      `UPDATE return_requests
       SET status = 'approved',
           approved_by = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [id, approvedBy]
    );

    await client.query('COMMIT');

    return getSingleReturnRequest(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const cancelReturnRequest = async (
  id: number
): Promise<IReturnRequestWithRelations> => {
  const existing = await getSingleReturnRequest(id);

  if (existing.status === 'cancelled') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Return request is already cancelled'
    );
  }

  if (existing.status === 'approved') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Approved return requests cannot be cancelled'
    );
  }

  await pool.query(
    `UPDATE return_requests
     SET status = 'cancelled',
         updated_at = NOW()
     WHERE id = $1`,
    [id]
  );

  return getSingleReturnRequest(id);
};

export const ReturnRequestsService = {
  createReturnRequest,
  getAllReturnRequests,
  getSingleReturnRequest,
  updateReturnRequest,
  deleteReturnRequest,
  approveReturnRequest,
  cancelReturnRequest,
};

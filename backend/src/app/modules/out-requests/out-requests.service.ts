import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { generateOutRequestId } from '../../../helpers/outRequestIdHelper';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { InventoryService } from '../inventory/inventory.service';
import { ItemsService } from '../items/items.service';
import { LocationsService } from '../locations/locations.service';
import { UnitsService } from '../units/units.service';
import { PERMISSION_ACTION_DELETE_ANY_OUT_REQUEST } from '../permissions/permissions.constant';
import { PermissionsService } from '../permissions/permissions.service';
import { UsersService } from '../users/users.service';
import {
  OUT_REQUESTS_SORTABLE_FIELDS,
  OUT_REQUESTS_SORT_COLUMN_MAP,
} from './out-requests.constant';
import {
  ICreateOutRequestPayload,
  IOutRequest,
  IOutRequestFilters,
  IOutRequestItemPayload,
  IOutRequestItemWithRelations,
  IOutRequestWithRelations,
  OutRequestItemStatus,
  OutRequestStatus,
  IProcessOutRequestPayload,
  IUpdateOutRequestPayload,
} from './out-requests.interface';

const OUT_REQUEST_SELECT_FIELDS = `
  orq.id, orq.request_id, orq.description, orq.status,
  orq.source_location_id, orq.requested_by, orq.approved_by, orq.out_by,
  orq.created_at, orq.updated_at,
  loc.name AS source_location_name,
  requester.name AS requested_by_name,
  approver.name AS approved_by_name,
  out_user.name AS out_by_name
`;

const OUT_REQUEST_JOINS = `
  FROM out_requests orq
  LEFT JOIN locations loc ON loc.id = orq.source_location_id
  LEFT JOIN users requester ON requester.id = orq.requested_by
  LEFT JOIN users approver ON approver.id = orq.approved_by
  LEFT JOIN users out_user ON out_user.id = orq.out_by
`;

const getOutRequestItems = async (
  outRequestId: number,
  sourceLocationId?: number | null
): Promise<IOutRequestItemWithRelations[]> => {
  const result = await pool.query<IOutRequestItemWithRelations>(
    `SELECT
      ori.id, ori.out_request_id, ori.item_id, ori.requested_quantity,
      ori.out_quantity, ori.unit_id, ori.status, ori.out_by,
      ori.created_at, ori.updated_at,
      i.name AS item_name,
      u.name AS unit_name
     FROM out_request_items ori
     LEFT JOIN items i ON i.id = ori.item_id
     LEFT JOIN units u ON u.id = ori.unit_id
     WHERE ori.out_request_id = $1
     ORDER BY ori.id ASC`,
    [outRequestId]
  );

  return Promise.all(
    result.rows.map(async row => {
      const locationQty =
        sourceLocationId != null
          ? await InventoryService.getAvailableQuantity(
              sourceLocationId,
              row.item_id
            )
          : 0;
      const totalQty = await InventoryService.getTotalAvailableQuantity(
        row.item_id
      );

      return {
        ...row,
        requested_quantity: Number(row.requested_quantity),
        out_quantity:
          row.out_quantity !== null && row.out_quantity !== undefined
            ? Number(row.out_quantity)
            : null,
        available_quantity: locationQty,
        total_available_quantity: totalQty,
      };
    })
  );
};

const validateOutRequestItems = async (items: IOutRequestItemPayload[]) => {
  for (const item of items) {
    await ItemsService.getSingleItem(item.item_id);

    if (item.unit_id) {
      await UnitsService.getSingleUnit(item.unit_id);
    }
  }
};

const insertOutRequestItems = async (
  client: { query: typeof pool.query },
  outRequestId: number,
  items: IOutRequestItemPayload[]
) => {
  for (const item of items) {
    await client.query(
      `INSERT INTO out_request_items (
        out_request_id, item_id, requested_quantity, unit_id
      ) VALUES ($1, $2, $3, $4)`,
      [
        outRequestId,
        item.item_id,
        item.requested_quantity,
        item.unit_id ?? null,
      ]
    );
  }
};

const assertPendingForUpdate = (status: OutRequestStatus) => {
  if (status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending out requests can be updated'
    );
  }
};

const assertPendingForUserDelete = (status: OutRequestStatus) => {
  if (status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending out requests can be deleted'
    );
  }
};

const resolveItemOutQuantity = (
  requestedQuantity: number,
  currentOutQuantity: number | null,
  inputOutQuantity?: number | null
) => {
  const alreadyOut = currentOutQuantity ?? 0;
  const remaining = Math.max(0, requestedQuantity - alreadyOut);

  if (remaining <= 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Item has already been fully processed'
    );
  }

  const quantityThisOperation =
    inputOutQuantity !== undefined && inputOutQuantity !== null
      ? Number(inputOutQuantity)
      : remaining;

  if (Number.isNaN(quantityThisOperation) || quantityThisOperation <= 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Out quantity must be greater than zero'
    );
  }

  if (quantityThisOperation > remaining) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Out quantity cannot exceed remaining quantity (${remaining})`
    );
  }

  return quantityThisOperation;
};

const resolveItemStatus = (
  requestedQuantity: number,
  totalOutQuantity: number
): OutRequestItemStatus => {
  if (totalOutQuantity >= requestedQuantity) {
    return 'out';
  }

  if (totalOutQuantity > 0) {
    return 'partial';
  }

  return 'pending';
};

const createOutRequest = async (
  payload: ICreateOutRequestPayload
): Promise<IOutRequestWithRelations> => {
  await UsersService.getSingleUser(payload.requested_by);
  await LocationsService.getSingleLocation(payload.source_location_id);
  await validateOutRequestItems(payload.items);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const requestId = await generateOutRequestId();

    const result = await client.query<IOutRequest>(
      `INSERT INTO out_requests (
        request_id, description, status, source_location_id, requested_by
      ) VALUES ($1, $2, 'pending', $3, $4)
      RETURNING *`,
      [
        requestId,
        payload.description ?? null,
        payload.source_location_id,
        payload.requested_by,
      ]
    );

    const outRequest = result.rows[0];
    await insertOutRequestItems(client, outRequest.id, payload.items);

    await client.query('COMMIT');

    return getSingleOutRequest(outRequest.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getAllOutRequests = async (
  filters: IOutRequestFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = OUT_REQUESTS_SORTABLE_FIELDS.includes(
    sortBy as (typeof OUT_REQUESTS_SORTABLE_FIELDS)[number]
  )
    ? OUT_REQUESTS_SORT_COLUMN_MAP[
        sortBy as keyof typeof OUT_REQUESTS_SORT_COLUMN_MAP
      ]
    : OUT_REQUESTS_SORT_COLUMN_MAP.created_at;
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(orq.request_id ILIKE $${index} OR orq.description ILIKE $${index} OR requester.name ILIKE $${index})`
    );
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`orq.status = $${values.length}`);
  }

  if (filters.requestedBy) {
    values.push(filters.requestedBy);
    conditions.push(`orq.requested_by = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) ${OUT_REQUEST_JOINS} ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IOutRequestWithRelations>(
    `SELECT ${OUT_REQUEST_SELECT_FIELDS}
     ${OUT_REQUEST_JOINS}
     ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  const data = await Promise.all(
    dataResult.rows.map(async row => {
      const items = await getOutRequestItems(row.id, row.source_location_id);
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

const getSingleOutRequest = async (
  id: number
): Promise<IOutRequestWithRelations> => {
  const result = await pool.query<IOutRequestWithRelations>(
    `SELECT ${OUT_REQUEST_SELECT_FIELDS}
     ${OUT_REQUEST_JOINS}
     WHERE orq.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Out request not found');
  }

  const items = await getOutRequestItems(id, result.rows[0].source_location_id);
  return { ...result.rows[0], items };
};

const updateOutRequest = async (
  id: number,
  payload: IUpdateOutRequestPayload
): Promise<IOutRequestWithRelations> => {
  const existing = await getSingleOutRequest(id);
  assertPendingForUpdate(existing.status);

  if (payload.requested_by !== undefined) {
    await UsersService.getSingleUser(payload.requested_by);
  }

  if (payload.items?.length) {
    await validateOutRequestItems(payload.items);
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
        `UPDATE out_requests SET ${fields.join(', ')} WHERE id = $${values.length}`,
        values
      );
    }

    if (payload.items) {
      await client.query(`DELETE FROM out_request_items WHERE out_request_id = $1`, [
        id,
      ]);
      await insertOutRequestItems(client, id, payload.items);
    }

    await client.query('COMMIT');

    return getSingleOutRequest(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteOutRequest = async (
  id: number,
  userId: number
): Promise<IOutRequest> => {
  const existing = await getSingleOutRequest(id);
  const actor = await UsersService.getSingleUser(userId);
  const canDeleteAny = await PermissionsService.hasPermission(
    userId,
    actor.role,
    PERMISSION_ACTION_DELETE_ANY_OUT_REQUEST
  );

  if (!canDeleteAny) {
    assertPendingForUserDelete(existing.status);

    if (existing.requested_by !== userId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You can only delete your own out requests'
      );
    }
  }

  const result = await pool.query<IOutRequest>(
    `DELETE FROM out_requests WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

const approveOutRequest = async (
  id: number,
  approvedBy: number
): Promise<IOutRequestWithRelations> => {
  await UsersService.getSingleUser(approvedBy);

  const existing = await getSingleOutRequest(id);

  if (existing.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending out requests can be approved'
    );
  }

  await pool.query(
    `UPDATE out_requests
     SET status = 'approved',
         approved_by = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [id, approvedBy]
  );

  return getSingleOutRequest(id);
};

const cancelOutRequest = async (
  id: number
): Promise<IOutRequestWithRelations> => {
  const existing = await getSingleOutRequest(id);

  if (existing.status === 'cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Out request is already cancelled');
  }

  if (existing.status === 'out') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Completed out requests cannot be cancelled'
    );
  }

  await pool.query(
    `UPDATE out_requests
     SET status = 'cancelled',
         updated_at = NOW()
     WHERE id = $1`,
    [id]
  );

  return getSingleOutRequest(id);
};

const processOutRequest = async (
  id: number,
  payload: IProcessOutRequestPayload
): Promise<IOutRequestWithRelations> => {
  await UsersService.getSingleUser(payload.out_by);

  const existing = await getSingleOutRequest(id);

  if (existing.status !== 'approved') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only approved out requests can be processed for outbound stock'
    );
  }

  const payloadItems = payload.items ?? [];
  const payloadItemMap = new Map(
    payloadItems.map(item => [item.item_id, item.out_quantity])
  );

  const itemsToProcess = payloadItems.length
    ? existing.items.filter(item => payloadItemMap.has(item.item_id))
    : existing.items.filter(item => item.status !== 'out');

  if (!itemsToProcess.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'No eligible items found to process for outbound stock'
    );
  }

  const stockChecks: Array<{
    item_id: number;
    item_name: string | null | undefined;
    quantity: number;
    available: number;
  }> = [];

  const operations = itemsToProcess.map(item => {
    const quantityThisOperation = resolveItemOutQuantity(
      Number(item.requested_quantity),
      item.out_quantity,
      payloadItemMap.get(item.item_id)
    );

    const available = Number(item.available_quantity ?? 0);

    if (available < quantityThisOperation) {
      stockChecks.push({
        item_id: item.item_id,
        item_name: item.item_name,
        quantity: quantityThisOperation,
        available,
      });
    }

    const totalOutQuantity = (item.out_quantity ?? 0) + quantityThisOperation;

    return {
      item,
      quantityThisOperation,
      totalOutQuantity,
      nextStatus: resolveItemStatus(
        Number(item.requested_quantity),
        totalOutQuantity
      ),
    };
  });

  if (stockChecks.length) {
    const details = stockChecks
      .map(
        check =>
          `${check.item_name ?? `Item #${check.item_id}`}: available ${check.available}, required ${check.quantity}`
      )
      .join('; ');

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Insufficient stock for one or more items. ${details}`
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await InventoryService.decreaseFromOutRequestItems(
      client,
      existing.source_location_id,
      id,
      operations.map(operation => ({
        item_id: operation.item.item_id,
        quantity: operation.quantityThisOperation,
      }))
    );

    for (const operation of operations) {
      await client.query(
        `UPDATE out_request_items
         SET out_quantity = $2,
             status = $3,
             out_by = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [
          operation.item.id,
          operation.totalOutQuantity,
          operation.nextStatus,
          payload.out_by,
        ]
      );
    }

    const allItemsOut = existing.items.every(item => {
      const operation = operations.find(
        current => current.item.id === item.id
      );

      if (operation) {
        return operation.nextStatus === 'out';
      }

      return item.status === 'out';
    });

    if (allItemsOut) {
      await client.query(
        `UPDATE out_requests
         SET status = 'out',
             out_by = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [id, payload.out_by]
      );
    } else {
      await client.query(
        `UPDATE out_requests
         SET updated_at = NOW()
         WHERE id = $1`,
        [id]
      );
    }

    await client.query('COMMIT');

    return getSingleOutRequest(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const OutRequestsService = {
  createOutRequest,
  getAllOutRequests,
  getSingleOutRequest,
  updateOutRequest,
  deleteOutRequest,
  approveOutRequest,
  cancelOutRequest,
  processOutRequest,
};

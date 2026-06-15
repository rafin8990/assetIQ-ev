import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { generateTransferNumber } from '../../../helpers/transferNumberHelper';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { InventoryService } from '../inventory/inventory.service';
import { ItemsService } from '../items/items.service';
import { LocationsService } from '../locations/locations.service';
import { UnitsService } from '../units/units.service';
import { UsersService } from '../users/users.service';
import {
  STOCK_MOVEMENTS_SORTABLE_FIELDS,
  STOCK_MOVEMENTS_SORT_COLUMN_MAP,
} from './stock-movements.constant';
import {
  resolveHeaderStatus,
  resolveItemStatus,
  resolveLineQuantity,
} from './stock-movements.helpers';
import {
  ICreateStockMovementPayload,
  IStockMovement,
  IStockMovementActionPayload,
  IStockMovementFilters,
  IStockMovementItemPayload,
  IStockMovementItemWithRelations,
  IStockMovementWithRelations,
  StockMovementStatus,
} from './stock-movements.interface';

const MOVEMENT_SELECT = `
  sm.id, sm.movement_number, sm.status, sm.source_location_id, sm.destination_location_id,
  sm.notes, sm.requested_by, sm.approved_by, sm.ready_by, sm.transferred_by, sm.confirmed_by,
  sm.created_at, sm.updated_at,
  src.name AS source_location_name,
  dest.name AS destination_location_name,
  requester.name AS requested_by_name,
  approver.name AS approved_by_name,
  ready_user.name AS ready_by_name,
  transfer_user.name AS transferred_by_name,
  confirm_user.name AS confirmed_by_name
`;

const MOVEMENT_JOINS = `
  FROM stock_movements sm
  LEFT JOIN locations src ON src.id = sm.source_location_id
  LEFT JOIN locations dest ON dest.id = sm.destination_location_id
  LEFT JOIN users requester ON requester.id = sm.requested_by
  LEFT JOIN users approver ON approver.id = sm.approved_by
  LEFT JOIN users ready_user ON ready_user.id = sm.ready_by
  LEFT JOIN users transfer_user ON transfer_user.id = sm.transferred_by
  LEFT JOIN users confirm_user ON confirm_user.id = sm.confirmed_by
`;

const getMovementItems = async (
  movementId: number,
  sourceLocationId?: number
): Promise<IStockMovementItemWithRelations[]> => {
  const result = await pool.query<IStockMovementItemWithRelations>(
    `SELECT
      smi.id, smi.movement_id, smi.item_id, smi.requested_quantity,
      smi.ready_quantity, smi.transferred_quantity, smi.confirmed_quantity,
      smi.unit_id, smi.status, smi.created_at, smi.updated_at,
      i.name AS item_name,
      u.name AS unit_name
     FROM stock_movement_items smi
     LEFT JOIN items i ON i.id = smi.item_id
     LEFT JOIN units u ON u.id = smi.unit_id
     WHERE smi.movement_id = $1
     ORDER BY smi.id ASC`,
    [movementId]
  );

  if (!sourceLocationId) return result.rows;

  return Promise.all(
    result.rows.map(async row => ({
      ...row,
      available_quantity: await InventoryService.getAvailableQuantity(
        sourceLocationId,
        row.item_id
      ),
    }))
  );
};

const getSingleStockMovement = async (
  id: number
): Promise<IStockMovementWithRelations> => {
  const result = await pool.query<IStockMovementWithRelations>(
    `SELECT ${MOVEMENT_SELECT} ${MOVEMENT_JOINS} WHERE sm.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Stock movement not found');
  }

  const movement = result.rows[0];
  const items = await getMovementItems(id, movement.source_location_id);

  return { ...movement, items };
};

const validateMovementItems = async (items: IStockMovementItemPayload[]) => {
  for (const item of items) {
    await ItemsService.getSingleItem(item.item_id);
    if (item.unit_id) await UnitsService.getSingleUnit(item.unit_id);
  }
};

const insertMovementItems = async (
  client: { query: typeof pool.query },
  movementId: number,
  items: IStockMovementItemPayload[]
) => {
  for (const item of items) {
    await client.query(
      `INSERT INTO stock_movement_items (
        movement_id, item_id, requested_quantity, unit_id
      ) VALUES ($1, $2, $3, $4)`,
      [movementId, item.item_id, item.requested_quantity, item.unit_id ?? null]
    );
  }
};

const createStockMovement = async (
  payload: ICreateStockMovementPayload
): Promise<IStockMovementWithRelations> => {
  if (payload.source_location_id === payload.destination_location_id) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Source and destination locations must be different'
    );
  }

  await UsersService.getSingleUser(payload.requested_by);
  await LocationsService.getSingleLocation(payload.source_location_id);
  await LocationsService.getSingleLocation(payload.destination_location_id);
  await validateMovementItems(payload.items);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const movementNumber = await generateTransferNumber();

    const result = await client.query<IStockMovement>(
      `INSERT INTO stock_movements (
        movement_number, status, source_location_id, destination_location_id,
        notes, requested_by
      ) VALUES ($1, 'pending', $2, $3, $4, $5) RETURNING *`,
      [
        movementNumber,
        payload.source_location_id,
        payload.destination_location_id,
        payload.notes ?? null,
        payload.requested_by,
      ]
    );

    await insertMovementItems(client, result.rows[0].id, payload.items);
    await client.query('COMMIT');

    return getSingleStockMovement(result.rows[0].id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getAllStockMovements = async (
  filters: IStockMovementFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = STOCK_MOVEMENTS_SORTABLE_FIELDS.includes(
    sortBy as (typeof STOCK_MOVEMENTS_SORTABLE_FIELDS)[number]
  )
    ? STOCK_MOVEMENTS_SORT_COLUMN_MAP[
        sortBy as keyof typeof STOCK_MOVEMENTS_SORT_COLUMN_MAP
      ]
    : STOCK_MOVEMENTS_SORT_COLUMN_MAP.created_at;
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(sm.movement_number ILIKE $${index} OR sm.notes ILIKE $${index})`
    );
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`sm.status = $${values.length}`);
  }

  if (filters.sourceLocationId) {
    values.push(filters.sourceLocationId);
    conditions.push(`sm.source_location_id = $${values.length}`);
  }

  if (filters.destinationLocationId) {
    values.push(filters.destinationLocationId);
    conditions.push(`sm.destination_location_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) ${MOVEMENT_JOINS} ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IStockMovementWithRelations>(
    `SELECT ${MOVEMENT_SELECT}
     ${MOVEMENT_JOINS}
     ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  const data = await Promise.all(
    dataResult.rows.map(async row => ({
      ...row,
      items: await getMovementItems(row.id, row.source_location_id),
    }))
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

const assertStatus = (
  movement: IStockMovement,
  allowed: StockMovementStatus[]
) => {
  if (!allowed.includes(movement.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Stock movement must be in status: ${allowed.join(', ')}`
    );
  }
};

const approveStockMovement = async (
  id: number,
  approvedBy: number
): Promise<IStockMovementWithRelations> => {
  const movement = await getSingleStockMovement(id);
  assertStatus(movement, ['pending']);

  for (const item of movement.items) {
    const available = await InventoryService.getAvailableQuantity(
      movement.source_location_id,
      item.item_id
    );
    if (available < Number(item.requested_quantity)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock at source for item ${item.item_id}. Available: ${available}, requested: ${item.requested_quantity}`
      );
    }
  }

  await pool.query(
    `UPDATE stock_movements
     SET status = 'approved', approved_by = $1, updated_at = NOW()
     WHERE id = $2`,
    [approvedBy, id]
  );

  return getSingleStockMovement(id);
};

const applyLineAction = async (
  movementId: number,
  userId: number,
  field: 'ready_quantity' | 'transferred_quantity' | 'confirmed_quantity',
  actorField: 'ready_by' | 'transferred_by' | 'confirmed_by',
  allowedStatuses: StockMovementStatus[],
  payload: IStockMovementActionPayload,
  label: string
) => {
  const movement = await getSingleStockMovement(movementId);
  assertStatus(movement, allowedStatuses);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const itemsInput = payload.items?.length
      ? payload.items
      : movement.items
          .filter(i => Number(i[field]) < Number(i.requested_quantity))
          .map(i => ({ item_id: i.item_id, quantity: null }));

    for (const input of itemsInput) {
      const line = movement.items.find(i => i.item_id === input.item_id);
      if (!line) continue;

      const addQty = resolveLineQuantity(
        Number(line.requested_quantity),
        Number(line[field]),
        input.quantity,
        label
      );

      const newReady =
        field === 'ready_quantity'
          ? Number(line.ready_quantity) + addQty
          : Number(line.ready_quantity);
      const newTransferred =
        field === 'transferred_quantity'
          ? Number(line.transferred_quantity) + addQty
          : Number(line.transferred_quantity);
      const newConfirmed =
        field === 'confirmed_quantity'
          ? Number(line.confirmed_quantity) + addQty
          : Number(line.confirmed_quantity);

      const newStatus = resolveItemStatus(
        Number(line.requested_quantity),
        newReady,
        newTransferred,
        newConfirmed
      );

      await client.query(
        `UPDATE stock_movement_items
         SET ${field} = ${field} + $1, status = $2, updated_at = NOW()
         WHERE id = $3`,
        [addQty, newStatus, line.id]
      );

      if (field === 'confirmed_quantity') {
        const consumed = await InventoryService.consumeLotsFifo(client, {
          locationId: movement.source_location_id,
          itemId: line.item_id,
          quantity: addQty,
          consumptionType: 'transfer',
          consumptionId: movementId,
        });

        await InventoryService.createLots(
          client,
          consumed.map(chunk => ({
            item_id: line.item_id,
            location_id: movement.destination_location_id,
            vendor_id: chunk.vendor_id,
            po_id: chunk.po_id,
            po_item_id: chunk.po_item_id,
            quantity: chunk.quantity,
            unit_id: chunk.unit_id ?? line.unit_id,
            source_type: 'transfer',
            source_id: movementId,
          }))
        );
      }
    }

    const updatedItems = await client.query<{
      requested_quantity: string;
      ready_quantity: string;
      transferred_quantity: string;
      confirmed_quantity: string;
    }>(`SELECT requested_quantity, ready_quantity, transferred_quantity, confirmed_quantity
        FROM stock_movement_items WHERE movement_id = $1`, [movementId]);

    const nextStatus = resolveHeaderStatus(
      updatedItems.rows.map(row => ({
        requested_quantity: Number(row.requested_quantity),
        ready_quantity: Number(row.ready_quantity),
        transferred_quantity: Number(row.transferred_quantity),
        confirmed_quantity: Number(row.confirmed_quantity),
      })),
      movement.status
    );

    await client.query(
      `UPDATE stock_movements
       SET status = $1, ${actorField} = $2, updated_at = NOW()
       WHERE id = $3`,
      [nextStatus, userId, movementId]
    );

    await client.query('COMMIT');
    return getSingleStockMovement(movementId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const readyStockMovement = async (
  id: number,
  userId: number,
  payload: IStockMovementActionPayload = {}
) =>
  applyLineAction(
    id,
    userId,
    'ready_quantity',
    'ready_by',
    ['approved', 'ready'],
    payload,
    'Ready quantity'
  );

const transferStockMovement = async (
  id: number,
  userId: number,
  payload: IStockMovementActionPayload = {}
) =>
  applyLineAction(
    id,
    userId,
    'transferred_quantity',
    'transferred_by',
    ['ready', 'in_transit'],
    payload,
    'Transfer quantity'
  );

const confirmStockMovement = async (
  id: number,
  userId: number,
  payload: IStockMovementActionPayload = {}
) =>
  applyLineAction(
    id,
    userId,
    'confirmed_quantity',
    'confirmed_by',
    ['in_transit'],
    payload,
    'Confirm quantity'
  );

const cancelStockMovement = async (
  id: number
): Promise<IStockMovementWithRelations> => {
  const movement = await getSingleStockMovement(id);

  if (movement.status === 'completed' || movement.status === 'cancelled') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel stock movement with status ${movement.status}`
    );
  }

  await pool.query(
    `UPDATE stock_movements SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [id]
  );

  return getSingleStockMovement(id);
};

export const StockMovementsService = {
  createStockMovement,
  getAllStockMovements,
  getSingleStockMovement,
  approveStockMovement,
  readyStockMovement,
  transferStockMovement,
  confirmStockMovement,
  cancelStockMovement,
};

import fs from 'fs';
import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { generatePoNumber } from '../../../helpers/poNumberHelper';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { getPurchaseOrderAttachmentDiskPath } from '../../middlewares/uploadPurchaseOrderAttachment';
import { ItemsService } from '../items/items.service';
import { UnitsService } from '../units/units.service';
import { UsersService } from '../users/users.service';
import { VendorsService } from '../vendors/vendors.service';
import {
  PURCHASE_ORDERS_SORTABLE_FIELDS,
  PURCHASE_ORDERS_SORT_COLUMN_MAP,
} from './purchase-orders.constant';
import {
  calculatePoItemTotal,
  calculatePurchaseOrderAmounts,
} from './purchase-orders.helpers';
import {
  ICreatePurchaseOrderPayload,
  IPoItemPayload,
  IPoItemWithRelations,
  IPurchaseOrder,
  IPurchaseOrderFilters,
  IPurchaseOrderWithRelations,
  PurchaseOrderStatus,
  IUpdatePurchaseOrderPayload,
} from './purchase-orders.interface';
import { PATCH_BLOCKED_STATUSES } from './purchase-orders.staging.helpers';

const PO_SELECT_FIELDS = `
  po.id, po.po_number, po.created_by, po.vendor_id, po.description, po.status,
  po.total_amount, po.paid_amount, po.due_amount, po.discount_amount,
  po.attachment, po.approved_by, po.received_by, po.staged_by, po.staged_at,
  po.order_type, po.created_at, po.updated_at,
  creator.name AS created_by_name,
  vendor.vendor_name AS vendor_name,
  vendor.company_name AS vendor_company_name,
  approver.name AS approved_by_name,
  receiver.name AS received_by_name,
  stager.name AS staged_by_name
`;

const PO_JOINS = `
  FROM purchase_orders po
  LEFT JOIN users creator ON creator.id = po.created_by
  LEFT JOIN vendors vendor ON vendor.id = po.vendor_id
  LEFT JOIN users approver ON approver.id = po.approved_by
  LEFT JOIN users receiver ON receiver.id = po.received_by
  LEFT JOIN users stager ON stager.id = po.staged_by
`;

const getPoRequisitions = async (
  poId: number
): Promise<
  Array<{
    id: number;
    req_id: string;
    description: string | null;
    status: string;
  }>
> => {
  const result = await pool.query<{
    id: number;
    req_id: string;
    description: string | null;
    status: string;
  }>(
    `SELECT r.id, r.req_id, r.description, r.status
     FROM purchase_order_requisitions por
     INNER JOIN requisitions r ON r.id = por.requisition_id
     WHERE por.po_id = $1
     ORDER BY r.req_id ASC`,
    [poId]
  );

  return result.rows;
};

const getPoItems = async (poId: number): Promise<IPoItemWithRelations[]> => {
  const result = await pool.query<IPoItemWithRelations>(
    `SELECT
      pi.id, pi.po_id, pi.item_id, pi.quantity,
      pi.received_quantity, pi.returned_quantity,
      pi.unit_id, pi.per_unit_amount, pi.total_amount, pi.discount_amount,
      pi.created_at, pi.updated_at,
      i.name AS item_name,
      u.name AS unit_name
     FROM po_items pi
     LEFT JOIN items i ON i.id = pi.item_id
     LEFT JOIN units u ON u.id = pi.unit_id
     WHERE pi.po_id = $1
     ORDER BY pi.id ASC`,
    [poId]
  );

  return result.rows;
};

const validatePoItems = async (items: IPoItemPayload[]) => {
  for (const item of items) {
    await ItemsService.getSingleItem(item.item_id);
    if (item.unit_id) {
      await UnitsService.getSingleUnit(item.unit_id);
    }
  }
};

const validateUserRefs = async (payload: {
  created_by?: number;
  approved_by?: number | null;
  received_by?: number | null;
}) => {
  if (payload.created_by !== undefined) {
    await UsersService.getSingleUser(payload.created_by);
  }
  if (payload.approved_by) {
    await UsersService.getSingleUser(payload.approved_by);
  }
  if (payload.received_by) {
    await UsersService.getSingleUser(payload.received_by);
  }
};

const validateVendorRef = async (vendorId?: number | null) => {
  if (vendorId) {
    await VendorsService.getSingleVendor(vendorId);
  }
};

const validateStatusTransition = (
  currentStatus: PurchaseOrderStatus,
  nextStatus: PurchaseOrderStatus
) => {
  if (currentStatus === nextStatus) return;

  if (
    currentStatus === 'cancelled' ||
    currentStatus === 'received' ||
    currentStatus === 'partially_received' ||
    currentStatus === 'fully_received' ||
    currentStatus === 'in_staging'
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot change status from ${currentStatus}`
    );
  }

  if (PATCH_BLOCKED_STATUSES.includes(nextStatus)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Status ${nextStatus} can only be set through staging workflow endpoints`
    );
  }

  if (nextStatus === 'received' && currentStatus !== 'approved') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Purchase order must be approved before marking as received'
    );
  }
};

const insertPoItems = async (
  client: { query: typeof pool.query },
  poId: number,
  items: IPoItemPayload[]
) => {
  for (const item of items) {
    const lineTotal = calculatePoItemTotal(item);

    await client.query(
      `INSERT INTO po_items (
        po_id, item_id, quantity, unit_id, per_unit_amount, total_amount, discount_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        poId,
        item.item_id,
        item.quantity,
        item.unit_id ?? null,
        item.per_unit_amount ?? null,
        lineTotal,
        item.discount_amount ?? null,
      ]
    );
  }
};

const validateRequisitionsForOrder = async (
  client: { query: typeof pool.query },
  requisitionIds: number[]
) => {
  const uniqueIds = [...new Set(requisitionIds)];

  if (!uniqueIds.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'At least one approved requisition is required'
    );
  }

  const result = await client.query<{ id: number; status: string }>(
    `SELECT id, status FROM requisitions WHERE id = ANY($1::int[])`,
    [uniqueIds]
  );

  if (result.rows.length !== uniqueIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more requisitions not found');
  }

  const invalid = result.rows.filter(row => row.status !== 'approved');

  if (invalid.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only approved requisitions that have not been ordered can be used'
    );
  }

  const linked = await client.query<{ requisition_id: number }>(
    `SELECT requisition_id FROM purchase_order_requisitions
     WHERE requisition_id = ANY($1::int[])`,
    [uniqueIds]
  );

  if (linked.rows.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'One or more requisitions are already linked to a purchase order'
    );
  }

  return uniqueIds;
};

const linkRequisitionsToPurchaseOrder = async (
  client: { query: typeof pool.query },
  poId: number,
  requisitionIds: number[]
) => {
  for (const requisitionId of requisitionIds) {
    await client.query(
      `INSERT INTO purchase_order_requisitions (po_id, requisition_id)
       VALUES ($1, $2)`,
      [poId, requisitionId]
    );
  }

  await client.query(
    `UPDATE requisitions
     SET status = 'ordered', updated_at = NOW()
     WHERE id = ANY($1::int[]) AND status = 'approved'`,
    [requisitionIds]
  );
};

const revertLinkedRequisitions = async (
  client: { query: typeof pool.query },
  poId: number
) => {
  await client.query(
    `UPDATE requisitions r
     SET status = 'approved', updated_at = NOW()
     FROM purchase_order_requisitions por
     WHERE por.po_id = $1
       AND por.requisition_id = r.id
       AND r.status = 'ordered'`,
    [poId]
  );
};

const removeAttachmentFile = (attachmentPath: string | null | undefined) => {
  if (!attachmentPath) return;

  const filePath = getPurchaseOrderAttachmentDiskPath(attachmentPath);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const createPurchaseOrder = async (
  payload: ICreatePurchaseOrderPayload,
  attachmentPath: string | null = null
): Promise<IPurchaseOrderWithRelations> => {
  await validateUserRefs(payload);
  await validateVendorRef(payload.vendor_id);
  await validatePoItems(payload.items);

  const amounts = calculatePurchaseOrderAmounts(
    payload.items,
    payload.discount_amount,
    payload.paid_amount
  );

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const poNumber = await generatePoNumber();
    const status = payload.status ?? 'pending';
    const orderType = payload.order_type ?? 'by_requisition';

    const result = await client.query<IPurchaseOrder>(
      `INSERT INTO purchase_orders (
        po_number, created_by, vendor_id, description, status,
        total_amount, paid_amount, due_amount, discount_amount,
        attachment, approved_by, received_by, order_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        poNumber,
        payload.created_by,
        payload.vendor_id ?? null,
        payload.description ?? null,
        status,
        amounts.total_amount,
        amounts.paid_amount,
        amounts.due_amount,
        amounts.discount_amount,
        attachmentPath,
        payload.approved_by ?? null,
        payload.received_by ?? null,
        orderType,
      ]
    );

    const purchaseOrder = result.rows[0];
    await insertPoItems(client, purchaseOrder.id, payload.items);

    if (orderType === 'by_requisition') {
      const requisitionIds = await validateRequisitionsForOrder(
        client,
        payload.requisition_ids ?? []
      );
      await linkRequisitionsToPurchaseOrder(
        client,
        purchaseOrder.id,
        requisitionIds
      );
    }

    await client.query('COMMIT');

    return getSinglePurchaseOrder(purchaseOrder.id);
  } catch (error) {
    await client.query('ROLLBACK');
    if (attachmentPath) {
      removeAttachmentFile(attachmentPath);
    }
    throw error;
  } finally {
    client.release();
  }
};

const getAllPurchaseOrders = async (
  filters: IPurchaseOrderFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = PURCHASE_ORDERS_SORTABLE_FIELDS.includes(
    sortBy as (typeof PURCHASE_ORDERS_SORTABLE_FIELDS)[number]
  )
    ? PURCHASE_ORDERS_SORT_COLUMN_MAP[
        sortBy as keyof typeof PURCHASE_ORDERS_SORT_COLUMN_MAP
      ]
    : PURCHASE_ORDERS_SORT_COLUMN_MAP.created_at;
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(po.po_number ILIKE $${index} OR po.description ILIKE $${index} OR creator.name ILIKE $${index} OR vendor.vendor_name ILIKE $${index} OR vendor.company_name ILIKE $${index})`
    );
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`po.status = $${values.length}`);
  }

  if (filters.orderType) {
    values.push(filters.orderType);
    conditions.push(`po.order_type = $${values.length}`);
  }

  if (filters.createdBy) {
    values.push(filters.createdBy);
    conditions.push(`po.created_by = $${values.length}`);
  }

  if (filters.vendorId) {
    values.push(filters.vendorId);
    conditions.push(`po.vendor_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) ${PO_JOINS} ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IPurchaseOrderWithRelations>(
    `SELECT ${PO_SELECT_FIELDS}
     ${PO_JOINS}
     ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  const data = await Promise.all(
    dataResult.rows.map(async row => {
      const items = await getPoItems(row.id);
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

const getSinglePurchaseOrder = async (
  id: number
): Promise<IPurchaseOrderWithRelations> => {
  const result = await pool.query<IPurchaseOrderWithRelations>(
    `SELECT ${PO_SELECT_FIELDS}
     ${PO_JOINS}
     WHERE po.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase order not found');
  }

  const [items, requisitions] = await Promise.all([
    getPoItems(id),
    getPoRequisitions(id),
  ]);

  return { ...result.rows[0], items, requisitions };
};

const updatePurchaseOrder = async (
  id: number,
  payload: IUpdatePurchaseOrderPayload,
  attachmentPath?: string | null
): Promise<IPurchaseOrderWithRelations> => {
  const existing = await getSinglePurchaseOrder(id);

  if (payload.status) {
    validateStatusTransition(existing.status, payload.status);
  }

  await validateUserRefs(payload);
  await validateVendorRef(payload.vendor_id);

  if (payload.items?.length) {
    await validatePoItems(payload.items);
  }

  const client = await pool.connect();
  let oldAttachmentToRemove: string | null = null;

  try {
    await client.query('BEGIN');

    const nextItemsForCalc: IPoItemPayload[] = payload.items
      ? payload.items
      : existing.items.map(item => ({
          item_id: item.item_id,
          quantity: Number(item.quantity),
          unit_id: item.unit_id,
          per_unit_amount: item.per_unit_amount,
          discount_amount: item.discount_amount,
        }));

    const amounts = calculatePurchaseOrderAmounts(
      nextItemsForCalc,
      payload.discount_amount !== undefined
        ? payload.discount_amount
        : existing.discount_amount,
      payload.paid_amount !== undefined
        ? payload.paid_amount
        : existing.paid_amount
    );

    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.created_by !== undefined) {
      values.push(payload.created_by);
      fields.push(`created_by = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'vendor_id')) {
      values.push(payload.vendor_id ?? null);
      fields.push(`vendor_id = $${values.length}`);
    }

    if (payload.description !== undefined) {
      values.push(payload.description ?? null);
      fields.push(`description = $${values.length}`);
    }

    if (payload.status !== undefined) {
      values.push(payload.status);
      fields.push(`status = $${values.length}`);
    }

    if (
      payload.items ||
      payload.discount_amount !== undefined ||
      payload.paid_amount !== undefined
    ) {
      values.push(amounts.total_amount);
      fields.push(`total_amount = $${values.length}`);
      values.push(amounts.paid_amount);
      fields.push(`paid_amount = $${values.length}`);
      values.push(amounts.due_amount);
      fields.push(`due_amount = $${values.length}`);
      values.push(amounts.discount_amount);
      fields.push(`discount_amount = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'approved_by')) {
      values.push(payload.approved_by ?? null);
      fields.push(`approved_by = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'received_by')) {
      values.push(payload.received_by ?? null);
      fields.push(`received_by = $${values.length}`);
    }

    if (payload.order_type !== undefined) {
      values.push(payload.order_type);
      fields.push(`order_type = $${values.length}`);
    }

    if (attachmentPath !== undefined) {
      if (existing.attachment && existing.attachment !== attachmentPath) {
        oldAttachmentToRemove = existing.attachment;
      }
      values.push(attachmentPath ?? null);
      fields.push(`attachment = $${values.length}`);
    } else if (Object.prototype.hasOwnProperty.call(payload, 'attachment')) {
      if (existing.attachment && payload.attachment !== existing.attachment) {
        oldAttachmentToRemove = existing.attachment;
      }
      values.push(payload.attachment ?? null);
      fields.push(`attachment = $${values.length}`);
    }

    if (fields.length) {
      fields.push('updated_at = NOW()');
      values.push(id);

      await client.query(
        `UPDATE purchase_orders SET ${fields.join(', ')} WHERE id = $${values.length}`,
        values
      );
    }

    if (payload.items) {
      await client.query(`DELETE FROM po_items WHERE po_id = $1`, [id]);
      await insertPoItems(client, id, payload.items);
    }

    await client.query('COMMIT');

    if (oldAttachmentToRemove) {
      removeAttachmentFile(oldAttachmentToRemove);
    }

    return getSinglePurchaseOrder(id);
  } catch (error) {
    await client.query('ROLLBACK');
    if (attachmentPath) {
      removeAttachmentFile(attachmentPath);
    }
    throw error;
  } finally {
    client.release();
  }
};

const deletePurchaseOrder = async (id: number): Promise<IPurchaseOrder> => {
  const purchaseOrder = await getSinglePurchaseOrder(id);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await revertLinkedRequisitions(client, id);

    const result = await client.query<IPurchaseOrder>(
      `DELETE FROM purchase_orders WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query('COMMIT');
    removeAttachmentFile(purchaseOrder.attachment);

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const approvePurchaseOrder = async (
  id: number,
  approvedBy: number
): Promise<IPurchaseOrderWithRelations> => {
  const existing = await getSinglePurchaseOrder(id);

  if (existing.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending purchase orders can be approved'
    );
  }

  return updatePurchaseOrder(id, {
    status: 'approved',
    approved_by: approvedBy,
  });
};

const cancelPurchaseOrder = async (
  id: number
): Promise<IPurchaseOrderWithRelations> => {
  const existing = await getSinglePurchaseOrder(id);

  if (existing.status !== 'pending' && existing.status !== 'approved') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only pending or approved purchase orders can be cancelled'
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (existing.order_type === 'by_requisition') {
      await revertLinkedRequisitions(client, id);
    }

    await client.query(
      `UPDATE purchase_orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    return getSinglePurchaseOrder(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const PurchaseOrdersService = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getSinglePurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
};

import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { InventoryService } from '../inventory/inventory.service';
import { LocationsService } from '../locations/locations.service';
import { STAGING_PURCHASE_ORDER_STATUSES } from './purchase-orders.constant';
import {
  IPoItemWithRelations,
  IPoVendorReturn,
  IStagingPurchaseOrderDetail,
  IStagingPurchaseOrderFilters,
  IStagingPurchaseOrderSummary,
  IStagingPoItem,
  IStagingReceiptItemPayload,
  IVendorReturnItemPayload,
  PurchaseOrderStatus,
} from './purchase-orders.interface';
import {
  computeReceivingStatus,
  countFullyReceivedLines,
  STAGING_ELIGIBLE_STATUSES,
} from './purchase-orders.staging.helpers';

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

const getPoItemsWithStaging = async (
  poId: number
): Promise<IPoItemWithRelations[]> => {
  const result = await pool.query<IPoItemWithRelations>(
    `SELECT
      pi.id, pi.po_id, pi.item_id, pi.quantity,
      pi.received_quantity, pi.returned_quantity, pi.accepted_quantity,
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

const mapStagingItems = (items: IPoItemWithRelations[]): IStagingPoItem[] =>
  items.map(item => {
    const ordered = Number(item.quantity);
    const received = Number(item.received_quantity ?? 0);
    const returned = Number(item.returned_quantity ?? 0);
    const accepted = Number(item.accepted_quantity ?? 0);

    return {
      ...item,
      ordered_quantity: ordered,
      received_quantity: received,
      returned_quantity: returned,
      accepted_quantity: accepted,
      in_staging_quantity: Math.max(0, received - returned - accepted),
      is_line_fully_received: received >= ordered,
    };
  });

const getVendorReturns = async (poId: number): Promise<IPoVendorReturn[]> => {
  const result = await pool.query<IPoVendorReturn>(
    `SELECT
      pvr.id, pvr.po_id, pvr.po_item_id, pvr.quantity, pvr.reason,
      pvr.returned_by, pvr.created_at,
      i.name AS item_name,
      u.name AS returned_by_name
     FROM po_vendor_returns pvr
     LEFT JOIN po_items pi ON pi.id = pvr.po_item_id
     LEFT JOIN items i ON i.id = pi.item_id
     LEFT JOIN users u ON u.id = pvr.returned_by
     WHERE pvr.po_id = $1
     ORDER BY pvr.created_at DESC`,
    [poId]
  );

  return result.rows;
};

const assertStagingEligible = (status: PurchaseOrderStatus) => {
  if (!STAGING_ELIGIBLE_STATUSES.includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Purchase order is not eligible for staging operations'
    );
  }
};

const getPurchaseOrderHeader = async (id: number) => {
  const result = await pool.query(
    `SELECT ${PO_SELECT_FIELDS} ${PO_JOINS} WHERE po.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase order not found');
  }

  return result.rows[0];
};

const listStagingPurchaseOrders = async (
  filters: IStagingPurchaseOrderFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);

  const values: unknown[] = [];
  const conditions: string[] = [
    `po.status = ANY($${values.length + 1}::text[])`,
  ];
  values.push([...STAGING_PURCHASE_ORDER_STATUSES]);

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(po.po_number ILIKE $${index} OR po.description ILIKE $${index} OR vendor.vendor_name ILIKE $${index} OR vendor.company_name ILIKE $${index})`
    );
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`po.status = $${values.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) ${PO_JOINS} ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query(
    `SELECT ${PO_SELECT_FIELDS}
     ${PO_JOINS}
     ${whereClause}
     ORDER BY po.updated_at DESC
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  const data: IStagingPurchaseOrderSummary[] = await Promise.all(
    dataResult.rows.map(async row => {
      const items = await getPoItemsWithStaging(row.id);
      const { fullyReceivedLines, totalLines } = countFullyReceivedLines(
        items.map(item => ({
          quantity: Number(item.quantity),
          received_quantity: Number(item.received_quantity ?? 0),
        }))
      );

      return {
        ...row,
        items,
        fully_received_lines: fullyReceivedLines,
        total_lines: totalLines,
      };
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

const getStagingDetail = async (
  id: number
): Promise<IStagingPurchaseOrderDetail> => {
  const header = await getPurchaseOrderHeader(id);
  const items = mapStagingItems(await getPoItemsWithStaging(id));
  const returns = await getVendorReturns(id);
  const { fullyReceivedLines, totalLines } = countFullyReceivedLines(items);

  return {
    ...header,
    items,
    returns,
    fully_received_lines: fullyReceivedLines,
    total_lines: totalLines,
  };
};

const recordStagingReceipt = async (
  poId: number,
  userId: number,
  items: IStagingReceiptItemPayload[]
) => {
  if (!items.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'At least one item is required to record receipt'
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const poResult = await client.query<{ status: PurchaseOrderStatus }>(
      `SELECT status FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (!poResult.rows.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Purchase order not found');
    }

    const currentStatus = poResult.rows[0].status;
    assertStagingEligible(currentStatus);

    for (const entry of items) {
      if (entry.quantity <= 0) continue;

      const itemResult = await client.query<{
        id: number;
        quantity: string;
        received_quantity: string;
      }>(
        `SELECT id, quantity, received_quantity
         FROM po_items
         WHERE id = $1 AND po_id = $2`,
        [entry.po_item_id, poId]
      );

      if (!itemResult.rows.length) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Purchase order item ${entry.po_item_id} not found`
        );
      }

      const line = itemResult.rows[0];
      const ordered = Number(line.quantity);
      const currentReceived = Number(line.received_quantity);
      const nextReceived = currentReceived + entry.quantity;

      if (nextReceived > ordered) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Received quantity cannot exceed ordered quantity for item ${entry.po_item_id}`
        );
      }

      await client.query(
        `UPDATE po_items
         SET received_quantity = $1, updated_at = NOW()
         WHERE id = $2`,
        [nextReceived, entry.po_item_id]
      );
    }

    const updatedItems = await client.query<{
      quantity: string;
      received_quantity: string;
    }>(`SELECT quantity, received_quantity FROM po_items WHERE po_id = $1`, [
      poId,
    ]);

    const nextStatus = computeReceivingStatus(
      updatedItems.rows.map(row => ({
        quantity: Number(row.quantity),
        received_quantity: Number(row.received_quantity),
      }))
    );

    await client.query(
      `UPDATE purchase_orders
       SET status = $1,
           staged_by = COALESCE(staged_by, $2),
           staged_at = COALESCE(staged_at, NOW()),
           updated_at = NOW()
       WHERE id = $3`,
      [nextStatus, userId, poId]
    );

    await client.query('COMMIT');

    return getStagingDetail(poId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const returnToVendor = async (
  poId: number,
  userId: number,
  items: IVendorReturnItemPayload[]
) => {
  if (!items.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'At least one item is required to return to vendor'
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const poResult = await client.query<{ status: PurchaseOrderStatus }>(
      `SELECT status FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (!poResult.rows.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Purchase order not found');
    }

    assertStagingEligible(poResult.rows[0].status);

    for (const entry of items) {
      const trimmedReason = entry.reason?.trim();
      if (!trimmedReason) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Return reason is required for each item'
        );
      }

      if (entry.quantity <= 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Return quantity must be greater than zero'
        );
      }

      const itemResult = await client.query<{
        id: number;
        received_quantity: string;
        returned_quantity: string;
      }>(
        `SELECT id, received_quantity, returned_quantity
         FROM po_items
         WHERE id = $1 AND po_id = $2`,
        [entry.po_item_id, poId]
      );

      if (!itemResult.rows.length) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Purchase order item ${entry.po_item_id} not found`
        );
      }

      const line = itemResult.rows[0];
      const received = Number(line.received_quantity);
      const returned = Number(line.returned_quantity);
      const inStaging = received - returned;

      if (entry.quantity > inStaging) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Return quantity cannot exceed in-staging quantity for item ${entry.po_item_id}`
        );
      }

      await client.query(
        `UPDATE po_items
         SET returned_quantity = returned_quantity + $1, updated_at = NOW()
         WHERE id = $2`,
        [entry.quantity, entry.po_item_id]
      );

      await client.query(
        `INSERT INTO po_vendor_returns (
          po_id, po_item_id, quantity, reason, returned_by
        ) VALUES ($1, $2, $3, $4, $5)`,
        [poId, entry.po_item_id, entry.quantity, trimmedReason, userId]
      );
    }

    await client.query(
      `UPDATE purchase_orders SET updated_at = NOW() WHERE id = $1`,
      [poId]
    );

    await client.query('COMMIT');

    return getStagingDetail(poId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const acceptStagingToStock = async (
  poId: number,
  userId: number,
  payload: {
    items: Array<{
      po_item_id: number;
      quantity: number;
      location_id: number;
    }>;
  }
) => {
  if (!payload.items.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'At least one item is required to accept to stock'
    );
  }

  const locationIds = [
    ...new Set(payload.items.map(entry => entry.location_id)),
  ];
  await Promise.all(
    locationIds.map(locationId =>
      LocationsService.getSingleLocation(locationId)
    )
  );

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const poResult = await client.query<{
      status: PurchaseOrderStatus;
      vendor_id: number | null;
    }>(
      `SELECT status, vendor_id FROM purchase_orders WHERE id = $1 FOR UPDATE`,
      [poId]
    );

    if (!poResult.rows.length) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Purchase order not found');
    }

    assertStagingEligible(poResult.rows[0].status);
    const vendorId = poResult.rows[0].vendor_id;

    const lotsToCreate: Array<{
      item_id: number;
      location_id: number;
      vendor_id: number | null;
      po_id: number;
      po_item_id: number;
      quantity: number;
      unit_id: number | null;
      source_type: 'po_accept';
      source_id: number;
    }> = [];

    for (const entry of payload.items) {
      if (entry.quantity <= 0) continue;

      const itemResult = await client.query<{
        id: number;
        item_id: number;
        quantity: string;
        received_quantity: string;
        returned_quantity: string;
        accepted_quantity: string;
        unit_id: number | null;
      }>(
        `SELECT id, item_id, quantity, received_quantity, returned_quantity,
                accepted_quantity, unit_id
         FROM po_items WHERE id = $1 AND po_id = $2`,
        [entry.po_item_id, poId]
      );

      if (!itemResult.rows.length) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Purchase order item ${entry.po_item_id} not found`
        );
      }

      const line = itemResult.rows[0];
      const received = Number(line.received_quantity);
      const returned = Number(line.returned_quantity);
      const accepted = Number(line.accepted_quantity);
      const availableToAccept = received - returned - accepted;

      if (entry.quantity > availableToAccept) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Accept quantity cannot exceed in-staging quantity for item ${entry.po_item_id}`
        );
      }

      await client.query(
        `UPDATE po_items
         SET accepted_quantity = accepted_quantity + $1, updated_at = NOW()
         WHERE id = $2`,
        [entry.quantity, entry.po_item_id]
      );

      lotsToCreate.push({
        item_id: line.item_id,
        location_id: entry.location_id,
        vendor_id: vendorId,
        po_id: poId,
        po_item_id: line.id,
        quantity: entry.quantity,
        unit_id: line.unit_id,
        source_type: 'po_accept',
        source_id: poId,
      });
    }

    if (!lotsToCreate.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'At least one item with quantity greater than zero is required'
      );
    }

    await InventoryService.createLots(client, lotsToCreate);

    const itemsAfter = await client.query<{
      quantity: string;
      accepted_quantity: string;
      returned_quantity: string;
      received_quantity: string;
    }>(`SELECT quantity, accepted_quantity, returned_quantity, received_quantity
        FROM po_items WHERE po_id = $1`, [poId]);

    const allAccepted = itemsAfter.rows.every(row => {
      const ordered = Number(row.quantity);
      const acceptedQty = Number(row.accepted_quantity);
      const returned = Number(row.returned_quantity);
      return acceptedQty + returned >= ordered;
    });

    if (allAccepted) {
      await client.query(
        `UPDATE purchase_orders
         SET status = 'received', received_by = $1, updated_at = NOW()
         WHERE id = $2`,
        [userId, poId]
      );
    }

    await client.query('COMMIT');

    return getStagingDetail(poId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const PurchaseOrdersStagingService = {
  listStagingPurchaseOrders,
  getStagingDetail,
  getVendorReturns,
  recordStagingReceipt,
  returnToVendor,
  acceptStagingToStock,
};

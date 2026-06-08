import fs from 'fs';
import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import { generateReqId } from '../../../helpers/reqIdHelper';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/pagination';
import pool from '../../../utils/dbClient';
import { getRequisitionAttachmentDiskPath } from '../../middlewares/uploadRequisitionAttachment';
import { ItemsService } from '../items/items.service';
import { UnitsService } from '../units/units.service';
import { UsersService } from '../users/users.service';
import {
  REQUISITIONS_SORTABLE_FIELDS,
  REQUISITIONS_SORT_COLUMN_MAP,
} from './requisitions.constant';
import {
  ICreateRequisitionPayload,
  IRequisition,
  IRequisitionFilters,
  IRequisitionItemPayload,
  IRequisitionItemWithRelations,
  IRequisitionWithRelations,
  IUpdateRequisitionPayload,
} from './requisitions.interface';

const REQUISITION_SELECT_FIELDS = `
  r.id, r.req_id, r.description, r.created_by, r.approved_by,
  r.status, r.attachment, r.created_at, r.updated_at,
  creator.name AS created_by_name,
  approver.name AS approved_by_name
`;

const REQUISITION_JOINS = `
  FROM requisitions r
  LEFT JOIN users creator ON creator.id = r.created_by
  LEFT JOIN users approver ON approver.id = r.approved_by
`;

const getRequisitionItems = async (
  requisitionId: number
): Promise<IRequisitionItemWithRelations[]> => {
  const result = await pool.query<IRequisitionItemWithRelations>(
    `SELECT
      ri.id, ri.requisition_id, ri.item_id, ri.quantity, ri.unit_id,
      ri.created_at, ri.updated_at,
      i.name AS item_name,
      u.name AS unit_name
     FROM requisition_items ri
     LEFT JOIN items i ON i.id = ri.item_id
     LEFT JOIN units u ON u.id = ri.unit_id
     WHERE ri.requisition_id = $1
     ORDER BY ri.id ASC`,
    [requisitionId]
  );

  return result.rows;
};

const validateRequisitionItems = async (items: IRequisitionItemPayload[]) => {
  for (const item of items) {
    await ItemsService.getSingleItem(item.item_id);
    await UnitsService.getSingleUnit(item.unit_id);
  }
};

const insertRequisitionItems = async (
  client: { query: typeof pool.query },
  requisitionId: number,
  items: IRequisitionItemPayload[]
) => {
  for (const item of items) {
    await client.query(
      `INSERT INTO requisition_items (requisition_id, item_id, quantity, unit_id)
       VALUES ($1, $2, $3, $4)`,
      [requisitionId, item.item_id, item.quantity, item.unit_id]
    );
  }
};

const removeAttachmentFile = (attachmentPath: string | null | undefined) => {
  if (!attachmentPath) return;

  const filePath = getRequisitionAttachmentDiskPath(attachmentPath);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const createRequisition = async (
  payload: ICreateRequisitionPayload,
  attachmentPath: string | null = null
): Promise<IRequisitionWithRelations> => {
  await UsersService.getSingleUser(payload.created_by);

  if (payload.approved_by) {
    await UsersService.getSingleUser(payload.approved_by);
  }

  await validateRequisitionItems(payload.items);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const reqId = await generateReqId();
    const status = payload.status ?? 'pending';

    const result = await client.query<IRequisition>(
      `INSERT INTO requisitions (
        req_id, description, created_by, approved_by, status, attachment
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        reqId,
        payload.description ?? null,
        payload.created_by,
        payload.approved_by ?? null,
        status,
        attachmentPath,
      ]
    );

    const requisition = result.rows[0];
    await insertRequisitionItems(client, requisition.id, payload.items);

    await client.query('COMMIT');

    return getSingleRequisition(requisition.id);
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

const getAllRequisitions = async (
  filters: IRequisitionFilters,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const safeSortBy = REQUISITIONS_SORTABLE_FIELDS.includes(
    sortBy as (typeof REQUISITIONS_SORTABLE_FIELDS)[number]
  )
    ? REQUISITIONS_SORT_COLUMN_MAP[
        sortBy as keyof typeof REQUISITIONS_SORT_COLUMN_MAP
      ]
    : REQUISITIONS_SORT_COLUMN_MAP.created_at;
  const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.searchTerm) {
    values.push(`%${filters.searchTerm}%`);
    const index = values.length;
    conditions.push(
      `(r.req_id ILIKE $${index} OR r.description ILIKE $${index} OR creator.name ILIKE $${index})`
    );
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`r.status = $${values.length}`);
  }

  if (filters.createdBy) {
    values.push(filters.createdBy);
    conditions.push(`r.created_by = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) ${REQUISITION_JOINS} ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataValues = [...values, limit, skip];
  const dataResult = await pool.query<IRequisitionWithRelations>(
    `SELECT ${REQUISITION_SELECT_FIELDS}
     ${REQUISITION_JOINS}
     ${whereClause}
     ORDER BY ${safeSortBy} ${safeSortOrder}
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  const data = await Promise.all(
    dataResult.rows.map(async row => {
      const items = await getRequisitionItems(row.id);
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

const getSingleRequisition = async (
  id: number
): Promise<IRequisitionWithRelations> => {
  const result = await pool.query<IRequisitionWithRelations>(
    `SELECT ${REQUISITION_SELECT_FIELDS}
     ${REQUISITION_JOINS}
     WHERE r.id = $1`,
    [id]
  );

  if (!result.rows.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Requisition not found');
  }

  const items = await getRequisitionItems(id);
  return { ...result.rows[0], items };
};

const updateRequisition = async (
  id: number,
  payload: IUpdateRequisitionPayload,
  attachmentPath?: string | null
): Promise<IRequisitionWithRelations> => {
  const existing = await getSingleRequisition(id);

  if (payload.created_by !== undefined) {
    await UsersService.getSingleUser(payload.created_by);
  }

  if (payload.approved_by) {
    await UsersService.getSingleUser(payload.approved_by);
  }

  if (payload.items?.length) {
    await validateRequisitionItems(payload.items);
  }

  const client = await pool.connect();
  let oldAttachmentToRemove: string | null = null;

  try {
    await client.query('BEGIN');

    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.description !== undefined) {
      values.push(payload.description ?? null);
      fields.push(`description = $${values.length}`);
    }

    if (payload.created_by !== undefined) {
      values.push(payload.created_by);
      fields.push(`created_by = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'approved_by')) {
      values.push(payload.approved_by ?? null);
      fields.push(`approved_by = $${values.length}`);
    }

    if (payload.status !== undefined) {
      values.push(payload.status);
      fields.push(`status = $${values.length}`);
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
        `UPDATE requisitions SET ${fields.join(', ')} WHERE id = $${values.length}`,
        values
      );
    }

    if (payload.items) {
      await client.query(`DELETE FROM requisition_items WHERE requisition_id = $1`, [
        id,
      ]);
      await insertRequisitionItems(client, id, payload.items);
    }

    await client.query('COMMIT');

    if (oldAttachmentToRemove) {
      removeAttachmentFile(oldAttachmentToRemove);
    }

    return getSingleRequisition(id);
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

const deleteRequisition = async (id: number): Promise<IRequisition> => {
  const requisition = await getSingleRequisition(id);

  const result = await pool.query<IRequisition>(
    `DELETE FROM requisitions WHERE id = $1 RETURNING *`,
    [id]
  );

  removeAttachmentFile(requisition.attachment);

  return result.rows[0];
};

export const RequisitionsService = {
  createRequisition,
  getAllRequisitions,
  getSingleRequisition,
  updateRequisition,
  deleteRequisition,
};

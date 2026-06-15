import { ZodError } from 'zod';

import {
  parseOptionalFloat,
  parseOptionalInt,
  parseOptionalString,
} from '../items/items.helpers';
import {
  ICreatePurchaseOrderPayload,
  IUpdatePurchaseOrderPayload,
} from './purchase-orders.interface';
import {
  createPurchaseOrderBodySchema,
  updatePurchaseOrderBodySchema,
} from './purchase-orders.validation';

const parseRequisitionIdsField = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(Number) : undefined;
    } catch {
      throw new ZodError([
        {
          code: 'custom',
          path: ['requisition_ids'],
          message: 'Requisition ids must be a valid JSON array',
        },
      ]);
    }
  }

  if (Array.isArray(value)) {
    return value.map(item => Number(item));
  }

  return undefined;
};

const parseItemsField = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      throw new ZodError([
        {
          code: 'custom',
          path: ['items'],
          message: 'Items must be a valid JSON array',
        },
      ]);
    }
  }

  return value;
};

const parseOptionalAmount = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const parseCreatePurchaseOrderFormBody = (
  body: Record<string, unknown>
): ICreatePurchaseOrderPayload => {
  const payload = {
    created_by: parseOptionalInt(body.created_by),
    description: parseOptionalString(body.description),
    status: body.status !== undefined ? String(body.status) : undefined,
    paid_amount: parseOptionalAmount(body.paid_amount),
    discount_amount: parseOptionalAmount(body.discount_amount),
    approved_by: parseOptionalInt(body.approved_by),
    vendor_id: parseOptionalInt(body.vendor_id),
    received_by: parseOptionalInt(body.received_by),
    order_type:
      body.order_type !== undefined ? String(body.order_type) : undefined,
    requisition_ids: parseRequisitionIdsField(body.requisition_ids),
    items: parseItemsField(body.items),
  };

  try {
    return createPurchaseOrderBodySchema.parse(
      payload
    ) as ICreatePurchaseOrderPayload;
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw error;
  }
};

export const parseUpdatePurchaseOrderFormBody = (
  body: Record<string, unknown>
): IUpdatePurchaseOrderPayload => {
  const payload: Record<string, unknown> = {};

  if (body.created_by !== undefined) {
    payload.created_by = parseOptionalInt(body.created_by);
  }

  if (body.description !== undefined) {
    payload.description = parseOptionalString(body.description);
  }

  if (body.status !== undefined) {
    payload.status = String(body.status);
  }

  if (body.paid_amount !== undefined) {
    payload.paid_amount = parseOptionalAmount(body.paid_amount);
  }

  if (body.discount_amount !== undefined) {
    payload.discount_amount = parseOptionalAmount(body.discount_amount);
  }

  if (body.approved_by !== undefined) {
    payload.approved_by = parseOptionalInt(body.approved_by);
  }

  if (body.vendor_id !== undefined) {
    payload.vendor_id = parseOptionalInt(body.vendor_id);
  }

  if (body.received_by !== undefined) {
    payload.received_by = parseOptionalInt(body.received_by);
  }

  if (body.order_type !== undefined) {
    payload.order_type = String(body.order_type);
  }

  if (body.items !== undefined) {
    payload.items = parseItemsField(body.items);
  }

  try {
    return updatePurchaseOrderBodySchema.parse(
      payload
    ) as IUpdatePurchaseOrderPayload;
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw error;
  }
};

export const calculatePoItemTotal = (item: {
  quantity: number;
  per_unit_amount?: number | null;
  discount_amount?: number | null;
}) => {
  const perUnit = item.per_unit_amount ?? 0;
  const lineSubtotal = perUnit * item.quantity;
  const lineDiscount = item.discount_amount ?? 0;
  return Math.max(0, lineSubtotal - lineDiscount);
};

export const calculatePurchaseOrderAmounts = (
  items: Array<{
    quantity: number;
    per_unit_amount?: number | null;
    discount_amount?: number | null;
  }>,
  headerDiscount?: number | null,
  paidAmount?: number | null
) => {
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + calculatePoItemTotal(item),
    0
  );
  const discount = headerDiscount ?? 0;
  const totalAmount = Math.max(0, itemsSubtotal - discount);
  const paid = paidAmount ?? 0;
  const dueAmount = Math.max(0, totalAmount - paid);

  return {
    total_amount: totalAmount,
    paid_amount: paid,
    due_amount: dueAmount,
    discount_amount: discount,
  };
};

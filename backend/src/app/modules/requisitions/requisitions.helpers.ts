import { ZodError } from 'zod';

import {
  parseOptionalInt,
  parseOptionalString,
} from '../items/items.helpers';
import {
  ICreateRequisitionPayload,
  IUpdateRequisitionPayload,
} from './requisitions.interface';
import {
  createRequisitionBodySchema,
  updateRequisitionBodySchema,
} from './requisitions.validation';

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

export const parseCreateRequisitionFormBody = (
  body: Record<string, unknown>
): ICreateRequisitionPayload => {
  const payload = {
    description: parseOptionalString(body.description),
    created_by: parseOptionalInt(body.created_by),
    approved_by: parseOptionalInt(body.approved_by),
    status: body.status !== undefined ? String(body.status) : undefined,
    items: parseItemsField(body.items),
  };

  try {
    return createRequisitionBodySchema.parse(payload) as ICreateRequisitionPayload;
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw error;
  }
};

export const parseUpdateRequisitionFormBody = (
  body: Record<string, unknown>
): IUpdateRequisitionPayload => {
  const payload: Record<string, unknown> = {};

  if (body.description !== undefined) {
    payload.description = parseOptionalString(body.description);
  }

  if (body.created_by !== undefined) {
    payload.created_by = parseOptionalInt(body.created_by);
  }

  if (body.approved_by !== undefined) {
    payload.approved_by = parseOptionalInt(body.approved_by);
  }

  if (body.status !== undefined) {
    payload.status = String(body.status);
  }

  if (body.items !== undefined) {
    payload.items = parseItemsField(body.items);
  }

  try {
    return updateRequisitionBodySchema.parse(payload) as IUpdateRequisitionPayload;
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw error;
  }
};

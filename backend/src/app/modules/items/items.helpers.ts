import { ZodError } from 'zod';

import { ItemsValidation } from './items.validation';
import { ICreateItemPayload } from './items.interface';

export const parseOptionalInt = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const parseOptionalFloat = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const parseOptionalString = (
  value: unknown
): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const parseItemFormBody = (body: Record<string, unknown>) => {
  const payload = {
    name: body.name !== undefined ? String(body.name) : undefined,
    category_id: parseOptionalInt(body.category_id),
    sub_category_id: parseOptionalInt(body.sub_category_id),
    description: parseOptionalString(body.description),
    brand_id: parseOptionalInt(body.brand_id),
    model: parseOptionalString(body.model),
    type: parseOptionalString(body.type),
    material: parseOptionalString(body.material),
    unit_id: parseOptionalInt(body.unit_id),
    low_stock_amount: parseOptionalFloat(body.low_stock_amount),
  };

  try {
    return ItemsValidation.itemBodySchema.parse(payload) as ICreateItemPayload;
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw error;
  }
};

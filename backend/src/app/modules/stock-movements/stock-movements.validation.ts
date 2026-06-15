import { z } from 'zod';

import { STOCK_MOVEMENT_STATUSES } from './stock-movements.constant';

const movementItemSchema = z.object({
  item_id: z
    .number({ error: 'Item id is required' })
    .int({ error: 'Item id must be an integer' })
    .positive({ error: 'Item id must be positive' }),
  requested_quantity: z
    .number({ error: 'Requested quantity is required' })
    .positive({ error: 'Requested quantity must be greater than zero' }),
  unit_id: z
    .number()
    .int({ error: 'Unit id must be an integer' })
    .positive({ error: 'Unit id must be positive' })
    .nullable()
    .optional(),
});

const actionItemSchema = z.object({
  item_id: z
    .number({ error: 'Item id is required' })
    .int({ error: 'Item id must be an integer' })
    .positive({ error: 'Item id must be positive' }),
  quantity: z
    .number()
    .positive({ error: 'Quantity must be greater than zero' })
    .nullable()
    .optional(),
});

export const createStockMovementBodySchema = z.object({
  source_location_id: z
    .number({ error: 'Source location is required' })
    .int({ error: 'Source location must be an integer' })
    .positive({ error: 'Source location must be positive' }),
  destination_location_id: z
    .number({ error: 'Destination location is required' })
    .int({ error: 'Destination location must be an integer' })
    .positive({ error: 'Destination location must be positive' }),
  notes: z.string().trim().nullable().optional(),
  requested_by: z
    .number({ error: 'Requested by is required' })
    .int({ error: 'Requested by must be an integer' })
    .positive({ error: 'Requested by must be positive' }),
  items: z
    .array(movementItemSchema)
    .min(1, { error: 'At least one movement item is required' }),
});

export const stockMovementActionBodySchema = z.object({
  items: z.array(actionItemSchema).optional(),
});

const idParamSchema = z.object({
  id: z
    .string({ error: 'Stock movement id is required' })
    .regex(/^\d+$/, { error: 'Invalid stock movement id' }),
});

const getAllStockMovementsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    status: z.enum(STOCK_MOVEMENT_STATUSES).optional(),
    sourceLocationId: z.string().optional(),
    destinationLocationId: z.string().optional(),
  }),
});

const getSingleStockMovementZodSchema = z.object({
  params: idParamSchema,
});

const createStockMovementZodSchema = z.object({
  body: createStockMovementBodySchema,
});

const stockMovementActionZodSchema = z.object({
  params: idParamSchema,
  body: stockMovementActionBodySchema,
});

export const StockMovementsValidation = {
  getAllStockMovementsZodSchema,
  getSingleStockMovementZodSchema,
  createStockMovementZodSchema,
  approveStockMovementZodSchema: stockMovementActionZodSchema,
  readyStockMovementZodSchema: stockMovementActionZodSchema,
  transferStockMovementZodSchema: stockMovementActionZodSchema,
  confirmStockMovementZodSchema: stockMovementActionZodSchema,
  cancelStockMovementZodSchema: z.object({ params: idParamSchema }),
};

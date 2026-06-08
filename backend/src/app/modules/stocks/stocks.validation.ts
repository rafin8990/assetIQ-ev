import { z } from 'zod';

const createManualStockZodSchema = z.object({
  body: z.object({
    item_id: z
      .number({ error: 'Item id is required' })
      .int({ error: 'Item id must be an integer' })
      .positive({ error: 'Item id must be positive' }),
    quantity: z
      .number({ error: 'Quantity is required' })
      .positive({ error: 'Quantity must be greater than zero' }),
    unit_id: z
      .number()
      .int({ error: 'Unit id must be an integer' })
      .positive({ error: 'Unit id must be positive' })
      .nullable()
      .optional(),
  }),
});

const getAllStocksZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    itemId: z.string().optional(),
  }),
});

const stockIdParamsSchema = z.object({
  id: z
    .string({ error: 'Stock id is required' })
    .regex(/^\d+$/, { error: 'Invalid stock id' }),
});

const getSingleStockZodSchema = z.object({
  params: stockIdParamsSchema,
});

const updateStockZodSchema = z.object({
  params: stockIdParamsSchema,
  body: z
    .object({
      quantity: z
        .number({ error: 'Quantity is required' })
        .nonnegative({ error: 'Quantity must be zero or greater' })
        .optional(),
      unit_id: z
        .number()
        .int({ error: 'Unit id must be an integer' })
        .positive({ error: 'Unit id must be positive' })
        .nullable()
        .optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      error: 'At least one field is required to update',
    }),
});

const deleteStockZodSchema = z.object({
  params: stockIdParamsSchema,
});

export const StocksValidation = {
  createManualStockZodSchema,
  getAllStocksZodSchema,
  getSingleStockZodSchema,
  updateStockZodSchema,
  deleteStockZodSchema,
};

import { z } from 'zod';

const optionalIdSchema = z
  .union([z.number().int().positive(), z.null()])
  .optional();

const optionalStringSchema = z
  .string()
  .trim()
  .max(255, { error: 'Value must not exceed 255 characters' })
  .nullable()
  .optional();

const optionalTextSchema = z.string().trim().nullable().optional();

const optionalNumberSchema = z
  .union([z.number().nonnegative(), z.null()])
  .optional();

const itemBodySchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, { error: 'Name is required' })
    .max(255, { error: 'Name must not exceed 255 characters' }),
  category_id: optionalIdSchema,
  sub_category_id: optionalIdSchema,
  description: optionalTextSchema,
  brand_id: optionalIdSchema,
  model: optionalStringSchema,
  type: optionalStringSchema,
  material: optionalStringSchema,
  unit_id: optionalIdSchema,
  low_stock_amount: optionalNumberSchema,
});

const createItemZodSchema = z.object({
  body: itemBodySchema,
});

const getAllItemsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    categoryId: z.string().optional(),
    subCategoryId: z.string().optional(),
    brandId: z.string().optional(),
  }),
});

const getSingleItemZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Item id is required' })
      .regex(/^\d+$/, { error: 'Invalid item id' }),
  }),
});

const updateItemZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Item id is required' })
      .regex(/^\d+$/, { error: 'Invalid item id' }),
  }),
  body: itemBodySchema.partial().refine(
    data => Object.keys(data).length > 0,
    { error: 'At least one field is required to update' }
  ),
});

const deleteItemZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Item id is required' })
      .regex(/^\d+$/, { error: 'Invalid item id' }),
  }),
});

const deleteItemImageZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Item id is required' })
      .regex(/^\d+$/, { error: 'Invalid item id' }),
    imageId: z
      .string({ error: 'Image id is required' })
      .regex(/^\d+$/, { error: 'Invalid image id' }),
  }),
});

export const ItemsValidation = {
  createItemZodSchema,
  getAllItemsZodSchema,
  getSingleItemZodSchema,
  updateItemZodSchema,
  deleteItemZodSchema,
  deleteItemImageZodSchema,
  itemBodySchema,
};

import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .max(255, { error: 'Slug must not exceed 255 characters' })
  .nullable()
  .optional();

const categoryIdSchema = z.coerce
  .number({ error: 'Category is required' })
  .int({ error: 'Invalid category id' })
  .positive({ error: 'Invalid category id' });

const createSubCategoryZodSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' }),
    slug: slugSchema,
    category_id: categoryIdSchema,
  }),
});

const getAllSubCategoriesZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    categoryId: z.string().optional(),
  }),
});

const getSingleSubCategoryZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Sub category id is required' })
      .regex(/^\d+$/, { error: 'Invalid sub category id' }),
  }),
});

const updateSubCategoryZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Sub category id is required' })
      .regex(/^\d+$/, { error: 'Invalid sub category id' }),
  }),
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' })
      .optional(),
    slug: slugSchema,
    category_id: categoryIdSchema.optional(),
  }),
});

const deleteSubCategoryZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Sub category id is required' })
      .regex(/^\d+$/, { error: 'Invalid sub category id' }),
  }),
});

export const SubCategoriesValidation = {
  createSubCategoryZodSchema,
  getAllSubCategoriesZodSchema,
  getSingleSubCategoryZodSchema,
  updateSubCategoryZodSchema,
  deleteSubCategoryZodSchema,
};

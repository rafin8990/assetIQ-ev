import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .max(255, { error: 'Slug must not exceed 255 characters' })
  .nullable()
  .optional();

const createCategoryZodSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' }),
    slug: slugSchema,
  }),
});

const getAllCategoriesZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
  }),
});

const getSingleCategoryZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Category id is required' })
      .regex(/^\d+$/, { error: 'Invalid category id' }),
  }),
});

const updateCategoryZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Category id is required' })
      .regex(/^\d+$/, { error: 'Invalid category id' }),
  }),
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' })
      .optional(),
    slug: slugSchema,
  }),
});

const deleteCategoryZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Category id is required' })
      .regex(/^\d+$/, { error: 'Invalid category id' }),
  }),
});

export const CategoriesValidation = {
  createCategoryZodSchema,
  getAllCategoriesZodSchema,
  getSingleCategoryZodSchema,
  updateCategoryZodSchema,
  deleteCategoryZodSchema,
};

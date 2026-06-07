import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .max(255, { error: 'Slug must not exceed 255 characters' })
  .nullable()
  .optional();

const imageSchema = z
  .string()
  .trim()
  .max(2048, { error: 'Image URL must not exceed 2048 characters' })
  .nullable()
  .optional();

const createBrandZodSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' }),
    slug: slugSchema,
    image: imageSchema,
  }),
});

const getAllBrandsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
  }),
});

const getSingleBrandZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Brand id is required' })
      .regex(/^\d+$/, { error: 'Invalid brand id' }),
  }),
});

const updateBrandZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Brand id is required' })
      .regex(/^\d+$/, { error: 'Invalid brand id' }),
  }),
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' })
      .optional(),
    slug: slugSchema,
    image: imageSchema,
  }),
});

const deleteBrandZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Brand id is required' })
      .regex(/^\d+$/, { error: 'Invalid brand id' }),
  }),
});

export const BrandsValidation = {
  createBrandZodSchema,
  getAllBrandsZodSchema,
  getSingleBrandZodSchema,
  updateBrandZodSchema,
  deleteBrandZodSchema,
};

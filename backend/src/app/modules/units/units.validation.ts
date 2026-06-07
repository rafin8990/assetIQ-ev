import { z } from 'zod';

const createUnitZodSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' }),
  }),
});

const getAllUnitsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
  }),
});

const getSingleUnitZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Unit id is required' })
      .regex(/^\d+$/, { error: 'Invalid unit id' }),
  }),
});

const updateUnitZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Unit id is required' })
      .regex(/^\d+$/, { error: 'Invalid unit id' }),
  }),
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' }),
  }),
});

const deleteUnitZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Unit id is required' })
      .regex(/^\d+$/, { error: 'Invalid unit id' }),
  }),
});

export const UnitsValidation = {
  createUnitZodSchema,
  getAllUnitsZodSchema,
  getSingleUnitZodSchema,
  updateUnitZodSchema,
  deleteUnitZodSchema,
};

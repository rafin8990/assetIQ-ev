import { z } from 'zod';

const createLocationZodSchema = z.object({
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' }),
  }),
});

const getAllLocationsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
  }),
});

const getSingleLocationZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Location id is required' })
      .regex(/^\d+$/, { error: 'Invalid location id' }),
  }),
});

const updateLocationZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Location id is required' })
      .regex(/^\d+$/, { error: 'Invalid location id' }),
  }),
  body: z.object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(1, { error: 'Name is required' })
      .max(255, { error: 'Name must not exceed 255 characters' }),
  }),
});

const deleteLocationZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Location id is required' })
      .regex(/^\d+$/, { error: 'Invalid location id' }),
  }),
});

export const LocationsValidation = {
  createLocationZodSchema,
  getAllLocationsZodSchema,
  getSingleLocationZodSchema,
  updateLocationZodSchema,
  deleteLocationZodSchema,
};

import { z } from 'zod';

import {
  OUT_REQUEST_ITEM_STATUSES,
  OUT_REQUEST_STATUSES,
} from './out-requests.constant';

const outRequestItemSchema = z.object({
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

const processOutItemSchema = z.object({
  item_id: z
    .number({ error: 'Item id is required' })
    .int({ error: 'Item id must be an integer' })
    .positive({ error: 'Item id must be positive' }),
  out_quantity: z
    .number()
    .positive({ error: 'Out quantity must be greater than zero' })
    .nullable()
    .optional(),
});

export const createOutRequestBodySchema = z.object({
  description: z.string().trim().nullable().optional(),
  source_location_id: z
    .number({ error: 'Source location is required' })
    .int({ error: 'Source location must be an integer' })
    .positive({ error: 'Source location must be positive' }),
  requested_by: z
    .number({ error: 'Requested by is required' })
    .int({ error: 'Requested by must be an integer' })
    .positive({ error: 'Requested by must be positive' }),
  items: z
    .array(outRequestItemSchema)
    .min(1, { error: 'At least one out request item is required' }),
});

export const updateOutRequestBodySchema = z
  .object({
    description: z.string().trim().nullable().optional(),
    requested_by: z
      .number()
      .int({ error: 'Requested by must be an integer' })
      .positive({ error: 'Requested by must be positive' })
      .optional(),
    items: z
      .array(outRequestItemSchema)
      .min(1, { error: 'At least one out request item is required' })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    error: 'At least one field is required to update',
  });

export const processOutRequestBodySchema = z.object({
  out_by: z
    .number({ error: 'Out by is required' })
    .int({ error: 'Out by must be an integer' })
    .positive({ error: 'Out by must be positive' }),
  items: z.array(processOutItemSchema).optional(),
});

const idParamSchema = z.object({
  id: z
    .string({ error: 'Out request id is required' })
    .regex(/^\d+$/, { error: 'Invalid out request id' }),
});

const getAllOutRequestsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    status: z.enum(OUT_REQUEST_STATUSES).optional(),
    requestedBy: z.string().optional(),
  }),
});

const getSingleOutRequestZodSchema = z.object({
  params: idParamSchema,
});

const createOutRequestZodSchema = z.object({
  body: createOutRequestBodySchema,
});

const updateOutRequestZodSchema = z.object({
  params: idParamSchema,
  body: updateOutRequestBodySchema,
});

const deleteOutRequestZodSchema = z.object({
  params: idParamSchema,
});

const approveOutRequestZodSchema = z.object({
  params: idParamSchema,
});

const cancelOutRequestZodSchema = z.object({
  params: idParamSchema,
});

const processOutRequestZodSchema = z.object({
  params: idParamSchema,
  body: processOutRequestBodySchema,
});

const dateQuerySchema = z
  .string({ error: 'Date is required' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Date must be YYYY-MM-DD' });

const getDailyReportZodSchema = z.object({
  query: z.object({
    date: dateQuerySchema,
  }),
});

const getDateRangeReportZodSchema = z.object({
  query: z.object({
    fromDate: dateQuerySchema,
    toDate: dateQuerySchema,
  }),
});

const getMonthwiseReportZodSchema = z.object({
  query: z.object({
    year: z
      .string({ error: 'Year is required' })
      .regex(/^\d{4}$/, { error: 'Year must be YYYY' }),
  }),
});

const getUserWiseReportZodSchema = z.object({
  query: z.object({
    fromDate: dateQuerySchema,
    toDate: dateQuerySchema,
    userId: z
      .string()
      .regex(/^\d+$/, { error: 'Invalid user id' })
      .optional(),
  }),
});

export const OutRequestsValidation = {
  getAllOutRequestsZodSchema,
  getSingleOutRequestZodSchema,
  createOutRequestZodSchema,
  updateOutRequestZodSchema,
  deleteOutRequestZodSchema,
  approveOutRequestZodSchema,
  cancelOutRequestZodSchema,
  processOutRequestZodSchema,
  getDailyReportZodSchema,
  getDateRangeReportZodSchema,
  getMonthwiseReportZodSchema,
  getUserWiseReportZodSchema,
  OUT_REQUEST_ITEM_STATUSES,
  OUT_REQUEST_STATUSES,
};

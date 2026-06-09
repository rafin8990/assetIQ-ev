import { z } from 'zod';

import { RETURN_REQUEST_STATUSES } from './return-requests.constant';

const returnRequestItemSchema = z.object({
  out_request_item_id: z
    .number({ error: 'Out request item id is required' })
    .int({ error: 'Out request item id must be an integer' })
    .positive({ error: 'Out request item id must be positive' }),
  item_id: z
    .number({ error: 'Item id is required' })
    .int({ error: 'Item id must be an integer' })
    .positive({ error: 'Item id must be positive' }),
  return_quantity: z
    .number({ error: 'Return quantity is required' })
    .positive({ error: 'Return quantity must be greater than zero' }),
  unit_id: z
    .number()
    .int({ error: 'Unit id must be an integer' })
    .positive({ error: 'Unit id must be positive' })
    .nullable()
    .optional(),
});

export const createReturnRequestBodySchema = z.object({
  out_request_id: z
    .number({ error: 'Out request id is required' })
    .int({ error: 'Out request id must be an integer' })
    .positive({ error: 'Out request id must be positive' }),
  description: z.string().trim().nullable().optional(),
  requested_by: z
    .number({ error: 'Requested by is required' })
    .int({ error: 'Requested by must be an integer' })
    .positive({ error: 'Requested by must be positive' }),
  items: z
    .array(returnRequestItemSchema)
    .min(1, { error: 'At least one return item is required' }),
});

export const updateReturnRequestBodySchema = z
  .object({
    description: z.string().trim().nullable().optional(),
    requested_by: z
      .number()
      .int({ error: 'Requested by must be an integer' })
      .positive({ error: 'Requested by must be positive' })
      .optional(),
    items: z
      .array(returnRequestItemSchema)
      .min(1, { error: 'At least one return item is required' })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    error: 'At least one field is required to update',
  });

const idParamSchema = z.object({
  id: z
    .string({ error: 'Return request id is required' })
    .regex(/^\d+$/, { error: 'Invalid return request id' }),
});

const getAllReturnRequestsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    status: z.enum(RETURN_REQUEST_STATUSES).optional(),
    requestedBy: z.string().optional(),
    outRequestId: z.string().optional(),
  }),
});

const getSingleReturnRequestZodSchema = z.object({
  params: idParamSchema,
});

const createReturnRequestZodSchema = z.object({
  body: createReturnRequestBodySchema,
});

const updateReturnRequestZodSchema = z.object({
  params: idParamSchema,
  body: updateReturnRequestBodySchema,
});

const deleteReturnRequestZodSchema = z.object({
  params: idParamSchema,
});

const approveReturnRequestZodSchema = z.object({
  params: idParamSchema,
});

const cancelReturnRequestZodSchema = z.object({
  params: idParamSchema,
});

const dateQuerySchema = z
  .string({ error: 'Date is required' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Date must be YYYY-MM-DD' });

const getDateRangeReportZodSchema = z.object({
  query: z.object({
    fromDate: dateQuerySchema,
    toDate: dateQuerySchema,
  }),
});

export const ReturnRequestsValidation = {
  getAllReturnRequestsZodSchema,
  getSingleReturnRequestZodSchema,
  createReturnRequestZodSchema,
  updateReturnRequestZodSchema,
  deleteReturnRequestZodSchema,
  approveReturnRequestZodSchema,
  cancelReturnRequestZodSchema,
  getDateRangeReportZodSchema,
};

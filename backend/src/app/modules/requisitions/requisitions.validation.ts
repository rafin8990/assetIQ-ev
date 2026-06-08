import { z } from 'zod';

import { REQUISITION_STATUSES } from './requisitions.constant';

const requisitionItemSchema = z.object({
  item_id: z
    .number({ error: 'Item id is required' })
    .int({ error: 'Item id must be an integer' })
    .positive({ error: 'Item id must be positive' }),
  quantity: z
    .number({ error: 'Quantity is required' })
    .positive({ error: 'Quantity must be greater than zero' }),
  unit_id: z
    .number({ error: 'Unit id is required' })
    .int({ error: 'Unit id must be an integer' })
    .positive({ error: 'Unit id must be positive' }),
});

export const requisitionItemBodySchema = requisitionItemSchema;

export const createRequisitionBodySchema = z.object({
  description: z.string().trim().nullable().optional(),
  created_by: z
    .number({ error: 'Created by is required' })
    .int({ error: 'Created by must be an integer' })
    .positive({ error: 'Created by must be positive' }),
  approved_by: z
    .number()
    .int({ error: 'Approved by must be an integer' })
    .positive({ error: 'Approved by must be positive' })
    .nullable()
    .optional(),
  status: z.enum(REQUISITION_STATUSES).optional(),
  items: z
    .array(requisitionItemSchema)
    .min(1, { error: 'At least one requisition item is required' }),
});

export const updateRequisitionBodySchema = z
  .object({
    description: z.string().trim().nullable().optional(),
    created_by: z
      .number()
      .int({ error: 'Created by must be an integer' })
      .positive({ error: 'Created by must be positive' })
      .optional(),
    approved_by: z
      .number()
      .int({ error: 'Approved by must be an integer' })
      .positive({ error: 'Approved by must be positive' })
      .nullable()
      .optional(),
    status: z.enum(REQUISITION_STATUSES).optional(),
    items: z
      .array(requisitionItemSchema)
      .min(1, { error: 'At least one requisition item is required' })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    error: 'At least one field is required to update',
  });

const getAllRequisitionsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    status: z.enum(REQUISITION_STATUSES).optional(),
    createdBy: z.string().optional(),
  }),
});

const getSingleRequisitionZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Requisition id is required' })
      .regex(/^\d+$/, { error: 'Invalid requisition id' }),
  }),
});

const updateRequisitionZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Requisition id is required' })
      .regex(/^\d+$/, { error: 'Invalid requisition id' }),
  }),
  body: updateRequisitionBodySchema,
});

const deleteRequisitionZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Requisition id is required' })
      .regex(/^\d+$/, { error: 'Invalid requisition id' }),
  }),
});

export const RequisitionsValidation = {
  getAllRequisitionsZodSchema,
  getSingleRequisitionZodSchema,
  updateRequisitionZodSchema,
  deleteRequisitionZodSchema,
};

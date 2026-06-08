import { z } from 'zod';

import {
  PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_TYPES,
} from './purchase-orders.constant';

const optionalAmountSchema = z
  .number()
  .nonnegative({ error: 'Amount must be zero or greater' })
  .nullable()
  .optional();

const poItemSchema = z.object({
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
  per_unit_amount: optionalAmountSchema,
  discount_amount: optionalAmountSchema,
});

export const poItemBodySchema = poItemSchema;

export const createPurchaseOrderBodySchema = z.object({
  created_by: z
    .number({ error: 'Created by is required' })
    .int({ error: 'Created by must be an integer' })
    .positive({ error: 'Created by must be positive' }),
  description: z.string().trim().nullable().optional(),
  status: z.enum(PURCHASE_ORDER_STATUSES).optional(),
  paid_amount: optionalAmountSchema,
  discount_amount: optionalAmountSchema,
  approved_by: z
    .number()
    .int({ error: 'Approved by must be an integer' })
    .positive({ error: 'Approved by must be positive' })
    .nullable()
    .optional(),
  received_by: z
    .number()
    .int({ error: 'Received by must be an integer' })
    .positive({ error: 'Received by must be positive' })
    .nullable()
    .optional(),
  order_type: z.enum(PURCHASE_ORDER_TYPES).optional(),
  requisition_ids: z
    .array(
      z
        .number()
        .int({ error: 'Requisition id must be an integer' })
        .positive({ error: 'Requisition id must be positive' })
    )
    .optional(),
  items: z
    .array(poItemSchema)
    .min(1, { error: 'At least one purchase order item is required' }),
}).superRefine((data, ctx) => {
  if (
    (data.order_type ?? 'by_requisition') === 'by_requisition' &&
    (!data.requisition_ids || data.requisition_ids.length === 0)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['requisition_ids'],
      message:
        'At least one approved requisition is required for by_requisition orders',
    });
  }
});

export const updatePurchaseOrderBodySchema = z
  .object({
    created_by: z
      .number()
      .int({ error: 'Created by must be an integer' })
      .positive({ error: 'Created by must be positive' })
      .optional(),
    description: z.string().trim().nullable().optional(),
    status: z.enum(PURCHASE_ORDER_STATUSES).optional(),
    paid_amount: optionalAmountSchema,
    discount_amount: optionalAmountSchema,
    approved_by: z
      .number()
      .int({ error: 'Approved by must be an integer' })
      .positive({ error: 'Approved by must be positive' })
      .nullable()
      .optional(),
    received_by: z
      .number()
      .int({ error: 'Received by must be an integer' })
      .positive({ error: 'Received by must be positive' })
      .nullable()
      .optional(),
    order_type: z.enum(PURCHASE_ORDER_TYPES).optional(),
    items: z
      .array(poItemSchema)
      .min(1, { error: 'At least one purchase order item is required' })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    error: 'At least one field is required to update',
  });

const getAllPurchaseOrdersZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    status: z.enum(PURCHASE_ORDER_STATUSES).optional(),
    orderType: z.enum(PURCHASE_ORDER_TYPES).optional(),
    createdBy: z.string().optional(),
  }),
});

const getSinglePurchaseOrderZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Purchase order id is required' })
      .regex(/^\d+$/, { error: 'Invalid purchase order id' }),
  }),
});

const deletePurchaseOrderZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Purchase order id is required' })
      .regex(/^\d+$/, { error: 'Invalid purchase order id' }),
  }),
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

const getDuePaidReportZodSchema = z.object({
  query: z.object({
    fromDate: dateQuerySchema,
    toDate: dateQuerySchema,
    paymentType: z.enum(['due', 'paid']),
  }),
});

const getMonthwiseReportZodSchema = z.object({
  query: z.object({
    year: z
      .string({ error: 'Year is required' })
      .regex(/^\d{4}$/, { error: 'Year must be YYYY' }),
  }),
});

export const PurchaseOrdersValidation = {
  getAllPurchaseOrdersZodSchema,
  getSinglePurchaseOrderZodSchema,
  deletePurchaseOrderZodSchema,
  getDailyReportZodSchema,
  getDateRangeReportZodSchema,
  getDuePaidReportZodSchema,
  getMonthwiseReportZodSchema,
};

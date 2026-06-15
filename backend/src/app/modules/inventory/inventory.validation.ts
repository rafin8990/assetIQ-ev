import { z } from 'zod';

const inventoryQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  searchTerm: z.string().optional(),
  locationId: z.string().optional(),
  itemId: z.string().optional(),
  vendorId: z.string().optional(),
});

const getLocationStockZodSchema = z.object({
  query: inventoryQuerySchema.refine(data => Boolean(data.locationId), {
    message: 'locationId is required',
    path: ['locationId'],
  }),
});

const getTotalStockZodSchema = z.object({ query: inventoryQuerySchema });

const getLotsZodSchema = z.object({ query: inventoryQuerySchema });

const getTotalStockBreakdownZodSchema = z.object({
  params: z.object({
    itemId: z.string().regex(/^\d+$/),
  }),
  query: z.object({
    vendorId: z.string().optional(),
  }),
});

const addManualLotZodSchema = z.object({
  body: z.object({
    item_id: z.number().int().positive(),
    location_id: z.number().int().positive(),
    vendor_id: z.number().int().positive().nullable().optional(),
    quantity: z.number().positive(),
    unit_id: z.number().int().positive().nullable().optional(),
  }),
});

const dateQuerySchema = z
  .string({ error: 'Date is required' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Date must be YYYY-MM-DD' });

const getDailyMovementReportZodSchema = z.object({
  query: z.object({
    date: dateQuerySchema,
  }),
});

const getDateRangeMovementReportZodSchema = z.object({
  query: z.object({
    fromDate: dateQuerySchema,
    toDate: dateQuerySchema,
  }),
});

const getUserWiseMovementReportZodSchema = z.object({
  query: z.object({
    fromDate: dateQuerySchema,
    toDate: dateQuerySchema,
    userId: z.string().regex(/^\d+$/).optional(),
  }),
});

const getMainStockUpdateReportZodSchema = z.object({
  query: z.object({
    fromDate: dateQuerySchema,
    toDate: dateQuerySchema,
    itemId: z.string().regex(/^\d+$/).optional(),
    vendorId: z.string().regex(/^\d+$/).optional(),
  }),
});

const getMonthwiseMovementReportZodSchema = z.object({
  query: z.object({
    year: z
      .string({ error: 'Year is required' })
      .regex(/^\d{4}$/, { error: 'Year must be YYYY' }),
  }),
});

export const InventoryValidation = {
  getLocationStockZodSchema,
  getTotalStockZodSchema,
  getLotsZodSchema,
  getTotalStockBreakdownZodSchema,
  addManualLotZodSchema,
  getDailyMovementReportZodSchema,
  getDateRangeMovementReportZodSchema,
  getUserWiseMovementReportZodSchema,
  getMainStockUpdateReportZodSchema,
  getMonthwiseMovementReportZodSchema,
};

import { z } from 'zod';

const optionalStringSchema = z
  .string()
  .trim()
  .max(255, { error: 'Value must not exceed 255 characters' })
  .nullable()
  .optional();

const optionalMobileSchema = z
  .string()
  .trim()
  .max(50, { error: 'Mobile number must not exceed 50 characters' })
  .nullable()
  .optional();

const optionalEmailSchema = z
  .string()
  .trim()
  .email({ error: 'Invalid email address' })
  .max(255, { error: 'Email must not exceed 255 characters' })
  .nullable()
  .optional();

export const createVendorBodySchema = z.object({
  vendor_name: z
    .string({ error: 'Vendor name is required' })
    .trim()
    .min(1, { error: 'Vendor name is required' })
    .max(255, { error: 'Vendor name must not exceed 255 characters' }),
  company_name: optionalStringSchema,
  mobile_number: optionalMobileSchema,
  email: optionalEmailSchema,
});

export const updateVendorBodySchema = z
  .object({
    vendor_name: z
      .string({ error: 'Vendor name is required' })
      .trim()
      .min(1, { error: 'Vendor name is required' })
      .max(255, { error: 'Vendor name must not exceed 255 characters' })
      .optional(),
    company_name: optionalStringSchema,
    mobile_number: optionalMobileSchema,
    email: optionalEmailSchema,
  })
  .refine(data => Object.keys(data).length > 0, {
    error: 'At least one field is required to update',
  });

const getAllVendorsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
  }),
});

const getSingleVendorZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Vendor id is required' })
      .regex(/^\d+$/, { error: 'Invalid vendor id' }),
  }),
});

const deleteVendorZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'Vendor id is required' })
      .regex(/^\d+$/, { error: 'Invalid vendor id' }),
  }),
});

export const VendorsValidation = {
  getAllVendorsZodSchema,
  getSingleVendorZodSchema,
  deleteVendorZodSchema,
};

import { ZodError } from 'zod';

import { parseOptionalString } from '../items/items.helpers';
import {
  ICreateVendorPayload,
  IUpdateVendorPayload,
} from './vendors.interface';
import {
  createVendorBodySchema,
  updateVendorBodySchema,
} from './vendors.validation';

export const parseCreateVendorFormBody = (
  body: Record<string, unknown>
): ICreateVendorPayload => {
  const payload = {
    vendor_name:
      body.vendor_name !== undefined ? String(body.vendor_name) : undefined,
    company_name: parseOptionalString(body.company_name),
    mobile_number: parseOptionalString(body.mobile_number),
    email: parseOptionalString(body.email),
  };

  try {
    return createVendorBodySchema.parse(payload) as ICreateVendorPayload;
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw error;
  }
};

export const parseUpdateVendorFormBody = (
  body: Record<string, unknown>
): IUpdateVendorPayload => {
  const payload: Record<string, unknown> = {};

  if (body.vendor_name !== undefined) {
    payload.vendor_name = String(body.vendor_name);
  }

  if (body.company_name !== undefined) {
    payload.company_name = parseOptionalString(body.company_name);
  }

  if (body.mobile_number !== undefined) {
    payload.mobile_number = parseOptionalString(body.mobile_number);
  }

  if (body.email !== undefined) {
    payload.email = parseOptionalString(body.email);
  }

  try {
    return updateVendorBodySchema.parse(payload) as IUpdateVendorPayload;
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw error;
  }
};

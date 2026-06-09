import { z } from 'zod';

const getUserPermissionsZodSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^\d+$/, 'User id must be a number'),
  }),
});

const setUserPermissionsZodSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^\d+$/, 'User id must be a number'),
  }),
  body: z.object({
    permissionKeys: z.array(z.string().min(1)),
  }),
});

export const PermissionsValidation = {
  getUserPermissionsZodSchema,
  setUserPermissionsZodSchema,
};

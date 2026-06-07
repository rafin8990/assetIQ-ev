import { z } from 'zod';

import { USER_ROLES } from '../../../enums/user';

const roleSchema = z.enum(USER_ROLES, {
  error: 'Role must be super_admin, admin, or user',
});

const emailSchema = z
  .string()
  .trim()
  .email({ error: 'Invalid email address' })
  .max(255, { error: 'Email must not exceed 255 characters' })
  .optional()
  .nullable();

const mobileSchema = z
  .string()
  .trim()
  .min(6, { error: 'Mobile number must be at least 6 characters' })
  .max(50, { error: 'Mobile number must not exceed 50 characters' })
  .optional()
  .nullable();

const createUserZodSchema = z
  .object({
    body: z
      .object({
        name: z
          .string({ error: 'Name is required' })
          .trim()
          .min(1, { error: 'Name is required' })
          .max(255, { error: 'Name must not exceed 255 characters' }),
        mobile_no: mobileSchema,
        email: emailSchema,
        image: z.string().trim().optional().nullable(),
        password: z
          .string({ error: 'Password is required' })
          .min(6, { error: 'Password must be at least 6 characters' })
          .max(255, { error: 'Password must not exceed 255 characters' }),
        role: roleSchema,
      })
      .refine(data => Boolean(data.email || data.mobile_no), {
        message: 'Either email or mobile number is required',
        path: ['email'],
      }),
  });

const getAllUsersZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
    role: z.string().optional(),
  }),
});

const getAdminsZodSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchTerm: z.string().optional(),
  }),
});

const getSingleUserZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'User id is required' })
      .regex(/^\d+$/, { error: 'Invalid user id' }),
  }),
});

const updateUserZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'User id is required' })
      .regex(/^\d+$/, { error: 'Invalid user id' }),
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: 'Name is required' })
        .max(255, { error: 'Name must not exceed 255 characters' })
        .optional(),
      mobile_no: mobileSchema,
      email: emailSchema,
      image: z.string().trim().optional().nullable(),
      password: z
        .string()
        .min(6, { error: 'Password must be at least 6 characters' })
        .max(255, { error: 'Password must not exceed 255 characters' })
        .optional(),
      role: roleSchema.optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

const deleteUserZodSchema = z.object({
  params: z.object({
    id: z
      .string({ error: 'User id is required' })
      .regex(/^\d+$/, { error: 'Invalid user id' }),
  }),
});

export const UsersValidation = {
  createUserZodSchema,
  getAllUsersZodSchema,
  getAdminsZodSchema,
  getSingleUserZodSchema,
  updateUserZodSchema,
  deleteUserZodSchema,
};

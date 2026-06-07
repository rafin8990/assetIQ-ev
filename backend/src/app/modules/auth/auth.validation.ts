import { z } from 'zod';

const loginZodSchema = z.object({
  body: z.object({
    identifier: z
      .string({ error: 'Email or mobile number is required' })
      .trim()
      .min(1, { error: 'Email or mobile number is required' }),
    password: z
      .string({ error: 'Password is required' })
      .min(1, { error: 'Password is required' }),
  }),
});

const refreshTokenZodSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ error: 'Refresh token is required' })
      .min(1, { error: 'Refresh token is required' }),
  }),
});

const updateProfileZodSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: 'Name is required' })
        .max(255, { error: 'Name must not exceed 255 characters' })
        .optional(),
      mobile_no: z
        .string()
        .trim()
        .min(6, { error: 'Mobile number must be at least 6 characters' })
        .max(50, { error: 'Mobile number must not exceed 50 characters' })
        .optional()
        .nullable(),
      email: z
        .string()
        .trim()
        .email({ error: 'Invalid email address' })
        .max(255, { error: 'Email must not exceed 255 characters' })
        .optional()
        .nullable(),
      image: z.string().trim().optional().nullable(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

const changePasswordZodSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ error: 'Current password is required' })
        .min(1, { error: 'Current password is required' }),
      newPassword: z
        .string({ error: 'New password is required' })
        .min(6, { error: 'New password must be at least 6 characters' })
        .max(255, { error: 'New password must not exceed 255 characters' }),
    })
    .refine(data => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }),
});

export const AuthValidation = {
  loginZodSchema,
  refreshTokenZodSchema,
  updateProfileZodSchema,
  changePasswordZodSchema,
};

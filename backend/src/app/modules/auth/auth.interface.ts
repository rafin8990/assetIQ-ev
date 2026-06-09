import { IUser } from '../users/users.interface';

export type ITokenPayload = {
  userId: number;
  role: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
};

export type ILoginPayload = {
  identifier: string;
  password: string;
};

export type IAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type ILoginResponse = {
  user: IUser;
  accessToken: string;
  refreshToken: string;
};

export type IRefreshTokenPayload = {
  refreshToken: string;
};

export type IUpdateProfilePayload = {
  name?: string;
  mobile_no?: string | null;
  email?: string | null;
  image?: string | null;
};

export type IChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

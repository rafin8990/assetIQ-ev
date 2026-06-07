import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';

import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { IUser } from '../users/users.interface';
import { UsersService } from '../users/users.service';
import {
  IAuthTokens,
  IChangePasswordPayload,
  ILoginPayload,
  ILoginResponse,
  ITokenPayload,
  IUpdateProfilePayload,
} from './auth.interface';

const generateTokens = (user: IUser): IAuthTokens => {
  const payload: ITokenPayload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = jwtHelpers.createToken(
    payload,
    config.jwt_secret as string,
    config.jwt_expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    payload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return { accessToken, refreshToken };
};

const login = async (payload: ILoginPayload): Promise<ILoginResponse> => {
  const user = await UsersService.findUserByIdentifier(payload.identifier);

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  const { password: _password, ...safeUser } = user;
  const tokens = generateTokens(safeUser);

  return {
    user: safeUser,
    ...tokens,
  };
};

const refreshToken = async (token: string): Promise<IAuthTokens> => {
  let decoded: ITokenPayload;

  try {
    decoded = jwtHelpers.verifyToken(
      token,
      config.jwt_refresh_secret as string
    ) as ITokenPayload;
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const user = await UsersService.getSingleUser(decoded.userId);
  return generateTokens(user);
};

const getProfile = async (userId: number): Promise<IUser> => {
  return UsersService.getSingleUser(userId);
};

const updateProfile = async (
  userId: number,
  payload: IUpdateProfilePayload
): Promise<IUser> => {
  return UsersService.updateUser(userId, payload);
};

const changePassword = async (
  userId: number,
  payload: IChangePasswordPayload
): Promise<null> => {
  const user = await UsersService.getUserWithPasswordById(userId);

  const isPasswordMatched = await bcrypt.compare(
    payload.currentPassword,
    user.password
  );

  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
  }

  await UsersService.updateUser(userId, { password: payload.newPassword });

  return null;
};

export const AuthService = {
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
};

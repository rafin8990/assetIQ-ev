import { ENUM_USER_ROLE } from '../../../enums/user';

export type IUser = {
  id: number;
  name: string;
  mobile_no: string | null;
  email: string | null;
  image: string | null;
  role: ENUM_USER_ROLE;
  permissions?: string[];
  created_at: Date;
  updated_at: Date;
};

export type IUserWithPassword = IUser & {
  password: string;
};

export type IUserFilters = {
  searchTerm?: string;
  role?: string;
};

export type ICreateUserPayload = {
  name: string;
  mobile_no?: string | null;
  email?: string | null;
  image?: string | null;
  password: string;
  role: ENUM_USER_ROLE;
};

export type IUpdateUserPayload = {
  name?: string;
  mobile_no?: string | null;
  email?: string | null;
  image?: string | null;
  password?: string;
  role?: ENUM_USER_ROLE;
};

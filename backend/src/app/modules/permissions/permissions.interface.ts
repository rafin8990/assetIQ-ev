import { PermissionDefinition } from './permissions.constant';

export type IUserPermissionsPayload = {
  permissionKeys: string[];
};

export type IPermissionGroup = {
  group: string;
  routes: PermissionDefinition[];
  actions: PermissionDefinition[];
};

export type IPermissionsRegistry = {
  groups: IPermissionGroup[];
  allKeys: string[];
};

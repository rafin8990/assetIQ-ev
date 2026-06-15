import { PermissionDefinition } from './permissions.constant';

export type IUserPermissionsPayload = {
  permissionKeys: string[];
};

export type IPermissionRouteSection = {
  section: string;
  routes: PermissionDefinition[];
};

export type IPermissionGroup = {
  group: string;
  routeSections: IPermissionRouteSection[];
  actions: PermissionDefinition[];
};

export type IPermissionsRegistry = {
  groups: IPermissionGroup[];
  allKeys: string[];
};

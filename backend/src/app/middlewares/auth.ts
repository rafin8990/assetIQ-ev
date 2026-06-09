import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import config from '../../config';
import { ITokenPayload } from '../modules/auth/auth.interface';
import { PermissionsService } from '../modules/permissions/permissions.service';

const loadUserPermissions = async (req: Request): Promise<string[]> => {
  if (!req.user) {
    return [];
  }

  if (req.user.permissions) {
    return req.user.permissions;
  }

  const permissions = await PermissionsService.getUserPermissionKeys(
    req.user.userId
  );

  req.user.permissions = permissions;

  return permissions;
};

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const decoded = jwtHelpers.verifyToken(token, config.jwt_secret as string);

    req.user = decoded as ITokenPayload;

    next();
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwtHelpers.verifyToken(token, config.jwt_secret as string);
        req.user = decoded as ITokenPayload;
      } catch (error) {
        req.user = undefined;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

const requirePermission = (permissionKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (PermissionsService.isSuperAdmin(req.user.role)) {
      return next();
    }

    const permissions = await loadUserPermissions(req);

    if (!permissions.includes(permissionKey)) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

const requireAnyPermission = (permissionKeys: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (PermissionsService.isSuperAdmin(req.user.role)) {
      return next();
    }

    const permissions = await loadUserPermissions(req);
    const hasAny = permissionKeys.some(key => permissions.includes(key));

    if (!hasAny) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

export { auth, optionalAuth, requireRole, requirePermission, requireAnyPermission };

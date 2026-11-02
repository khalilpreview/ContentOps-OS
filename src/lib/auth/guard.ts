import type { Request, Response, NextFunction } from 'express';
import { getCurrentUser } from './get-current-user';
import { ForbiddenError } from './types';
import type { User, UserRole } from './types';

/**
 * Ensures user is authenticated and possesses one of the allowed roles.
 * Returns the resolved User object.
 */
export async function assertRole(req: Request, allowedRoles: UserRole[]): Promise<User> {
  const user = await getCurrentUser(req);

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Access denied: Action requires one of [${allowedRoles.join(', ')}]. Current role: '${user.role}'`
    );
  }

  return user;
}

/**
 * Express middleware helper to enforce RBAC on route handlers.
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await assertRole(req, allowedRoles);
      (req as any).user = user;
      next();
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({
        error: err.name || 'AuthError',
        message: err.message,
      });
    }
  };
}

/**
 * Express middleware helper to ensure basic authentication regardless of role.
 */
export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getCurrentUser(req);
      (req as any).user = user;
      next();
    } catch (err: any) {
      const status = err.statusCode || 401;
      res.status(status).json({
        error: err.name || 'UnauthorizedError',
        message: err.message,
      });
    }
  };
}

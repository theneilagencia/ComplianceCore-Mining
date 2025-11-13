/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 */

import { type Request, type Response, type NextFunction } from 'express';
import * as authService from './service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (decoded.type !== 'access') {
      res.status(401).json({
        error: 'Invalid token type',
      });
      return;
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email!,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Authentication failed',
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);

      if (decoded.type === 'access') {
        req.user = {
          id: decoded.userId,
          email: decoded.email!,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}


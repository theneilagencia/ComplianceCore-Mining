/**
 * Authentication Helper for Payment Routes
 * Temporary solution to read JWT from cookies until SDK build issue is resolved
 */

import type { Request } from 'express';
import { db } from '../../db';
import { ENV } from '../../_core/env';
import jwt from 'jsonwebtoken';

export async function authenticateFromCookie(req: Request) {
  // Try to get token from cookie first
  const cookieToken = req.cookies?.accessToken;
  
  if (!cookieToken) {
    throw new Error('No access token found in cookies');
  }

  // Verify JWT token
  try {
    const decoded = jwt.verify(cookieToken, ENV.jwtSecret) as {
      userId: string;
      tenantId: string;
    };

    // Fetch user from database
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}


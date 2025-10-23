/**
 * Authentication Helper for Payment Routes
 * Temporary solution to read JWT from cookies until SDK build issue is resolved
 */

import type { Request } from 'express';
import { getDb } from '../../db';
import { ENV } from '../../_core/env';
import jwt from 'jsonwebtoken';

export async function authenticateFromCookie(req: Request) {
  // Try to get token from Authorization header first (preferred)
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  } else {
    // Fallback to cookie if no Authorization header
    token = req.cookies?.accessToken;
  }
  
  if (!token) {
    throw new Error('No access token found in Authorization header or cookies');
  }

  // Verify JWT token
  try {
    const decoded = jwt.verify(token, ENV.jwtSecret) as {
      userId: string;
      tenantId: string;
    };

    // Fetch user from database
    const db = await getDb();
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


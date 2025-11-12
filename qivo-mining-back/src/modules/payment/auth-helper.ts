/**
 * Authentication Helper for Payment Routes
 * Temporary solution to read JWT from cookies until SDK build issue is resolved
 */

import type { Request } from 'express';
import { getDb } from '../../db';
import { ENV } from '../../_core/env';
import jwt from 'jsonwebtoken';
import { users } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function authenticateFromCookie(req: Request) {
  // Try to get token from Authorization header first (preferred)
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  
  console.log('[Auth Helper] Headers:', {
    authorization: authHeader ? 'Present' : 'Missing',
    cookie: req.headers.cookie ? 'Present' : 'Missing'
  });
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[Auth Helper] Token from Authorization header (first 20 chars):', token.substring(0, 20));
  } else {
    // Fallback to cookie if no Authorization header
    token = req.cookies?.accessToken;
    console.log('[Auth Helper] Token from cookie:', token ? 'Present (length: ' + token.length + ')' : 'Missing');
  }
  
  if (!token) {
    console.error('[Auth Helper] No token found');
    throw new Error('No access token found in Authorization header or cookies');
  }

  // Verify JWT token
  try {
    console.log('[Auth Helper] Verifying token with JWT_SECRET...');
    const decoded = jwt.verify(token, ENV.jwtSecret) as {
      userId: string;
      email?: string;
    };
    console.log('[Auth Helper] Token decoded successfully. UserId:', decoded.userId);

    // Fetch user from database
    const db = await getDb();
    if (!db) {
      console.error('[Auth Helper] Database not available');
      throw new Error('Database not available');
    }
    
    const result = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    const user = result.length > 0 ? result[0] : null;

    if (!user) {
      console.error('[Auth Helper] User not found in database:', decoded.userId);
      throw new Error('User not found');
    }

    console.log('[Auth Helper] User authenticated successfully:', user.email);
    return user;
  } catch (error: any) {
    console.error('[Auth Helper] Token verification failed:', error.message);
    throw new Error('Invalid or expired token');
  }
}


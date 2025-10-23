/**
 * Authentication Service
 * Handles email/password authentication, JWT tokens, and user management
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { users } from '../../../drizzle/schema';
import type { User, InsertUser } from '../../../drizzle/schema';
import { createId } from '@paralleldrive/cuid2';
import * as licenseService from '../licenses/service';
import { ensureDefaultPlan } from '../licenses/ensure-default-plan';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m'; // Access token expires in 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh token expires in 7 days
const SALT_ROUNDS = 10;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: string; email?: string; type: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Register new user with email/password
 */
export async function registerUser(data: RegisterData): Promise<AuthTokens> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const userId = createId();
  const tenantId = userId; // For now, each user is their own tenant

  const userData: InsertUser = {
    id: userId,
    tenantId,
    email: data.email,
    name: data.name || null,
    passwordHash,
    googleId: null,
    refreshToken: null,
  };

  await db.insert(users).values(userData);

  // Create START license for new user
  await licenseService.createLicense(userId, tenantId, 'START');

  // Generate tokens
  const accessToken = generateAccessToken(userId, data.email);
  const refreshToken = generateRefreshToken(userId);

  // Store refresh token
  await db
    .update(users)
    .set({ refreshToken })
    .where(eq(users.id, userId));

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: data.email,
      name: data.name || null,
    },
  };
}

/**
 * Login user with email/password
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthTokens> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, credentials.email))
    .limit(1);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user has password (not OAuth-only)
  if (!user.passwordHash) {
    throw new Error('Please login with Google');
  }

  // Verify password
  const isValid = await verifyPassword(credentials.password, user.passwordHash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Ensure user has a START plan (creates one if missing)
  await ensureDefaultPlan(user.id, user.tenantId);

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email!);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token
  await db
    .update(users)
    .set({ refreshToken })
    .where(eq(users.id, user.id));

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email!,
      name: user.name,
    },
  };
}

/**
 * Login or register user with Google OAuth
 */
export async function loginWithGoogle(googleProfile: {
  id: string;
  email: string;
  name: string;
  picture?: string;
}): Promise<AuthTokens> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check if user exists by Google ID
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleProfile.id))
    .limit(1);

  // If not found by Google ID, check by email
  if (!user) {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleProfile.email))
      .limit(1);

    // If found by email, link Google account
    if (user) {
      await db
        .update(users)
        .set({ googleId: googleProfile.id })
        .where(eq(users.id, user.id));
    }
  }

  // If user doesn't exist, create new user
  if (!user) {
    const userId = createId();
    const tenantId = userId;

    const userData: InsertUser = {
      id: userId,
      tenantId,
      email: googleProfile.email,
      name: googleProfile.name,
      googleId: googleProfile.id,
      passwordHash: null, // OAuth users don't have password
      refreshToken: null,
    };

    await db.insert(users).values(userData);

    // Create START license for new user
    await licenseService.createLicense(userId, tenantId, 'START');

    user = userData as any;
  } else {
    // Ensure existing user has a START plan (creates one if missing)
    await ensureDefaultPlan(user.id, user.tenantId);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email!);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token
  await db
    .update(users)
    .set({ refreshToken })
    .where(eq(users.id, user.id));

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email!,
      name: user.name,
    },
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Verify refresh token
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  // Find user and verify refresh token matches
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, decoded.userId))
    .limit(1);

  if (!user || user.refreshToken !== refreshToken) {
    throw new Error('Invalid refresh token');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user.id, user.email!);

  return { accessToken };
}

/**
 * Logout user (invalidate refresh token)
 */
export async function logoutUser(userId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(users)
    .set({ refreshToken: null })
    .where(eq(users.id, userId));
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user || null;
}


/**
 * Get user's license/plan
 */
export async function getUserLicense(userId: string) {
  return licenseService.getLicenseByUserId(userId);
}


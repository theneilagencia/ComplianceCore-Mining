/**
 * Authentication Router
 * Handles login, register, logout, and OAuth routes
 */

import express, { type Request, type Response } from 'express';
import * as authService from './service';
import { passport, configureGoogleOAuth } from './google-oauth';

const router = express.Router();

// Configure Google OAuth
configureGoogleOAuth();

/**
 * POST /api/auth/register
 * Register new user with email/password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Invalid email format',
      });
      return;
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      res.status(400).json({
        error: 'Password must be at least 8 characters long',
      });
      return;
    }

    const authTokens = await authService.registerUser({ email, password, name });

    res.json(authTokens);
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    res.status(400).json({
      error: error.message || 'Registration failed',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user with email/password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required',
      });
      return;
    }

    const authTokens = await authService.loginUser({ email, password });

    res.json(authTokens);
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(401).json({
      error: error.message || 'Login failed',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Refresh token is required',
      });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json(result);
  } catch (error: any) {
    console.error('[Auth] Refresh error:', error);
    res.status(401).json({
      error: error.message || 'Token refresh failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post('/logout', async (req: Request, res: Response) => {
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

    await authService.logoutUser(decoded.userId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Auth] Logout error:', error);
    res.status(400).json({
      error: error.message || 'Logout failed',
    });
  }
});

/**
 * GET /api/auth/session
 * Check if user is authenticated and return session info
 */
router.get('/session', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        authenticated: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        authenticated: false,
        error: 'User not found',
      });
      return;
    }

    // Get user's license/plan
    const license = await authService.getUserLicense(user.id);

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      plan: license?.plan || 'START',
    });
  } catch (error: any) {
    console.error('[Auth] Session check error:', error);
    res.status(401).json({
      authenticated: false,
      error: error.message || 'Authentication failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req: Request, res: Response) => {
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

    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      res.status(404).json({
        error: 'User not found',
      });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    console.error('[Auth] Get user error:', error);
    res.status(401).json({
      error: error.message || 'Authentication failed',
    });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', passport.authenticate('google', { session: false }));

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_auth_failed' }),
  (req: Request, res: Response) => {
    try {
      const authTokens = req.user as any;

      // Redirect to frontend with tokens in URL (will be stored in localStorage)
      const redirectUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback?` +
        `accessToken=${authTokens.accessToken}&` +
        `refreshToken=${authTokens.refreshToken}`;

      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error('[Auth] Google callback error:', error);
      res.redirect('/login?error=google_auth_failed');
    }
  }
);

export default router;


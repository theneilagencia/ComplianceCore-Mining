import { Router } from 'express';

const router = Router();

// System status endpoint for diagnostics
router.get('/status', async (req, res) => {
  try {
    const status = {
      environment: process.env.NODE_ENV || 'development',
      commit: '9ec13b4',
      timestamp: new Date().toISOString(),
      connected: true,
      variables: {
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL: !!process.env.GOOGLE_CALLBACK_URL,
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
        AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
      },
      google_oauth_config: {
        client_id_set: !!process.env.GOOGLE_CLIENT_ID,
        client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
        callback_url: process.env.GOOGLE_CALLBACK_URL || 'NOT_SET',
      }
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

export default router;


import { Router } from 'express';

const router = Router();

// Google OAuth health check endpoint
router.get('/google/health', async (req, res) => {
  try {
    const health = {
      ok: true,
      client_set: !!process.env.GOOGLE_CLIENT_ID,
      secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
      redirect: process.env.GOOGLE_CALLBACK_URL || 'NOT_SET',
      client_id_preview: process.env.GOOGLE_CLIENT_ID 
        ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` 
        : 'NOT_SET',
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to check Google OAuth health' });
  }
});

export default router;


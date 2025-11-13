import { Router } from 'express';
import { createQivoAdmin } from '../modules/dev/create-qivo-admin';

const router = Router();

router.post('/setup-admin', async (req, res) => {
  try {
    const result = await createQivoAdmin();
    res.json(result);
  } catch (error) {
    console.error('[Setup Admin] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;

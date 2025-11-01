/**
 * Endpoint para executar migration da coluna s3Url
 * 
 * Acesse: POST /api/fix-s3url
 * 
 * Este endpoint pode ser chamado manualmente para corrigir
 * o problema da coluna s3Url que tem limite de caracteres.
 */

import { Router } from 'express';
import { Client } from 'pg';

const router = Router();

router.post('/fix-s3url', async (req, res) => {
  console.log('🔧 [fix-s3url] Migration endpoint called');

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ [fix-s3url] DATABASE_URL not configured');
    return res.status(500).json({
      success: false,
      error: 'DATABASE_URL not configured',
    });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('✅ [fix-s3url] Connected to database');

    // Verificar se tabela uploads existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'uploads'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  [fix-s3url] Table uploads does not exist');
      return res.status(404).json({
        success: false,
        error: 'Table uploads does not exist',
      });
    }

    // Verificar tipo atual da coluna s3Url
    const columnCheck = await client.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'uploads' AND column_name = 's3Url';
    `);

    if (columnCheck.rows.length === 0) {
      console.log('⚠️  [fix-s3url] Column s3Url does not exist');
      return res.status(404).json({
        success: false,
        error: 'Column s3Url does not exist',
      });
    }

    const currentType = columnCheck.rows[0];
    console.log('📊 [fix-s3url] Current type:', currentType);

    // Se já é TEXT, não precisa migrar
    if (currentType.data_type === 'text') {
      console.log('✅ [fix-s3url] Column s3Url is already TEXT');
      return res.json({
        success: true,
        message: 'Column s3Url is already TEXT, no migration needed',
        currentType: currentType.data_type,
      });
    }

    // Alterar coluna para TEXT
    console.log(`🔄 [fix-s3url] Migrating s3Url from ${currentType.data_type} to TEXT...`);
    
    await client.query(`
      ALTER TABLE uploads 
      ALTER COLUMN "s3Url" TYPE TEXT;
    `);

    console.log('✅ [fix-s3url] Migration completed successfully');

    // Verificar alteração
    const verifyCheck = await client.query(`
      SELECT data_type
      FROM information_schema.columns 
      WHERE table_name = 'uploads' AND column_name = 's3Url';
    `);

    const newType = verifyCheck.rows[0];

    return res.json({
      success: true,
      message: 'Migration completed successfully',
      previousType: currentType.data_type,
      currentType: newType.data_type,
    });

  } catch (error) {
    console.error('❌ [fix-s3url] Migration failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await client.end();
  }
});

export default router;


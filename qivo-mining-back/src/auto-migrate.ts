/**
 * Auto-Migration Script
 * 
 * Executa automaticamente no startup do servidor para garantir que
 * o schema do banco de dados está correto.
 * 
 * Corrige especificamente o problema da coluna s3Url que tem limite
 * de caracteres muito pequeno.
 */

import { Client } from 'pg';

export async function runAutoMigration() {
  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not configured, skipping auto-migration');
    return;
  }

  console.log('🔧 Running auto-migration...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    // Verificar se tabela uploads existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'uploads'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Table uploads does not exist yet, skipping migration');
      return;
    }

    // Verificar tipo atual da coluna s3Url
    const columnCheck = await client.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'uploads' AND column_name = 's3Url';
    `);

    if (columnCheck.rows.length === 0) {
      console.log('⚠️  Column s3Url does not exist, skipping migration');
      return;
    }

    const currentType = columnCheck.rows[0];
    
    // Se já é TEXT, não precisa migrar
    if (currentType.data_type === 'text') {
      console.log('✅ Column s3Url is already TEXT, no migration needed');
      return;
    }

    // Alterar coluna para TEXT
    console.log(`🔄 Migrating s3Url from ${currentType.data_type} to TEXT...`);
    
    await client.query(`
      ALTER TABLE uploads 
      ALTER COLUMN "s3Url" TYPE TEXT;
    `);

    console.log('✅ Auto-migration completed: s3Url is now TEXT');

  } catch (error) {
    console.error('❌ Auto-migration failed:', error);
    // Não lançar erro para não impedir o startup do servidor
  } finally {
    await client.end();
  }
}


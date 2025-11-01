/**
 * Script para executar migration no banco de dados PostgreSQL
 * 
 * Este script:
 * 1. Conecta ao banco de dados usando DATABASE_URL
 * 2. Verifica o tipo atual da coluna s3Url
 * 3. Altera para TEXT se necessário
 * 4. Confirma a alteração
 */

import { Client } from 'pg';

async function runMigration() {
  console.log('🔧 Iniciando migration...\n');

  // Conectar ao banco de dados
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Necessário para Render
    },
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Verificar tipo atual da coluna
    console.log('🔍 Verificando tipo atual da coluna s3Url...');
    const checkQuery = `
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'uploads' 
        AND column_name = 's3Url';
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Coluna s3Url não encontrada na tabela uploads');
      return;
    }

    const currentType = checkResult.rows[0];
    console.log('📊 Tipo atual:', JSON.stringify(currentType, null, 2));
    console.log('');

    // Alterar coluna para TEXT
    console.log('🔄 Alterando coluna s3Url para TEXT...');
    const alterQuery = `
      ALTER TABLE uploads 
      ALTER COLUMN "s3Url" TYPE TEXT;
    `;
    
    await client.query(alterQuery);
    console.log('✅ Coluna alterada com sucesso!\n');

    // Verificar alteração
    console.log('🔍 Verificando alteração...');
    const verifyResult = await client.query(checkQuery);
    const newType = verifyResult.rows[0];
    console.log('📊 Novo tipo:', JSON.stringify(newType, null, 2));
    console.log('');

    if (newType.data_type === 'text') {
      console.log('🎉 SUCESSO! Coluna s3Url agora aceita URLs de qualquer tamanho!');
    } else {
      console.log('⚠️  Atenção: Tipo não é TEXT. Pode haver um problema.');
    }

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Conexão fechada');
  }
}

// Executar migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na migration:', error);
    process.exit(1);
  });


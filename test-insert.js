#!/usr/bin/env node

/**
 * Script para testar insert na tabela uploads
 * Execute: node test-insert.js
 */

import postgres from 'postgres';
import 'dotenv/config';
import { randomUUID } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada!');
  process.exit(1);
}

console.log('🗄️  Conectando ao banco de dados...');

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

async function testInsert() {
  try {
    // Verificar se tabela existe
    console.log('\n🔍 Verificando se tabela uploads existe...');
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'uploads'
    `;
    
    if (tables.length === 0) {
      console.error('❌ Tabela uploads NÃO EXISTE!');
      console.error('   Execute: node create-uploads-table.js');
      process.exit(1);
    }
    console.log('✅ Tabela uploads existe');

    // Verificar colunas
    console.log('\n🔍 Verificando colunas da tabela...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'uploads'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Colunas:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Tentar fazer insert de teste
    console.log('\n📊 Tentando fazer insert de teste...');
    
    const testData = {
      id: `upl_${randomUUID()}`,
      reportId: `rpt_${randomUUID()}`,
      tenantId: 'test_tenant',
      userId: 'test_user',
      fileName: 'test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      s3Url: null,
      status: 'uploading',
    };

    console.log('\n📝 Dados de teste:');
    console.log(JSON.stringify(testData, null, 2));

    const result = await sql`
      INSERT INTO uploads (
        id, "reportId", "tenantId", "userId", "fileName", 
        "fileSize", "mimeType", "s3Url", status
      ) VALUES (
        ${testData.id}, ${testData.reportId}, ${testData.tenantId}, 
        ${testData.userId}, ${testData.fileName}, ${testData.fileSize}, 
        ${testData.mimeType}, ${testData.s3Url}, ${testData.status}
      )
      RETURNING *
    `;

    console.log('\n✅ INSERT BEM-SUCEDIDO!');
    console.log('\n📋 Registro criado:');
    console.log(JSON.stringify(result[0], null, 2));

    // Limpar registro de teste
    console.log('\n🧹 Limpando registro de teste...');
    await sql`DELETE FROM uploads WHERE id = ${testData.id}`;
    console.log('✅ Registro de teste removido');

    console.log('\n🎉 SUCESSO! A tabela está funcionando corretamente!');
    console.log('\n⚠️  MAS o erro persiste no app. Possíveis causas:');
    console.log('   1. App está conectado a um banco DIFERENTE');
    console.log('   2. DATABASE_URL do app está incorreta');
    console.log('   3. Cache ou problema de conexão');
    
  } catch (error) {
    console.error('\n❌ Erro ao testar insert:');
    console.error(`   ${error.message}`);
    console.error('\n📝 Stack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testInsert();


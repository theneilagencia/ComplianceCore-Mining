#!/usr/bin/env node

/**
 * Script para criar tabela uploads no banco PostgreSQL do Render
 * Execute: node create-uploads-table.js
 */

import postgres from 'postgres';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada!');
  console.error('   Configure a variável de ambiente DATABASE_URL');
  console.error('   Exemplo: export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

console.log('🗄️  Conectando ao banco de dados...');
console.log(`📍 Host: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'hidden'}`);

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

async function createUploadsTable() {
  try {
    console.log('\n📊 Criando tipo enum upload_status...');
    
    // Tentar criar o enum (pode já existir)
    try {
      await sql`
        CREATE TYPE upload_status AS ENUM ('uploading', 'processing', 'completed', 'failed')
      `;
      console.log('✅ Enum upload_status criado');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Enum upload_status já existe');
      } else {
        throw error;
      }
    }

    console.log('\n📊 Criando tabela uploads...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS uploads (
        id VARCHAR(64) PRIMARY KEY,
        "reportId" VARCHAR(64) NOT NULL,
        "tenantId" VARCHAR(64) NOT NULL,
        "userId" VARCHAR(64) NOT NULL,
        "fileName" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "mimeType" VARCHAR(128) NOT NULL,
        "s3Url" TEXT DEFAULT NULL,
        status upload_status DEFAULT 'uploading' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "completedAt" TIMESTAMP DEFAULT NULL
      )
    `;
    console.log('✅ Tabela uploads criada');

    console.log('\n📊 Criando índices...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_uploads_reportId ON uploads("reportId")`;
    console.log('✅ Índice idx_uploads_reportId criado');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_uploads_tenantId ON uploads("tenantId")`;
    console.log('✅ Índice idx_uploads_tenantId criado');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_uploads_userId ON uploads("userId")`;
    console.log('✅ Índice idx_uploads_userId criado');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status)`;
    console.log('✅ Índice idx_uploads_status criado');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_uploads_createdAt ON uploads("createdAt")`;
    console.log('✅ Índice idx_uploads_createdAt criado');

    console.log('\n🔍 Verificando tabela criada...');
    
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'uploads'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Colunas da tabela uploads:');
    result.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n🎉 SUCESSO! Tabela uploads criada com sucesso!');
    console.log('\n✅ Próximo passo: Teste o upload em https://qivo-mining.onrender.com/reports/generate');
    
  } catch (error) {
    console.error('\n❌ Erro ao criar tabela:');
    console.error(`   ${error.message}`);
    console.error('\n📝 Stack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createUploadsTable();


#!/usr/bin/env tsx
/**
 * Script para executar migrações SQL no banco de dados
 * Pode ser executado via Cloud Run Job ou localmente
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || process.env.DB_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurado');
  process.exit(1);
}

console.log('✅ DATABASE_URL configurado');

// Remove sslmode from URL - Cloud Run connects via private VPC without SSL
const cleanUrl = DATABASE_URL.replace(/[?&]sslmode=[^&]+/, '');

console.log('🔌 Connecting to database via private VPC (no SSL)');

const pool = new Pool({
  connectionString: cleanUrl,
  // No SSL needed for Cloud Run -> Cloud SQL via private VPC
  ssl: false
});

const migrations = [
  '0000_postgresql_fix.sql',
];

async function runMigrations() {
  console.log('\n🔄 Executando migrações...\n');

  for (const migration of migrations) {
    const filePath = path.join(__dirname, '../drizzle', migration);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo não encontrado: ${migration}`);
      continue;
    }

    console.log(`📄 Executando: ${migration}`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
      console.log(`   ✅ Migração executada com sucesso\n`);
    } catch (error: any) {
      if (error.code === '42P07') {
        console.log(`   ⚠️  Tabela já existe (ignorando)\n`);
      } else if (error.code === '42701') {
        console.log(`   ⚠️  Coluna já existe (ignorando)\n`);
      } else {
        console.error(`   ❌ Erro: ${error.message}\n`);
      }
    }
  }

  await pool.end();
  console.log('✅ Migrações concluídas!\n');
}

runMigrations().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurado');
  process.exit(1);
}

const cleanUrl = DATABASE_URL.replace(/[?&]sslmode=[^&]+/, '');

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: false
});

async function ensureTables() {
  console.log('🔧 Ensuring all database tables exist...\n');
  
  try {
    // Read SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'create-all-tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ All tables and types ensured successfully!\n');
  } catch (error) {
    console.error('❌ Error ensuring tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

ensureTables().catch(console.error);

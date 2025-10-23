import { Router } from 'express';
import { getDb } from '../../db';
import { users, licenses, reports, audits, tenants } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// Dados de teste
const COMPANIES = [
  "Vale S.A.", "BHP Group", "Rio Tinto", "Glencore", "Anglo American",
  "Newmont Corporation", "Barrick Gold", "Freeport-McMoRan", "Southern Copper",
  "First Quantum Minerals", "Teck Resources", "Lundin Mining", "Kinross Gold"
];

const FIRST_NAMES = [
  "João", "Maria", "Pedro", "Ana", "Carlos", "Juliana", "Ricardo", "Fernanda",
  "Luiz", "Patricia", "Roberto", "Camila", "Fernando", "Mariana", "Paulo"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Lima", "Costa", "Pereira", "Rodrigues",
  "Almeida", "Nascimento", "Carvalho", "Ferreira", "Gomes", "Martins", "Rocha"
];

const MINERALS = [
  "Ouro", "Cobre", "Ferro", "Níquel", "Zinco", "Prata", "Platina", "Paládio",
  "Bauxita", "Manganês", "Lítio", "Cobalto", "Estanho", "Tungstênio"
];

const LOCATIONS = [
  "Minas Gerais", "Pará", "Goiás", "Bahia", "Mato Grosso", "Amazonas",
  "Rondônia", "Tocantins", "Maranhão", "Amapá"
];

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// POST /api/dev/populate-db - Popular banco de dados com dados de teste
router.post('/populate-db', async (req, res) => {
  try {
    console.log('[Populate DB] Starting database population...');
    const db = await getDb();
    
    const stats = {
      users: 0,
      licenses: 0,
      reports: 0,
      audits: 0
    };
    
    // 1. Criar tenant padrão
    const tenantId = 'default_tenant';
    await db.insert(tenants).values({
      id: tenantId,
      name: 'QIVO Mining',
      logoUrl: null,
      s3Prefix: 'qivo-mining',
      createdAt: new Date()
    }).onConflictDoNothing();
    
    // 2. Criar usuários
    console.log('[Populate DB] Creating users...');
    const userIds: string[] = [];
    const userCount = 50;
    
    for (let i = 0; i < userCount; i++) {
      const userId = `user_${String(i + 1).padStart(4, '0')}`;
      const firstName = randomChoice(FIRST_NAMES);
      const lastName = randomChoice(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${randomChoice(['vale.com', 'bhp.com', 'mining.com', 'jorc.com'])}`;
      const passwordHash = hashPassword('Test@2025');
      
      // Distribuição de roles
      const roleRand = Math.random();
      let role: 'user' | 'admin' | 'parceiro' | 'backoffice';
      if (roleRand < 0.80) role = 'user';
      else if (roleRand < 0.95) role = 'parceiro';
      else if (roleRand < 0.99) role = 'backoffice';
      else role = 'admin';
      
      const createdAt = new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000);
      const lastSignedIn = new Date(createdAt.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000);
      
      try {
        await db.insert(users).values({
          id: userId,
          name,
          email,
          passwordHash,
          googleId: null,
          loginMethod: 'email',
          role,
          tenantId,
          refreshToken: null,
          createdAt,
          lastSignedIn
        }).onConflictDoNothing();
        
        userIds.push(userId);
        stats.users++;
      } catch (err) {
        console.log(`[Populate DB] User ${email} already exists, skipping...`);
      }
    }
    
    console.log(`[Populate DB] Created ${stats.users} users`);
    
    // 3. Criar licenças
    console.log('[Populate DB] Creating licenses...');
    for (const userId of userIds) {
      const planRand = Math.random();
      let plan: 'START' | 'PRO' | 'ENTERPRISE';
      let billingPeriod: 'monthly' | 'annual' | null = null;
      let stripeSubscriptionId: string | null = null;
      let stripeCustomerId: string | null = null;
      
      if (planRand < 0.50) {
        plan = 'START';
      } else if (planRand < 0.80) {
        plan = 'PRO';
        billingPeriod = randomChoice(['monthly', 'annual']);
        stripeSubscriptionId = `sub_test_${randomInt(100000, 999999)}`;
        stripeCustomerId = `cus_test_${randomInt(100000, 999999)}`;
      } else {
        plan = 'ENTERPRISE';
        billingPeriod = randomChoice(['monthly', 'annual']);
        stripeSubscriptionId = `sub_test_${randomInt(100000, 999999)}`;
        stripeCustomerId = `cus_test_${randomInt(100000, 999999)}`;
      }
      
      const statusRand = Math.random();
      let status: 'active' | 'expired' | 'cancelled' | 'suspended';
      let startsAt: Date;
      let expiresAt: Date;
      
      if (statusRand < 0.70) {
        status = 'active';
        startsAt = new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000);
        expiresAt = new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else if (statusRand < 0.85) {
        status = 'expired';
        startsAt = new Date(Date.now() - randomInt(400, 730) * 24 * 60 * 60 * 1000);
        expiresAt = new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else if (statusRand < 0.95) {
        status = 'cancelled';
        startsAt = new Date(Date.now() - randomInt(100, 300) * 24 * 60 * 60 * 1000);
        expiresAt = new Date(startsAt.getTime() + randomInt(30, 180) * 24 * 60 * 60 * 1000);
      } else {
        status = 'suspended';
        startsAt = new Date(Date.now() - randomInt(30, 90) * 24 * 60 * 60 * 1000);
        expiresAt = new Date(startsAt.getTime() + 365 * 24 * 60 * 60 * 1000);
      }
      
      try {
        await db.insert(licenses).values({
          userId,
          plan,
          status,
          billingPeriod,
          stripeSubscriptionId,
          stripeCustomerId,
          startsAt,
          expiresAt,
          createdAt: startsAt
        }).onConflictDoUpdate({
          target: licenses.userId,
          set: { plan, status }
        });
        
        stats.licenses++;
      } catch (err) {
        console.log(`[Populate DB] License for ${userId} error:`, err);
      }
    }
    
    console.log(`[Populate DB] Created ${stats.licenses} licenses`);
    
    // 4. Criar relatórios
    console.log('[Populate DB] Creating reports...');
    const reportCount = 100;
    
    for (let i = 0; i < reportCount; i++) {
      const reportId = `report_${String(i + 1).padStart(5, '0')}`;
      const userId = randomChoice(userIds);
      const mineral = randomChoice(MINERALS);
      const location = randomChoice(LOCATIONS);
      const title = `Relatório Técnico - ${mineral} - ${location}`;
      const standard = randomChoice(['JORC_2012', 'NI_43_101', 'PERC', 'SAMREC', 'CRIRSCO', 'CBRR']);
      const status = randomChoice(['draft', 'parsing', 'needs_review', 'ready_for_audit', 'audited', 'certified', 'exported']);
      
      const data = {
        mineral,
        location,
        reserves: randomInt(100000, 10000000),
        grade: (Math.random() * 14.5 + 0.5).toFixed(2),
        confidence: randomChoice(["measured", "indicated", "inferred"])
      };
      
      const createdAt = new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(createdAt.getTime() + randomInt(0, 30) * 24 * 60 * 60 * 1000);
      
      try {
        await db.insert(reports).values({
          id: reportId,
          userId,
          title,
          standard,
          status,
          data: JSON.stringify(data),
          createdAt,
          updatedAt
        }).onConflictDoNothing();
        
        stats.reports++;
      } catch (err) {
        console.log(`[Populate DB] Report ${reportId} error:`, err);
      }
    }
    
    console.log(`[Populate DB] Created ${stats.reports} reports`);
    
    // 5. Criar auditorias
    console.log('[Populate DB] Creating audits...');
    const auditCount = 80;
    
    for (let i = 0; i < auditCount; i++) {
      const auditId = `audit_${String(i + 1).padStart(5, '0')}`;
      const userId = randomChoice(userIds);
      const mineral = randomChoice(MINERALS);
      const location = randomChoice(LOCATIONS);
      const title = `Auditoria KRCI - ${mineral} - ${location}`;
      const auditType = randomChoice(['full', 'partial']);
      const status = randomChoice(['draft', 'in_progress', 'completed', 'approved', 'rejected']);
      
      const data = {
        criteria_checked: randomInt(10, 50),
        issues_found: randomInt(0, 10),
        compliance_score: randomInt(60, 100)
      };
      
      const createdAt = new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(createdAt.getTime() + randomInt(0, 30) * 24 * 60 * 60 * 1000);
      
      try {
        await db.insert(audits).values({
          id: auditId,
          userId,
          title,
          auditType,
          status,
          data: JSON.stringify(data),
          createdAt,
          updatedAt
        }).onConflictDoNothing();
        
        stats.audits++;
      } catch (err) {
        console.log(`[Populate DB] Audit ${auditId} error:`, err);
      }
    }
    
    console.log(`[Populate DB] Created ${stats.audits} audits`);
    
    console.log('[Populate DB] Database population completed!');
    
    res.json({
      success: true,
      message: 'Database populated successfully',
      stats
    });
    
  } catch (error: any) {
    console.error('[Populate DB] Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;


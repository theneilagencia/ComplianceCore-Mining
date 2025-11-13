/**
 * License Management Service - Simplified version
 */

import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../db';
import { licenses } from '../../../drizzle/schema';
import type { License, InsertLicense } from '../../../drizzle/schema';
import { createId } from '@paralleldrive/cuid2';

export type Plan = 'START' | 'PRO' | 'ENTERPRISE';

export const PLAN_LIMITS = {
  START: { reportsLimit: 1, projectsLimit: 1, price: 0 },
  PRO: { reportsLimit: 5, projectsLimit: 3, price: 899, priceAnnual: 9600 },
  ENTERPRISE: { reportsLimit: 15, projectsLimit: -1, price: 1990, priceAnnual: 21000 },
};

export async function createLicense(
  userId: string,
  tenantId: string,
  plan: Plan = 'START',
  billingPeriod?: 'monthly' | 'annual',
  stripeData?: { customerId?: string; subscriptionId?: string; priceId?: string }
): Promise<License> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const limits = PLAN_LIMITS[plan];
  const validUntil = plan === 'START' ? null :
    billingPeriod === 'annual' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) :
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const licenseData: InsertLicense = {
    id: createId(),
    userId,
    tenantId,
    plan,
    status: 'active',
    billingPeriod: billingPeriod || null,
    stripeCustomerId: stripeData?.customerId || null,
    stripeSubscriptionId: stripeData?.subscriptionId || null,
    stripePriceId: stripeData?.priceId || null,
    reportsLimit: limits.reportsLimit,
    reportsUsed: 0,
    projectsLimit: limits.projectsLimit,
    validFrom: new Date(),
    validUntil,
    lastResetAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(licenses).values(licenseData);
  const [license] = await db.select().from(licenses).where(eq(licenses.id, licenseData.id)).limit(1);
  return license!;
}

export async function getUserLicense(userId: string): Promise<License | null> {
  const db = await getDb();
  if (!db) return null;

  const [license] = await db.select().from(licenses)
    .where(and(eq(licenses.userId, userId), eq(licenses.status, 'active')))
    .orderBy(desc(licenses.createdAt))
    .limit(1);

  if (!license) return null;

  // Check expiration
  if (license.validUntil && new Date() > license.validUntil) {
    await updateLicenseStatus(license.id, 'expired');
    return { ...license, status: 'expired' };
  }

  // Check monthly reset
  const daysSinceReset = (Date.now() - new Date(license.lastResetAt!).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceReset >= 30) {
    await resetMonthlyUsage(license.id);
    return { ...license, reportsUsed: 0, lastResetAt: new Date() };
  }

  return license;
}

export async function canCreateReport(userId: string) {
  const license = await getUserLicense(userId);
  if (!license) return { allowed: false, reason: 'No active license' };
  if (license.status !== 'active') return { allowed: false, reason: `License is ${license.status}`, license };
  if (license.reportsUsed >= license.reportsLimit) {
    return { allowed: false, reason: `Monthly limit reached (${license.reportsLimit})`, license };
  }
  return { allowed: true, license };
}

export async function incrementReportUsage(licenseId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(licenses)
    .set({ reportsUsed: db.raw('reports_used + 1'), updatedAt: new Date() })
    .where(eq(licenses.id, licenseId));
}

export async function resetMonthlyUsage(licenseId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(licenses)
    .set({ reportsUsed: 0, lastResetAt: new Date(), updatedAt: new Date() })
    .where(eq(licenses.id, licenseId));
}

export async function updateLicenseStatus(licenseId: string, status: 'active' | 'expired' | 'cancelled' | 'suspended'): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(licenses).set({ status, updatedAt: new Date() }).where(eq(licenses.id, licenseId));
}

export async function upgradeLicense(
  licenseId: string,
  newPlan: Plan,
  billingPeriod: 'monthly' | 'annual',
  stripeData: { subscriptionId: string; priceId: string }
): Promise<License> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const limits = PLAN_LIMITS[newPlan];
  const validUntil = billingPeriod === 'annual' ?
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) :
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.update(licenses).set({
    plan: newPlan,
    status: 'active',
    billingPeriod,
    stripeSubscriptionId: stripeData.subscriptionId,
    stripePriceId: stripeData.priceId,
    reportsLimit: limits.reportsLimit,
    projectsLimit: limits.projectsLimit,
    validUntil,
    updatedAt: new Date(),
  }).where(eq(licenses.id, licenseId));

  const [license] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
  return license!;
}

export async function cancelLicense(licenseId: string): Promise<void> {
  await updateLicenseStatus(licenseId, 'cancelled');
}

export async function getLicenseByStripeSubscription(subscriptionId: string): Promise<License | null> {
  const db = await getDb();
  if (!db) return null;
  const [license] = await db.select().from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscriptionId))
    .limit(1);
  return license || null;
}

export async function getLicenseStats(licenseId: string) {
  const db = await getDb();
  if (!db) return null;

  const [l] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
  if (!l) return null;

  const usagePercentage = (l.reportsUsed / l.reportsLimit) * 100;
  const daysRemaining = l.validUntil ? Math.ceil((l.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return {
    plan: l.plan,
    status: l.status,
    reportsUsed: l.reportsUsed,
    reportsLimit: l.reportsLimit,
    reportsRemaining: l.reportsLimit - l.reportsUsed,
    usagePercentage: Math.round(usagePercentage),
    projectsLimit: l.projectsLimit,
    daysRemaining,
    validUntil: l.validUntil,
    billingPeriod: l.billingPeriod,
  };
}


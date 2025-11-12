/**
 * Ensure Default Plan Helper
 * Guarantees that every user has an active START plan
 */

import { getUserLicense, createLicense } from './service';

/**
 * Ensures that a user has an active license.
 * If no license exists, creates a START plan automatically.
 * 
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns The user's active license
 */
export async function ensureDefaultPlan(userId: string, tenantId: string) {
  console.log(`[Ensure Plan] Checking license for user ${userId}...`);
  
  // Check if user already has an active license
  let license = await getUserLicense(userId);
  
  if (!license) {
    console.log(`[Ensure Plan] No active license found. Creating START plan for user ${userId}...`);
    
    // Create a free START plan
    license = await createLicense(userId, tenantId, 'START');
    
    console.log(`[Ensure Plan] ✅ START plan created successfully for user ${userId}`);
  } else {
    console.log(`[Ensure Plan] ✅ User ${userId} already has active ${license.plan} plan`);
  }
  
  return license;
}


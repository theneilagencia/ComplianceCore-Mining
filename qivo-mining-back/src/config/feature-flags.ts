/**
 * Feature Flags System
 * Centralized feature flag management with environment-based configuration
 * 
 * USAGE:
 * ```typescript
 * import { featureFlags } from '@/server/config/feature-flags';
 * 
 * if (featureFlags.isEnabled('SEC_SK_1300')) {
 *   // Feature is enabled
 * }
 * ```
 */

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  envVar: string;
  defaultValue: boolean;
  enabled: boolean;
  requiresAuth?: boolean;
  requiresApiKeys?: string[];
  betaOnly?: boolean;
  rolloutPercentage?: number; // 0-100
}

/**
 * Feature flag definitions
 */
const FEATURE_FLAGS: Record<string, Omit<FeatureFlag, 'enabled'>> = {
  // SEC S-K 1300 Standard (USA)
  SEC_SK_1300: {
    key: 'SEC_SK_1300',
    name: 'SEC S-K 1300 Standard',
    description: 'Enable SEC S-K 1300 compliance standard for technical reports (USA mining)',
    envVar: 'ENABLE_SEC_SK_1300',
    defaultValue: false,
    betaOnly: true,
    rolloutPercentage: 0, // 0% rollout initially
    requiresAuth: true,
  },

  // Official Government Integrations (Brazil)
  OFFICIAL_INTEGRATIONS: {
    key: 'OFFICIAL_INTEGRATIONS',
    name: 'Official Government Integrations',
    description: 'Enable real-time validation with Brazilian government APIs (ANM, CPRM, IBAMA, ANP)',
    envVar: 'ENABLE_OFFICIAL_INTEGRATIONS',
    defaultValue: false,
    requiresApiKeys: ['ANM_API_KEY', 'CPRM_API_KEY', 'IBAMA_API_KEY', 'ANP_API_KEY'],
    rolloutPercentage: 0, // Start with 0%, gradually increase
  },

  // Brazilian Compliance Fields
  BRAZILIAN_FIELDS: {
    key: 'BRAZILIAN_FIELDS',
    name: 'Brazilian Compliance Fields',
    description: 'Auto-inject 50+ Brazilian regulatory fields in all reports',
    envVar: 'ENABLE_BRAZILIAN_FIELDS',
    defaultValue: true, // Always enabled for Brazilian projects
    requiresAuth: false,
  },

  // Redis Cache
  REDIS_CACHE: {
    key: 'REDIS_CACHE',
    name: 'Redis Cache',
    description: 'Use Redis for caching API responses (recommended for production)',
    envVar: 'REDIS_ENABLED',
    defaultValue: false,
    requiresApiKeys: ['REDIS_URL'],
  },

  // AI-Powered Validation (Future)
  AI_VALIDATION: {
    key: 'AI_VALIDATION',
    name: 'AI-Powered Validation',
    description: 'Use OpenAI to validate technical report content (experimental)',
    envVar: 'ENABLE_AI_VALIDATION',
    defaultValue: false,
    betaOnly: true,
    requiresApiKeys: ['OPENAI_API_KEY'],
  },

  // Advanced Analytics
  ADVANCED_ANALYTICS: {
    key: 'ADVANCED_ANALYTICS',
    name: 'Advanced Analytics',
    description: 'Enable advanced analytics and metrics tracking',
    envVar: 'ENABLE_ADVANCED_ANALYTICS',
    defaultValue: false,
  },
};

/**
 * Feature Flags Manager
 */
class FeatureFlagsManager {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.initializeFlags();
  }

  /**
   * Initialize all feature flags from environment variables
   */
  private initializeFlags(): void {
    Object.values(FEATURE_FLAGS).forEach((flagDef) => {
      const envValue = process.env[flagDef.envVar];
      let enabled = flagDef.defaultValue;

      // Parse environment variable
      if (envValue !== undefined) {
        enabled = envValue === 'true' || envValue === '1';
      }

      // Check required API keys
      if (flagDef.requiresApiKeys && enabled) {
        const missingKeys = flagDef.requiresApiKeys.filter(
          (key) => !process.env[key]
        );
        
        if (missingKeys.length > 0) {
          console.warn(
            `[FeatureFlags] ${flagDef.name} disabled: Missing required API keys: ${missingKeys.join(', ')}`
          );
          enabled = false;
        }
      }

      this.flags.set(flagDef.key, {
        ...flagDef,
        enabled,
      });
    });

    // Log enabled features
    const enabledFeatures = Array.from(this.flags.values())
      .filter((f) => f.enabled)
      .map((f) => f.name);

    if (enabledFeatures.length > 0) {
      console.log('[FeatureFlags] Enabled features:', enabledFeatures.join(', '));
    } else {
      console.log('[FeatureFlags] No features enabled');
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: string): boolean {
    const flag = this.flags.get(key);
    if (!flag) {
      console.warn(`[FeatureFlags] Unknown feature flag: ${key}`);
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      // Simple percentage-based rollout (can be enhanced with user-based hashing)
      const random = Math.random() * 100;
      if (random > flag.rolloutPercentage) {
        return false;
      }
    }

    return flag.enabled;
  }

  /**
   * Get feature flag details
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get all enabled flags
   */
  getEnabledFlags(): FeatureFlag[] {
    return Array.from(this.flags.values()).filter((f) => f.enabled);
  }

  /**
   * Update rollout percentage (for gradual rollout)
   */
  setRolloutPercentage(key: string, percentage: number): void {
    const flag = this.flags.get(key);
    if (!flag) {
      console.warn(`[FeatureFlags] Unknown feature flag: ${key}`);
      return;
    }

    if (percentage < 0 || percentage > 100) {
      console.warn(`[FeatureFlags] Invalid rollout percentage: ${percentage}`);
      return;
    }

    flag.rolloutPercentage = percentage;
    console.log(`[FeatureFlags] ${flag.name} rollout set to ${percentage}%`);
  }

  /**
   * Enable/disable a feature (runtime override)
   */
  setEnabled(key: string, enabled: boolean): void {
    const flag = this.flags.get(key);
    if (!flag) {
      console.warn(`[FeatureFlags] Unknown feature flag: ${key}`);
      return;
    }

    flag.enabled = enabled;
    console.log(`[FeatureFlags] ${flag.name} ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsManager();

// Export helper functions
export const isFeatureEnabled = (key: string): boolean => featureFlags.isEnabled(key);
export const getFeatureFlag = (key: string): FeatureFlag | undefined => featureFlags.getFlag(key);
export const getAllFeatureFlags = (): FeatureFlag[] => featureFlags.getAllFlags();

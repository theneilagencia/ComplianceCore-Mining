/**
 * API Validator Service
 * 
 * Provides centralized validation and fallback handling for external API keys.
 * Prevents fatal errors when API keys are missing in development or production.
 */

export interface ApiValidationResult {
  isValid: boolean;
  service: string;
  status: 'available' | 'skipped' | 'error';
  reason?: string;
}

/**
 * Validate SIGMINE API key
 */
export function validateSigmineApi(): ApiValidationResult {
  const apiKey = process.env.SIGMINE_API_KEY;
  
  if (!apiKey) {
    console.warn('[SIGMINE] API key missing. Data fetch will be skipped.');
    return {
      isValid: false,
      service: 'SIGMINE',
      status: 'skipped',
      reason: 'Missing API key (SIGMINE_API_KEY)'
    };
  }
  
  console.log('[SIGMINE] API key configured ✅');
  return {
    isValid: true,
    service: 'SIGMINE',
    status: 'available'
  };
}

/**
 * Validate MapBiomas API key
 */
export function validateMapBiomasApi(): ApiValidationResult {
  const apiKey = process.env.MAPBIOMAS_API_KEY;
  
  if (!apiKey) {
    console.warn('[MapBiomas] API key missing. Data fetch will be skipped.');
    return {
      isValid: false,
      service: 'MapBiomas',
      status: 'skipped',
      reason: 'Missing API key (MAPBIOMAS_API_KEY)'
    };
  }
  
  console.log('[MapBiomas] API key configured ✅');
  return {
    isValid: true,
    service: 'MapBiomas',
    status: 'available'
  };
}

/**
 * Validate Global Forest Watch API key
 */
export function validateGFWApi(): ApiValidationResult {
  const apiKey = process.env.GFW_API_KEY;
  
  if (!apiKey) {
    console.warn('[GFW] API key missing. Data fetch will be skipped.');
    return {
      isValid: false,
      service: 'GlobalForestWatch',
      status: 'skipped',
      reason: 'Missing API key (GFW_API_KEY)'
    };
  }
  
  console.log('[GFW] API key configured ✅');
  return {
    isValid: true,
    service: 'GlobalForestWatch',
    status: 'available'
  };
}

/**
 * Validate all external APIs
 */
export function validateAllApis(): {
  allValid: boolean;
  results: ApiValidationResult[];
  summary: string;
} {
  const results = [
    validateSigmineApi(),
    validateMapBiomasApi(),
    validateGFWApi()
  ];
  
  const validCount = results.filter(r => r.isValid).length;
  const totalCount = results.length;
  const allValid = validCount === totalCount;
  
  let summary: string;
  if (allValid) {
    summary = `✅ All ${totalCount} external APIs configured`;
  } else if (validCount === 0) {
    summary = `⚠️ No external APIs configured (${totalCount} missing)`;
  } else {
    summary = `⚠️ Partial API configuration: ${validCount}/${totalCount} available`;
  }
  
  console.log('');
  console.log('========================================');
  console.log('External API Validation');
  console.log('========================================');
  console.log(summary);
  results.forEach(result => {
    const icon = result.isValid ? '✅' : '⚠️';
    console.log(`${icon} ${result.service}: ${result.status}`);
    if (result.reason) {
      console.log(`   └─ ${result.reason}`);
    }
  });
  console.log('========================================');
  console.log('');
  
  return { allValid, results, summary };
}

/**
 * Safe fetch wrapper with API key validation
 */
export async function safeFetchWithApi<T>(
  service: 'SIGMINE' | 'MapBiomas' | 'GFW',
  fetchFn: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  let validation: ApiValidationResult;
  
  switch (service) {
    case 'SIGMINE':
      validation = validateSigmineApi();
      break;
    case 'MapBiomas':
      validation = validateMapBiomasApi();
      break;
    case 'GFW':
      validation = validateGFWApi();
      break;
  }
  
  if (!validation.isValid) {
    console.log(`[${service}] Using fallback data due to missing API key`);
    return fallbackValue;
  }
  
  try {
    return await fetchFn();
  } catch (error: any) {
    console.error(`[${service}] API fetch failed:`, error.message);
    console.log(`[${service}] Using fallback data`);
    return fallbackValue;
  }
}

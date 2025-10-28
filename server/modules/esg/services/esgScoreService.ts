/**
 * ESG Score Calculation Service
 * Calculates Environmental, Social, and Governance scores based on metrics
 */

import type { EnvironmentalData, SocialData, GovernanceData } from '../types';

/**
 * Calculate Environmental Score (0-100)
 * Based on emissions, water usage, waste management, energy, and biodiversity
 */
export function calculateEnvironmentalScore(data: EnvironmentalData): number {
  let score = 100;
  const penalties: string[] = [];
  
  // Emissions scoring (max -30 points)
  const totalEmissions = (data.scope1Emissions || 0) + (data.scope2Emissions || 0) + (data.scope3Emissions || 0);
  if (totalEmissions > 100000) {
    score -= 30;
    penalties.push('Very high GHG emissions');
  } else if (totalEmissions > 50000) {
    score -= 20;
    penalties.push('High GHG emissions');
  } else if (totalEmissions > 10000) {
    score -= 10;
    penalties.push('Moderate GHG emissions');
  }
  
  // Water management (max -20 points)
  if (data.waterWithdrawal && data.waterRecycled) {
    const recyclingRate = data.waterRecycled / data.waterWithdrawal;
    if (recyclingRate < 0.2) {
      score -= 20;
      penalties.push('Low water recycling rate');
    } else if (recyclingRate < 0.5) {
      score -= 10;
      penalties.push('Moderate water recycling rate');
    } else {
      score += 5; // Bonus for high recycling
    }
  }
  
  // Waste management (max -20 points)
  if (data.wasteGenerated && data.wasteRecycled) {
    const recyclingRate = data.wasteRecycled / data.wasteGenerated;
    if (recyclingRate < 0.3) {
      score -= 20;
      penalties.push('Low waste recycling rate');
    } else if (recyclingRate < 0.6) {
      score -= 10;
      penalties.push('Moderate waste recycling rate');
    } else {
      score += 5; // Bonus for high recycling
    }
  }
  
  // Renewable energy (max +10 points)
  if (data.energyConsumption && data.renewableEnergy) {
    const renewableRate = data.renewableEnergy / data.energyConsumption;
    if (renewableRate > 0.5) {
      score += 10;
    } else if (renewableRate > 0.25) {
      score += 5;
    }
  }
  
  // Biodiversity protection (max +10 points)
  if (data.protectedAreas && data.protectedAreas > 100) {
    score += 10;
  } else if (data.protectedAreas && data.protectedAreas > 50) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate Social Score (0-100)
 * Based on workforce diversity, safety, community engagement, and human rights
 */
export function calculateSocialScore(data: SocialData): number {
  let score = 100;
  const penalties: string[] = [];
  
  // Safety scoring (max -40 points)
  if (data.fatalityRate && data.fatalityRate > 0) {
    score -= 40;
    penalties.push('Fatalities reported');
  } else if (data.lostTimeInjuryFrequency && data.lostTimeInjuryFrequency > 5) {
    score -= 20;
    penalties.push('High injury frequency rate');
  } else if (data.lostTimeInjuryFrequency && data.lostTimeInjuryFrequency > 2) {
    score -= 10;
    penalties.push('Moderate injury frequency rate');
  }
  
  // Diversity scoring (max +10 points)
  if (data.totalEmployees && data.femaleEmployees) {
    const femaleRate = data.femaleEmployees / data.totalEmployees;
    if (femaleRate > 0.3) {
      score += 10;
    } else if (femaleRate > 0.2) {
      score += 5;
    }
  }
  
  // Local employment (max +10 points)
  if (data.totalEmployees && data.localEmployees) {
    const localRate = data.localEmployees / data.totalEmployees;
    if (localRate > 0.7) {
      score += 10;
    } else if (localRate > 0.5) {
      score += 5;
    }
  }
  
  // Community engagement (max -20 points)
  if (data.grievancesReceived && data.grievancesResolved) {
    const resolutionRate = data.grievancesResolved / data.grievancesReceived;
    if (resolutionRate < 0.5) {
      score -= 20;
      penalties.push('Low grievance resolution rate');
    } else if (resolutionRate < 0.8) {
      score -= 10;
      penalties.push('Moderate grievance resolution rate');
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate Governance Score (0-100)
 * Based on board composition, ethics, and compliance
 */
export function calculateGovernanceScore(data: GovernanceData): number {
  let score = 100;
  const penalties: string[] = [];
  
  // Corruption and ethics (max -50 points)
  if (data.corruptionIncidents && data.corruptionIncidents > 0) {
    score -= 50;
    penalties.push('Corruption incidents reported');
  }
  
  // Regulatory compliance (max -30 points)
  if (data.environmentalFines && data.environmentalFines > 1000000) {
    score -= 30;
    penalties.push('Significant environmental fines');
  } else if (data.environmentalFines && data.environmentalFines > 100000) {
    score -= 15;
    penalties.push('Moderate environmental fines');
  }
  
  if (data.regulatoryViolations && data.regulatoryViolations > 5) {
    score -= 20;
    penalties.push('Multiple regulatory violations');
  } else if (data.regulatoryViolations && data.regulatoryViolations > 0) {
    score -= 10;
    penalties.push('Regulatory violations reported');
  }
  
  // Board diversity (max +10 points)
  if (data.boardMembers && data.femaleDirectors) {
    const femaleRate = data.femaleDirectors / data.boardMembers;
    if (femaleRate > 0.3) {
      score += 10;
    } else if (femaleRate > 0.2) {
      score += 5;
    }
  }
  
  // Board independence (max +10 points)
  if (data.boardMembers && data.independentDirectors) {
    const independenceRate = data.independentDirectors / data.boardMembers;
    if (independenceRate > 0.5) {
      score += 10;
    } else if (independenceRate > 0.3) {
      score += 5;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate overall ESG score
 */
export function calculateOverallESGScore(
  environmentalScore: number,
  socialScore: number,
  governanceScore: number
): number {
  // Weighted average: E=40%, S=30%, G=30%
  return Math.round(
    environmentalScore * 0.4 +
    socialScore * 0.3 +
    governanceScore * 0.3
  );
}

/**
 * Get ESG rating based on score
 */
export function getESGRating(score: number): {
  rating: string;
  description: string;
  color: string;
} {
  if (score >= 80) {
    return {
      rating: 'AAA',
      description: 'Leader - Outstanding ESG performance',
      color: 'green',
    };
  } else if (score >= 70) {
    return {
      rating: 'AA',
      description: 'Advanced - Strong ESG performance',
      color: 'lightgreen',
    };
  } else if (score >= 60) {
    return {
      rating: 'A',
      description: 'Good - Above average ESG performance',
      color: 'lime',
    };
  } else if (score >= 50) {
    return {
      rating: 'BBB',
      description: 'Average - Moderate ESG performance',
      color: 'yellow',
    };
  } else if (score >= 40) {
    return {
      rating: 'BB',
      description: 'Below Average - Needs improvement',
      color: 'orange',
    };
  } else {
    return {
      rating: 'B',
      description: 'Laggard - Significant ESG risks',
      color: 'red',
    };
  }
}


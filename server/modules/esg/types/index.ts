/**
 * ESG Reporting Types
 * Types for Environmental, Social, and Governance reporting
 */

export type ESGFramework = 'GRI' | 'SASB' | 'TCFD' | 'CDP';

export interface ESGReportInput {
  projectName: string;
  reportingPeriod: string;
  framework: ESGFramework;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  environmental?: EnvironmentalData;
  social?: SocialData;
  governance?: GovernanceData;
}

export interface EnvironmentalData {
  // Emissions (Scope 1, 2, 3)
  scope1Emissions?: number; // Direct GHG emissions (tCO2e)
  scope2Emissions?: number; // Indirect GHG emissions from energy (tCO2e)
  scope3Emissions?: number; // Other indirect emissions (tCO2e)
  
  // Water
  waterWithdrawal?: number; // m³
  waterConsumption?: number; // m³
  waterRecycled?: number; // m³
  
  // Waste
  wasteGenerated?: number; // tonnes
  wasteRecycled?: number; // tonnes
  hazardousWaste?: number; // tonnes
  
  // Energy
  energyConsumption?: number; // MWh
  renewableEnergy?: number; // MWh
  
  // Biodiversity
  protectedAreas?: number; // hectares
  restoredAreas?: number; // hectares
  
  // Air Quality
  particulateMatter?: number; // PM2.5/PM10
  sox?: number; // SO₂ emissions
  nox?: number; // NOₓ emissions
}

export interface SocialData {
  // Workforce
  totalEmployees?: number;
  femaleEmployees?: number;
  localEmployees?: number;
  
  // Safety
  lostTimeInjuryFrequency?: number; // LTIFR
  fatalityRate?: number;
  safetyTrainingHours?: number;
  
  // Community
  communityInvestment?: number; // USD
  localProcurement?: number; // %
  grievancesReceived?: number;
  grievancesResolved?: number;
  
  // Human Rights
  humanRightsAssessments?: number;
  indigenousConsultations?: number;
}

export interface GovernanceData {
  // Board
  boardMembers?: number;
  independentDirectors?: number;
  femaleDirectors?: number;
  
  // Ethics
  corruptionIncidents?: number;
  ethicsTrainingHours?: number;
  whistleblowerReports?: number;
  
  // Compliance
  environmentalFines?: number; // USD
  socialFines?: number; // USD
  regulatoryViolations?: number;
}

export interface IBAMAData {
  licenseNumber?: string;
  licenseType?: 'LP' | 'LI' | 'LO'; // Prévia, Instalação, Operação
  issueDate?: string;
  expiryDate?: string;
  status?: 'active' | 'expired' | 'pending';
  conditions?: string[];
}

export interface CopernicusData {
  // Satellite imagery analysis
  deforestationArea?: number; // hectares
  vegetationIndex?: number; // NDVI
  landCoverChange?: {
    forest?: number;
    mining?: number;
    water?: number;
    urban?: number;
  };
  airQualityIndex?: number;
}

export interface ESGReport {
  id: string;
  projectName: string;
  reportingPeriod: string;
  framework: ESGFramework;
  createdAt: Date;
  environmental: EnvironmentalData;
  social: SocialData;
  governance: GovernanceData;
  ibama?: IBAMAData;
  copernicus?: CopernicusData;
  score?: {
    environmental: number; // 0-100
    social: number; // 0-100
    governance: number; // 0-100
    overall: number; // 0-100
  };
  pdfUrl?: string;
}


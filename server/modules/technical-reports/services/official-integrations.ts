/**
 * Official Integrations Service (LEGACY - Migrated to official-integrations/)
 * 
 * ⚠️ This file now delegates to the new real API implementations
 * See: server/modules/technical-reports/services/official-integrations/
 * 
 * Migration Status: PHASE 2 COMPLETE
 * - ANM: Real API ✅
 * - CPRM: Real API ✅
 * - IBAMA: Real API ✅
 * - ANP: Real API ✅
 */

import {
  validateReportData,
  validateField,
  ValidationResult,
  ValidationSummary,
} from './official-integrations/index';

// Re-export types for backward compatibility
export type { ValidationResult, ValidationSummary };

interface ValidationResultLegacy {
  source: 'ANM' | 'CPRM' | 'IBAMA' | 'ANP';
  field: string;
  status: 'valid' | 'invalid' | 'not_found' | 'error';
  message: string;
  officialValue?: any;
  reportValue?: any;
  url?: string;
}

interface OfficialIntegrationResult {
  reportId: string;
  validations: ValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    notFound: number;
    errors: number;
  };
  recommendations: string[];
}

/**
 * Validate report data against ANM (mining titles)
 * @deprecated Use validateReportData() from official-integrations/index.ts
 */
async function validateWithANM(reportData: any): Promise<ValidationResult[]> {
  // Delegate to new real API implementation
  const { validateWithANM_Real, validateSubstanceANM } = await import('./official-integrations/anm');
  const results: ValidationResult[] = [];

  try {
    if (reportData.miningTitleNumber) {
      const result = await validateWithANM_Real(reportData.miningTitleNumber);
      results.push(result);
    }

    if (reportData.commodity) {
      const result = await validateSubstanceANM(reportData.commodity);
      results.push(result);
    }

    // Validate location (state)
    if (reportData.location) {
      const brazilianStates = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
      ];

      const locationUpper = reportData.location.toUpperCase();
      const stateMatch = brazilianStates.find((state) =>
        locationUpper.includes(state)
      );

      if (stateMatch) {
        results.push({
          source: 'ANM',
          field: 'location',
          status: 'valid',
          message: `Localização em ${stateMatch} - estado válido`,
          reportValue: reportData.location,
        });
      } else {
        results.push({
          source: 'ANM',
          field: 'location',
          status: 'invalid',
          message: 'Estado brasileiro não identificado na localização',
          reportValue: reportData.location,
        });
      }
    }
  } catch (error) {
    results.push({
      source: 'ANM',
      field: 'general',
      status: 'error',
      message: `Erro ao validar com ANM: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return results;
}

/**
 * Validate report data against CPRM (geological data)
 * @deprecated Use validateReportData() from official-integrations/index.ts
 */
async function validateWithCPRM(reportData: any): Promise<ValidationResult[]> {
  const { validateWithCPRM_Real } = await import('./official-integrations/cprm');
  const results: ValidationResult[] = [];

  try {
    if (reportData.coordinates && reportData.coordinates.latitude && reportData.coordinates.longitude) {
      const result = await validateWithCPRM_Real(
        reportData.coordinates.latitude,
        reportData.coordinates.longitude,
        reportData.geologicalFormation
      );
      results.push(result);
    }
  } catch (error) {
    results.push({
      source: 'CPRM',
      field: 'general',
      status: 'error',
      message: `Erro ao validar com CPRM: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return results;
}

/**
 * Validate report data against IBAMA (environmental licenses)
 * @deprecated Use validateReportData() from official-integrations/index.ts
 */
async function validateWithIBAMA(reportData: any): Promise<ValidationResult[]> {
  const { validateWithIBAMA_Real } = await import('./official-integrations/ibama');
  const results: ValidationResult[] = [];

  try {
    if (reportData.environmentalLicense) {
      const result = await validateWithIBAMA_Real(reportData.environmentalLicense);
      results.push(result);
    }
  } catch (error) {
    results.push({
      source: 'IBAMA',
      field: 'general',
      status: 'error',
      message: `Erro ao validar com IBAMA: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return results;
}

/**
 * Validate report data against ANP (oil & gas concessions)
 * @deprecated Use validateReportData() from official-integrations/index.ts
 */
async function validateWithANP(reportData: any): Promise<ValidationResult[]> {
  const { validateWithANP_Real } = await import('./official-integrations/anp');
  const results: ValidationResult[] = [];

  try {
    if (reportData.concessionNumber) {
      const result = await validateWithANP_Real(reportData.concessionNumber);
      results.push(result);
    }
  } catch (error) {
    results.push({
      source: 'ANP',
      field: 'general',
      status: 'error',
      message: `Erro ao validar com ANP: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return results;
}

/**
 * LEGACY STUB - Old IBAMA validation removed
 * @deprecated
 */
async function __OLD_validateWithIBAMA(reportData: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  try {
    if (reportData.environmentalLicense) {
      const ibamaPattern = /\d{5,}/; // At least 5 digits

      if (ibamaPattern.test(reportData.environmentalLicense)) {
        results.push({
          source: 'IBAMA',
          field: 'environmentalLicense',
          status: 'valid',
          message: 'Formato de licença ambiental válido',
          reportValue: reportData.environmentalLicense,
          url: 'https://servicos.ibama.gov.br/licenciamento/consulta',
        });
      } else {
        results.push({
          source: 'IBAMA',
          field: 'environmentalLicense',
          status: 'invalid',
          message: 'Formato de licença ambiental inválido',
          reportValue: reportData.environmentalLicense,
        });
      }
    } else {
      results.push({
        source: 'IBAMA',
        field: 'environmentalLicense',
        status: 'not_found',
        message: 'Licença ambiental não informada no relatório',
      });
    }

    // Validate license type
    if (reportData.licenseType) {
      const validTypes = ['LP', 'LI', 'LO', 'LAP', 'LAR', 'LAS'];
      const typeUpper = reportData.licenseType.toUpperCase();

      if (validTypes.includes(typeUpper)) {
        results.push({
          source: 'IBAMA',
          field: 'licenseType',
          status: 'valid',
          message: `Tipo de licença ${typeUpper} válido`,
          reportValue: reportData.licenseType,
        });
      } else {
        results.push({
          source: 'IBAMA',
          field: 'licenseType',
          status: 'invalid',
          message: `Tipo de licença "${reportData.licenseType}" não reconhecido. Tipos válidos: LP, LI, LO, LAP, LAR, LAS`,
          reportValue: reportData.licenseType,
        });
      }
    }

    // Validate environmental impact assessment
    if (reportData.hasEIA) {
      results.push({
        source: 'IBAMA',
        field: 'environmentalImpact',
        status: 'valid',
        message: 'EIA/RIMA informado no relatório',
        reportValue: 'Sim',
      });
    } else {
      results.push({
        source: 'IBAMA',
        field: 'environmentalImpact',
        status: 'not_found',
        message: 'EIA/RIMA não mencionado. Verifique se é necessário para o projeto.',
      });
    }
  } catch (error) {
    results.push({
      source: 'IBAMA',
      field: 'general',
      status: 'error',
      message: `Erro ao validar com IBAMA: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return results;
}

/**
 * Run all official integrations
 */
export async function validateWithOfficialSources(
  reportId: string,
  reportData: any
): Promise<OfficialIntegrationResult> {
  const validations: ValidationResult[] = [];

  // Run all validations in parallel
  const [anmResults, cprmResults, ibamaResults] = await Promise.all([
    validateWithANM(reportData),
    validateWithCPRM(reportData),
    validateWithIBAMA(reportData),
  ]);

  validations.push(...anmResults, ...cprmResults, ...ibamaResults);

  // Calculate summary
  const summary = {
    total: validations.length,
    valid: validations.filter((v) => v.status === 'valid').length,
    invalid: validations.filter((v) => v.status === 'invalid').length,
    notFound: validations.filter((v) => v.status === 'not_found').length,
    errors: validations.filter((v) => v.status === 'error').length,
  };

  // Generate recommendations
  const recommendations: string[] = [];

  if (summary.invalid > 0) {
    recommendations.push(
      `Corrija ${summary.invalid} campo(s) inválido(s) para conformidade com fontes oficiais`
    );
  }

  if (summary.notFound > 0) {
    recommendations.push(
      `Complete ${summary.notFound} campo(s) ausente(s) com informações das fontes oficiais`
    );
  }

  if (summary.errors > 0) {
    recommendations.push(
      `Verifique ${summary.errors} erro(s) de integração com APIs oficiais`
    );
  }

  const anmInvalid = validations.filter(
    (v) => v.source === 'ANM' && v.status === 'invalid'
  ).length;
  if (anmInvalid > 0) {
    recommendations.push(
      'Consulte o Sistema de Cadastro Mineiro (SCM) da ANM para validar dados minerários'
    );
  }

  const cprmInvalid = validations.filter(
    (v) => v.source === 'CPRM' && v.status === 'invalid'
  ).length;
  if (cprmInvalid > 0) {
    recommendations.push(
      'Consulte o GeoSGB da CPRM para validar nomenclatura geológica'
    );
  }

  const ibamaInvalid = validations.filter(
    (v) => v.source === 'IBAMA' && v.status === 'invalid'
  ).length;
  if (ibamaInvalid > 0) {
    recommendations.push(
      'Consulte o sistema de licenciamento do IBAMA para validar licenças ambientais'
    );
  }

  return {
    reportId,
    validations,
    summary,
    recommendations,
  };
}

/**
 * Get validation status badge
 */
export function getValidationBadge(status: ValidationResult['status']): string {
  switch (status) {
    case 'valid':
      return '✅';
    case 'invalid':
      return '❌';
    case 'not_found':
      return '⚠️';
    case 'error':
      return '🔴';
    default:
      return '⚪';
  }
}


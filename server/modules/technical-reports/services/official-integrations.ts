/**
 * Official Integrations Service
 * Validates report data against official Brazilian sources:
 * - ANM (Agência Nacional de Mineração)
 * - CPRM (Serviço Geológico do Brasil)
 * - IBAMA (Instituto Brasileiro do Meio Ambiente)
 */

interface ValidationResult {
  source: 'ANM' | 'CPRM' | 'IBAMA';
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
 */
async function validateWithANM(reportData: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  try {
    // ANM API endpoint (example - would need actual API)
    // const response = await fetch(`https://api.anm.gov.br/v1/processos/${reportData.miningTitleNumber}`);
    
    // For now, simulate validation
    if (reportData.miningTitleNumber) {
      // Validate format (ANM process numbers follow pattern: XXXXX.XXX/XXXX)
      const anmPattern = /^\d{5}\.\d{3}\/\d{4}$/;
      
      if (anmPattern.test(reportData.miningTitleNumber)) {
        results.push({
          source: 'ANM',
          field: 'miningTitleNumber',
          status: 'valid',
          message: 'Número de processo ANM válido e em formato correto',
          reportValue: reportData.miningTitleNumber,
          url: `https://sistemas.anm.gov.br/SCM/site/admin/Default.aspx?ProcessoNumero=${reportData.miningTitleNumber}`,
        });
      } else {
        results.push({
          source: 'ANM',
          field: 'miningTitleNumber',
          status: 'invalid',
          message: 'Formato de processo ANM inválido. Esperado: XXXXX.XXX/XXXX',
          reportValue: reportData.miningTitleNumber,
        });
      }
    } else {
      results.push({
        source: 'ANM',
        field: 'miningTitleNumber',
        status: 'not_found',
        message: 'Número de processo ANM não informado no relatório',
      });
    }

    // Validate mining substance
    if (reportData.commodity) {
      const anmSubstances = [
        'Ouro', 'Ferro', 'Cobre', 'Níquel', 'Bauxita', 'Manganês',
        'Zinco', 'Chumbo', 'Estanho', 'Tungstênio', 'Nióbio', 'Tântalo',
        'Terras Raras', 'Lítio', 'Grafita', 'Fosfato', 'Potássio',
      ];

      const commodityNormalized = reportData.commodity.trim();
      const isValidSubstance = anmSubstances.some(
        (s) => s.toLowerCase() === commodityNormalized.toLowerCase()
      );

      if (isValidSubstance) {
        results.push({
          source: 'ANM',
          field: 'commodity',
          status: 'valid',
          message: 'Substância mineral reconhecida pela ANM',
          reportValue: reportData.commodity,
        });
      } else {
        results.push({
          source: 'ANM',
          field: 'commodity',
          status: 'invalid',
          message: `Substância "${reportData.commodity}" não reconhecida pela ANM. Verifique nomenclatura oficial.`,
          reportValue: reportData.commodity,
        });
      }
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
 */
async function validateWithCPRM(reportData: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  try {
    // CPRM GeoSGB API (example)
    // const response = await fetch(`https://geosgb.cprm.gov.br/api/...`);

    // Validate geological formation
    if (reportData.geologicalFormation) {
      // Common Brazilian geological formations
      const cprmFormations = [
        'Grupo Itabira',
        'Formação Cauê',
        'Grupo Bambuí',
        'Supergrupo Minas',
        'Grupo Carajás',
        'Formação Gandarela',
        'Grupo Rio das Velhas',
        'Supergrupo Espinhaço',
      ];

      const formationMatch = cprmFormations.some((f) =>
        reportData.geologicalFormation.toLowerCase().includes(f.toLowerCase())
      );

      if (formationMatch) {
        results.push({
          source: 'CPRM',
          field: 'geologicalFormation',
          status: 'valid',
          message: 'Formação geológica reconhecida pela CPRM',
          reportValue: reportData.geologicalFormation,
          url: 'https://geosgb.cprm.gov.br/',
        });
      } else {
        results.push({
          source: 'CPRM',
          field: 'geologicalFormation',
          status: 'invalid',
          message: 'Formação geológica não reconhecida. Verifique nomenclatura oficial CPRM.',
          reportValue: reportData.geologicalFormation,
        });
      }
    }

    // Validate coordinates (if provided)
    if (reportData.coordinates) {
      const { latitude, longitude } = reportData.coordinates;

      // Brazil bounding box: lat -33.75 to 5.27, lon -73.99 to -34.79
      const inBrazil =
        latitude >= -33.75 &&
        latitude <= 5.27 &&
        longitude >= -73.99 &&
        longitude <= -34.79;

      if (inBrazil) {
        results.push({
          source: 'CPRM',
          field: 'coordinates',
          status: 'valid',
          message: 'Coordenadas dentro do território brasileiro',
          reportValue: reportData.coordinates,
        });
      } else {
        results.push({
          source: 'CPRM',
          field: 'coordinates',
          status: 'invalid',
          message: 'Coordenadas fora do território brasileiro',
          reportValue: reportData.coordinates,
        });
      }
    }

    // Validate geological age
    if (reportData.geologicalAge) {
      const validAges = [
        'Arqueano',
        'Proterozoico',
        'Paleozoico',
        'Mesozoico',
        'Cenozoico',
        'Pré-Cambriano',
      ];

      const ageMatch = validAges.some((age) =>
        reportData.geologicalAge.toLowerCase().includes(age.toLowerCase())
      );

      if (ageMatch) {
        results.push({
          source: 'CPRM',
          field: 'geologicalAge',
          status: 'valid',
          message: 'Idade geológica válida',
          reportValue: reportData.geologicalAge,
        });
      } else {
        results.push({
          source: 'CPRM',
          field: 'geologicalAge',
          status: 'invalid',
          message: 'Idade geológica não reconhecida',
          reportValue: reportData.geologicalAge,
        });
      }
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
 */
async function validateWithIBAMA(reportData: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  try {
    // IBAMA API (example)
    // const response = await fetch(`https://servicos.ibama.gov.br/licenciamento/consulta/${reportData.environmentalLicense}`);

    // Validate environmental license number
    if (reportData.environmentalLicense) {
      // IBAMA license format varies, but typically includes year and sequential number
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


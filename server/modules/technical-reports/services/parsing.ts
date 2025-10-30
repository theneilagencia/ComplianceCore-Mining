import { storagePut, storageGet } from "../../../storage";

/**
 * ETAPA 2: Serviço de Parsing e Normalização
 * 
 * Responsável por:
 * 1. Detectar tipo de arquivo (PDF, DOCX, XLSX, CSV, ZIP)
 * 2. Extrair conteúdo e estruturar em formato padronizado
 * 3. Detectar padrão internacional (JORC, NI 43-101, PERC, SAMREC, CRIRSCO)
 * 4. Marcar campos incertos com _uncertain: true
 * 5. Gerar normalized.json
 */

export interface NormalizedReport {
  metadata: {
    reportId: string;
    detectedStandard: string;
    confidence: number;
    parsedAt: string;
    fileType: string;
  };
  sections: Section[];
  resourceEstimates: ResourceEstimate[];
  competentPersons: CompetentPerson[];
  economicAssumptions: EconomicAssumption[];
  _hasUncertainFields: boolean;
}

export interface Section {
  id: string;
  title: string;
  contentText?: string;
  _uncertain?: boolean;
  hint?: string;
}

export interface ResourceEstimate {
  category: string; // Measured, Indicated, Inferred
  tonnage?: number;
  grade?: number;
  cutoffGrade?: number;
  _uncertain?: boolean;
  hint?: string;
}

export interface CompetentPerson {
  name?: string;
  qualification?: string;
  organization?: string;
  _uncertain?: boolean;
  hint?: string;
}

export interface EconomicAssumption {
  parameter: string;
  value?: string | number;
  _uncertain?: boolean;
  hint?: string;
}

export interface ParsingResult {
  normalized: NormalizedReport;
  summary: {
    totalFields: number;
    uncertainFields: number;
    detectedStandard: string;
    confidence: number;
    warnings: string[];
  };
  status: "needs_review" | "ready_for_audit";
}

/**
 * Detecta o tipo de documento (relatório técnico vs outros)
 */
function detectDocumentType(text: string): { type: 'technical_report' | 'api_documentation' | 'general' | 'unknown'; confidence: number; reason: string } {
  const lowerText = text.toLowerCase();
  
  // Detectar documentação de API
  const apiKeywords = ['api', 'endpoint', 'swagger', 'rest', 'post /', 'get /', 'headers:', 'body (json)', 'response:'];
  const apiMatches = apiKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  if (apiMatches >= 4) {
    return {
      type: 'api_documentation',
      confidence: Math.min(apiMatches / apiKeywords.length, 1),
      reason: 'Documento contém terminologia típica de documentação de API'
    };
  }
  
  // Detectar relatório técnico de mineração
  const technicalKeywords = [
    'jorc', 'ni 43-101', 'perc', 'samrec',
    'mineral resource', 'ore reserve', 'competent person',
    'geological interpretation', 'sampling', 'drilling',
    'resource estimation', 'grade', 'tonnage'
  ];
  const technicalMatches = technicalKeywords.filter(keyword => lowerText.includes(keyword)).length;
  
  if (technicalMatches >= 3) {
    return {
      type: 'technical_report',
      confidence: Math.min(technicalMatches / technicalKeywords.length, 1),
      reason: 'Documento contém terminologia típica de relatórios técnicos de mineração'
    };
  }
  
  // Documento genérico
  if (text.length > 500) {
    return {
      type: 'general',
      confidence: 0.5,
      reason: 'Documento não identificado como relatório técnico de mineração'
    };
  }
  
  return {
    type: 'unknown',
    confidence: 0,
    reason: 'Tipo de documento desconhecido ou conteúdo insuficiente'
  };
}

/**
 * Detecta o padrão internacional baseado em palavras-chave
 */
function detectStandard(text: string): { standard: string; confidence: number } {
  const patterns = {
    JORC_2012: [
      /jorc\s*2012/i,
      /table\s*1/i,
      /competent\s*person/i,
      /mineral\s*resource/i,
      /ore\s*reserve/i,
    ],
    NI_43_101: [
      /ni\s*43-101/i,
      /national\s*instrument/i,
      /qualified\s*person/i,
      /item\s*14/i,
      /technical\s*report/i,
    ],
    PERC: [
      /perc\s*reporting/i,
      /pan-european/i,
      /european\s*reporting/i,
    ],
    SAMREC: [
      /samrec/i,
      /south\s*african/i,
      /mineral\s*resource/i,
    ],
    CRIRSCO: [
      /crirsco/i,
      /international\s*reporting/i,
    ],
  };

  let bestMatch = { standard: "UNKNOWN", confidence: 0 };

  for (const [standard, regexes] of Object.entries(patterns)) {
    let matches = 0;
    for (const regex of regexes) {
      if (regex.test(text)) {
        matches++;
      }
    }
    const confidence = matches / regexes.length;
    if (confidence > bestMatch.confidence) {
      bestMatch = { standard, confidence };
    }
  }

  return bestMatch;
}

/**
 * Extrai seções do texto
 */
function extractSections(text: string, standard: string): Section[] {
  const sections: Section[] = [];
  
  // Heurística simples: dividir por títulos numerados ou seções conhecidas
  const sectionPatterns = [
    /^\s*(\d+\.?\s+[A-Z][^\n]{10,80})\s*$/gm,
    /^\s*(Section\s+\d+[^\n]{10,80})\s*$/gim,
    /^\s*(Item\s+\d+[^\n]{10,80})\s*$/gim,
  ];

  let sectionMatches: { title: string; index: number }[] = [];
  
  for (const pattern of sectionPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      sectionMatches.push({
        title: match[1].trim(),
        index: match.index || 0,
      });
    }
  }

  // Ordenar por posição no texto
  sectionMatches.sort((a, b) => a.index - b.index);

  // Extrair conteúdo entre seções
  for (let i = 0; i < sectionMatches.length; i++) {
    const current = sectionMatches[i];
    const next = sectionMatches[i + 1];
    
    const startIndex = current.index + current.title.length;
    const endIndex = next ? next.index : text.length;
    
    const content = text.substring(startIndex, endIndex).trim();
    
    sections.push({
      id: `section_${i + 1}`,
      title: current.title,
      contentText: content.substring(0, 500), // Limitar para não ficar muito grande
      _uncertain: content.length < 50, // Marcar como incerto se muito curto
      hint: content.length < 50 ? "Seção com conteúdo insuficiente" : undefined,
    });
  }

  // Se não encontrou seções, criar uma genérica
  if (sections.length === 0) {
    sections.push({
      id: "section_1",
      title: "Conteúdo Principal",
      contentText: text.substring(0, 500),
      _uncertain: true,
      hint: "Não foi possível identificar seções estruturadas",
    });
  }

  return sections;
}

/**
 * Extrai estimativas de recursos
 */
function extractResourceEstimates(text: string): ResourceEstimate[] {
  const estimates: ResourceEstimate[] = [];
  
  // Procurar por tabelas de recursos
  const categories = ["Measured", "Indicated", "Inferred"];
  
  for (const category of categories) {
    // Heurística: procurar por linhas com categoria + números
    const pattern = new RegExp(
      `${category}[^\\d]*(\\d+[,.]?\\d*)\\s*(?:Mt|kt|t)?[^\\d]*(\\d+[,.]?\\d*)\\s*(?:%|g/t)?`,
      "i"
    );
    
    const match = text.match(pattern);
    
    if (match) {
      const tonnage = parseFloat(match[1].replace(",", "."));
      const grade = parseFloat(match[2].replace(",", "."));
      
      estimates.push({
        category,
        tonnage: isNaN(tonnage) ? undefined : tonnage,
        grade: isNaN(grade) ? undefined : grade,
        _uncertain: isNaN(tonnage) || isNaN(grade),
        hint: isNaN(tonnage) || isNaN(grade) 
          ? "Valores numéricos não puderam ser extraídos com confiança" 
          : undefined,
      });
    } else {
      // Não encontrou dados para esta categoria
      estimates.push({
        category,
        _uncertain: true,
        hint: `Dados de ${category} não encontrados no documento`,
      });
    }
  }

  return estimates;
}

/**
 * Extrai pessoas competentes/qualificadas
 */
function extractCompetentPersons(text: string, standard: string): CompetentPerson[] {
  const persons: CompetentPerson[] = [];
  
  // Termos baseados no padrão
  const personTerms = standard.includes("JORC") || standard.includes("SAMREC")
    ? ["Competent Person", "CP"]
    : ["Qualified Person", "QP"];

  for (const term of personTerms) {
    const pattern = new RegExp(
      `${term}[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+)(?:[,\\s]+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*?))?`,
      "gi"
    );
    
    const matches = Array.from(text.matchAll(pattern));
    
    for (const match of matches) {
      persons.push({
        name: match[1]?.trim(),
        qualification: match[2]?.trim(),
        _uncertain: !match[1] || match[1].length < 5,
        hint: !match[1] || match[1].length < 5 
          ? "Nome da pessoa competente não identificado claramente" 
          : undefined,
      });
    }
  }

  // Se não encontrou nenhuma pessoa, adicionar placeholder
  if (persons.length === 0) {
    persons.push({
      _uncertain: true,
      hint: "Informações sobre pessoa competente não encontradas",
    });
  }

  return persons;
}

/**
 * Função principal de parsing
 */
export async function parseAndNormalize(
  fileContent: string,
  fileType: string,
  reportId: string,
  tenantId: string
): Promise<ParsingResult> {
  // Simular extração de texto (em produção, usar bibliotecas específicas)
  const text = fileContent;

  // Detectar padrão
  const { standard, confidence } = detectStandard(text);

  // Extrair componentes
  const sections = extractSections(text, standard);
  const resourceEstimates = extractResourceEstimates(text);
  const competentPersons = extractCompetentPersons(text, standard);
  const economicAssumptions: EconomicAssumption[] = [
    {
      parameter: "Preço do Metal",
      _uncertain: true,
      hint: "Preço não identificado no documento",
    },
  ];

  // Montar normalized
  const normalized: NormalizedReport = {
    metadata: {
      reportId,
      detectedStandard: standard,
      confidence,
      parsedAt: new Date().toISOString(),
      fileType,
    },
    sections,
    resourceEstimates,
    competentPersons,
    economicAssumptions,
    _hasUncertainFields: false,
  };

  // Contar campos incertos
  let uncertainCount = 0;
  let totalFields = 0;

  const countUncertain = (obj: any) => {
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach(countUncertain);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        totalFields++;
        if (obj[key]._uncertain) {
          uncertainCount++;
        }
        countUncertain(obj[key]);
      }
    }
  };

  countUncertain(normalized);

  normalized._hasUncertainFields = uncertainCount > 0;

  const summary = {
    totalFields,
    uncertainFields: uncertainCount,
    detectedStandard: standard,
    confidence,
    warnings: [
      confidence < 0.6 ? "Confiança baixa na detecção do padrão" : null,
      uncertainCount > 5 ? "Muitos campos requerem revisão manual" : null,
    ].filter(Boolean) as string[],
  };

  const status = uncertainCount > 0 ? "needs_review" : "ready_for_audit";

  return {
    normalized,
    summary,
    status,
  };
}

/**
 * Salva normalized.json no S3
 */
export async function saveNormalizedToS3(
  normalized: NormalizedReport,
  tenantId: string,
  reportId: string
): Promise<string> {
  const s3Key = `reports/${reportId}/normalized.json`;
  const content = JSON.stringify(normalized, null, 2);
  
  const result = await storagePut(s3Key, Buffer.from(content), "application/json");
  
  return result.url;
}

/**
 * Carrega normalized.json do S3
 */
export async function loadNormalizedFromS3(
  tenantId: string,
  reportId: string
): Promise<NormalizedReport | null> {
  try {
    const s3Key = `reports/${reportId}/normalized.json`;
    const { url } = await storageGet(s3Key);
    
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    
    const normalized = await response.json();
    return normalized as NormalizedReport;
  } catch (error) {
    console.error("Error loading normalized.json:", error);
    return null;
  }
}

/**
 * Aplica atualizações de revisão humana
 */
export function applyReviewUpdates(
  normalized: NormalizedReport,
  updates: Array<{ path: string; value: any }>
): NormalizedReport {
  const updated = JSON.parse(JSON.stringify(normalized)); // Deep clone

  for (const update of updates) {
    const pathParts = update.path.split(/[\[\]\.]+/).filter(Boolean);
    
    let current: any = updated;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const index = parseInt(part);
      
      if (!isNaN(index)) {
        current = current[index];
      } else {
        current = current[part];
      }
    }
    
    const lastPart = pathParts[pathParts.length - 1];
    const lastIndex = parseInt(lastPart);
    
    if (!isNaN(lastIndex)) {
      current[lastIndex] = update.value;
      // Remover marcação de incerteza
      if (current[lastIndex]._uncertain !== undefined) {
        delete current[lastIndex]._uncertain;
        delete current[lastIndex].hint;
      }
    } else {
      current[lastPart] = update.value;
      // Remover marcação de incerteza do objeto pai
      if (current._uncertain !== undefined) {
        delete current._uncertain;
        delete current.hint;
      }
    }
  }

  // Recount uncertain fields
  let hasUncertain = false;
  const checkUncertain = (obj: any): boolean => {
    for (const key in obj) {
      if (key === "_uncertain" && obj[key] === true) {
        return true;
      }
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          if (checkUncertain(item)) {
            return true;
          }
        }
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        if (checkUncertain(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  hasUncertain = checkUncertain(updated);
  updated._hasUncertainFields = hasUncertain;

  return updated;
}

/**
 * Extrai lista de campos que precisam de revisão
 */
export function extractFieldsToReview(normalized: NormalizedReport): Array<{
  path: string;
  hint: string;
  currentValue: any;
}> {
  const fields: Array<{ path: string; hint: string; currentValue: any }> = [];

  const traverse = (obj: any, path: string = "") => {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (key === "_uncertain" || key === "hint" || key === "_hasUncertainFields") {
        continue;
      }

      if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any, index: number) => {
          traverse(item, `${currentPath}[${index}]`);
        });
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        if (obj[key]._uncertain === true) {
          fields.push({
            path: currentPath,
            hint: obj[key].hint || "Campo requer revisão",
            currentValue: obj[key],
          });
        }
        traverse(obj[key], currentPath);
      }
    }
  };

  traverse(normalized);

  return fields;
}


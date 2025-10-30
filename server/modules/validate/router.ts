import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const router = express.Router();

// Configure multer for file uploads (using memory storage for serverless compatibility)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, XLSX, XLS, and CSV files are allowed.'));
    }
  }
});

// ============================================================================
// VALIDATION RULES BASED ON JORC 2012 AND NI 43-101
// ============================================================================

interface ValidationRule {
  section: string;
  criterion: string;
  keywords: string[];
  required: boolean;
  category: 'critical' | 'high' | 'medium' | 'low';
}

const jorc2012Rules: ValidationRule[] = [
  // Section 1 - Sampling Techniques and Data
  {
    section: 'Section 1',
    criterion: 'Sampling Techniques',
    keywords: ['sampling', 'sample', 'technique', 'method', 'protocol'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Section 1',
    criterion: 'Drilling Techniques',
    keywords: ['drilling', 'drill', 'hole', 'core', 'rc', 'diamond', 'reverse circulation'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Section 1',
    criterion: 'Drill Sample Recovery',
    keywords: ['recovery', 'sample recovery', 'core recovery', 'loss'],
    required: true,
    category: 'high'
  },
  {
    section: 'Section 1',
    criterion: 'Logging',
    keywords: ['logging', 'geological logging', 'geotechnical logging', 'log'],
    required: true,
    category: 'medium'
  },
  {
    section: 'Section 1',
    criterion: 'Sub-sampling Techniques',
    keywords: ['sub-sampling', 'subsampling', 'split', 'duplicate'],
    required: true,
    category: 'high'
  },
  {
    section: 'Section 1',
    criterion: 'Sample Analysis',
    keywords: ['analysis', 'assay', 'analytical', 'laboratory', 'lab'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Section 1',
    criterion: 'Quality Assurance',
    keywords: ['qa', 'qc', 'quality', 'standard', 'blank', 'duplicate', 'crm'],
    required: true,
    category: 'critical'
  },
  
  // Section 2 - Reporting of Exploration Results
  {
    section: 'Section 2',
    criterion: 'Mineral Resource Estimation',
    keywords: ['resource', 'estimation', 'estimate', 'mineral resource', 'tonnage', 'grade'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Section 2',
    criterion: 'Estimation Methodology',
    keywords: ['methodology', 'method', 'kriging', 'inverse distance', 'id2', 'id3', 'ok', 'sk'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Section 2',
    criterion: 'Cut-off Grade',
    keywords: ['cut-off', 'cutoff', 'cut off', 'grade shell', 'economic'],
    required: true,
    category: 'high'
  },
  {
    section: 'Section 2',
    criterion: 'Classification',
    keywords: ['classification', 'measured', 'indicated', 'inferred', 'confidence'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Section 2',
    criterion: 'Audits or Reviews',
    keywords: ['audit', 'review', 'peer review', 'independent', 'verification'],
    required: false,
    category: 'high'
  },
  
  // Section 3 - Estimation and Reporting of Mineral Reserves
  {
    section: 'Section 3',
    criterion: 'Mineral Reserve Estimation',
    keywords: ['reserve', 'ore reserve', 'proven', 'probable', 'modifying factors'],
    required: false,
    category: 'critical'
  },
  {
    section: 'Section 3',
    criterion: 'Mining Factors',
    keywords: ['mining', 'mine', 'extraction', 'dilution', 'recovery', 'mining method'],
    required: false,
    category: 'high'
  },
  {
    section: 'Section 3',
    criterion: 'Metallurgical Factors',
    keywords: ['metallurgical', 'metallurgy', 'processing', 'recovery', 'concentrate'],
    required: false,
    category: 'high'
  },
  {
    section: 'Section 3',
    criterion: 'Environmental',
    keywords: ['environmental', 'environment', 'permit', 'license', 'approval'],
    required: false,
    category: 'medium'
  },
  {
    section: 'Section 3',
    criterion: 'Infrastructure',
    keywords: ['infrastructure', 'access', 'power', 'water', 'transport'],
    required: false,
    category: 'medium'
  },
  {
    section: 'Section 3',
    criterion: 'Costs',
    keywords: ['cost', 'capex', 'opex', 'capital', 'operating'],
    required: false,
    category: 'high'
  },
  {
    section: 'Section 3',
    criterion: 'Market Assessment',
    keywords: ['market', 'price', 'commodity', 'demand', 'contract'],
    required: false,
    category: 'medium'
  }
];

const ni43101Rules: ValidationRule[] = [
  {
    section: 'Item 3',
    criterion: 'Summary',
    keywords: ['summary', 'executive summary', 'overview'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Item 6',
    criterion: 'Property Description',
    keywords: ['property', 'location', 'tenure', 'ownership', 'title'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Item 13',
    criterion: 'Drilling',
    keywords: ['drilling', 'drill', 'hole', 'core', 'rc'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Item 14',
    criterion: 'Sample Preparation',
    keywords: ['sample preparation', 'preparation', 'crushing', 'pulverizing'],
    required: true,
    category: 'high'
  },
  {
    section: 'Item 15',
    criterion: 'Data Verification',
    keywords: ['verification', 'validate', 'check', 'confirm'],
    required: true,
    category: 'high'
  },
  {
    section: 'Item 18',
    criterion: 'Mineral Resource Estimates',
    keywords: ['resource', 'estimate', 'mineral resource', 'tonnage', 'grade'],
    required: true,
    category: 'critical'
  },
  {
    section: 'Item 19',
    criterion: 'Mineral Reserve Estimates',
    keywords: ['reserve', 'ore reserve', 'proven', 'probable'],
    required: false,
    category: 'critical'
  }
];

// ============================================================================
// DOCUMENT PARSING FUNCTIONS
// ============================================================================

async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseExcel(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let text = '';
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    text += `\n\n=== ${sheetName} ===\n${csvContent}`;
  });
  
  return text;
}

async function parseCSV(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

interface ValidationResult {
  section: string;
  criterion: string;
  found: boolean;
  matchedKeywords: string[];
  required: boolean;
  category: string;
  score: number;
}

function validateDocument(content: string, rules: ValidationRule[]): ValidationResult[] {
  const contentLower = content.toLowerCase();
  
  return rules.map(rule => {
    const matchedKeywords = rule.keywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    
    const found = matchedKeywords.length > 0;
    const score = found ? (matchedKeywords.length / rule.keywords.length) * 100 : 0;
    
    return {
      section: rule.section,
      criterion: rule.criterion,
      found,
      matchedKeywords,
      required: rule.required,
      category: rule.category,
      score: Math.round(score)
    };
  });
}

function calculateComplianceScore(results: ValidationResult[]): number {
  const requiredResults = results.filter(r => r.required);
  const foundRequired = requiredResults.filter(r => r.found).length;
  
  if (requiredResults.length === 0) return 0;
  
  return Math.round((foundRequired / requiredResults.length) * 100);
}

function generateRecommendations(results: ValidationResult[]): string[] {
  const recommendations: string[] = [];
  
  const missingCritical = results.filter(r => 
    r.category === 'critical' && r.required && !r.found
  );
  
  const missingHigh = results.filter(r => 
    r.category === 'high' && r.required && !r.found
  );
  
  if (missingCritical.length > 0) {
    recommendations.push(
      `⚠️ CRÍTICO: ${missingCritical.length} critérios críticos ausentes: ${
        missingCritical.map(r => r.criterion).join(', ')
      }`
    );
  }
  
  if (missingHigh.length > 0) {
    recommendations.push(
      `⚠️ ALTO: ${missingHigh.length} critérios de alta prioridade ausentes: ${
        missingHigh.map(r => r.criterion).join(', ')
      }`
    );
  }
  
  const weakCoverage = results.filter(r => r.found && r.score < 50);
  if (weakCoverage.length > 0) {
    recommendations.push(
      `📋 Cobertura fraca detectada em: ${
        weakCoverage.map(r => r.criterion).join(', ')
      }. Considere adicionar mais detalhes.`
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Documento apresenta boa conformidade com os padrões.');
  }
  
  return recommendations;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// POST /api/validate/upload
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a PDF, XLSX, XLS, or CSV file'
      });
    }

    const { standard = 'jorc' } = req.body;
    
    // Validate standard
    const validStandards = ['jorc', 'ni43101'];
    if (!validStandards.includes(standard)) {
      return res.status(400).json({
        error: 'Invalid standard',
        message: `Standard must be one of: ${validStandards.join(', ')}`
      });
    }

    // Parse document based on file type
    let content: string;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    try {
      if (ext === '.pdf') {
        content = await parsePDF(req.file.buffer);
      } else if (ext === '.xlsx' || ext === '.xls') {
        content = await parseExcel(req.file.buffer);
      } else if (ext === '.csv') {
        content = await parseCSV(req.file.buffer);
      } else {
        return res.status(400).json({
          error: 'Unsupported file type',
          message: 'Only PDF, XLSX, XLS, and CSV files are supported'
        });
      }
    } catch (parseError) {
      console.error('Error parsing document:', parseError);
      return res.status(500).json({
        error: 'Document parsing failed',
        message: 'Failed to extract text from document',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      });
    }

    // Detect document type
    const documentType = detectDocumentType(content);
    
    // Check if document is a technical mining report
    if (documentType.type !== 'technical_report') {
      const errorMessages: Record<string, { title: string; message: string; suggestion: string }> = {
        'api_documentation': {
          title: 'Documento não suportado',
          message: 'Este documento parece ser uma documentação de API, não um relatório técnico de mineração.',
          suggestion: 'O módulo de Auditoria & KRCI está preparado para validar apenas relatórios técnicos de mineração (JORC, NI 43-101, PERC, SAMREC). Por favor, faça upload de um relatório técnico de mineração.'
        },
        'general': {
          title: 'Documento não identificado',
          message: 'Este documento não foi identificado como um relatório técnico de mineração.',
          suggestion: 'O módulo de Auditoria & KRCI valida relatórios técnicos de mineração conforme padrões internacionais (JORC, NI 43-101, PERC, SAMREC). Verifique se o documento contém seções típicas como: Geologia, Amostragem, Estimativa de Recursos, Pessoa Competente, etc.'
        },
        'unknown': {
          title: 'Conteúdo insuficiente',
          message: 'Não foi possível identificar o tipo de documento. O conteúdo pode estar vazio ou corrompido.',
          suggestion: 'Verifique se o arquivo está correto e contém texto legível. Tente fazer upload novamente ou use um arquivo diferente.'
        }
      };
      
      const errorInfo = errorMessages[documentType.type] || errorMessages['unknown'];
      
      return res.status(400).json({
        error: errorInfo.title,
        message: errorInfo.message,
        suggestion: errorInfo.suggestion,
        documentType: {
          detected: documentType.type,
          confidence: documentType.confidence,
          reason: documentType.reason
        },
        acceptedTypes: [
          'Relatórios JORC (2012)',
          'Relatórios NI 43-101',
          'Relatórios PERC',
          'Relatórios SAMREC',
          'Relatórios CRIRSCO'
        ]
      });
    }

// Helper function to detect document type
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

    // Select validation rules
    const rules = standard === 'jorc' ? jorc2012Rules : ni43101Rules;
    
    // Validate document
    const validationResults = validateDocument(content, rules);
    const complianceScore = calculateComplianceScore(validationResults);
    const recommendations = generateRecommendations(validationResults);
    
    // Calculate statistics
    const stats = {
      total: validationResults.length,
      found: validationResults.filter(r => r.found).length,
      missing: validationResults.filter(r => !r.found).length,
      required: validationResults.filter(r => r.required).length,
      requiredFound: validationResults.filter(r => r.required && r.found).length,
      requiredMissing: validationResults.filter(r => r.required && !r.found).length,
      critical: validationResults.filter(r => r.category === 'critical').length,
      criticalFound: validationResults.filter(r => r.category === 'critical' && r.found).length,
      criticalMissing: validationResults.filter(r => r.category === 'critical' && !r.found).length
    };
    
    // No cleanup needed - using memory storage
    
    // Return validation report
    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      },
      standard: standard.toUpperCase(),
      compliance: {
        score: complianceScore,
        level: complianceScore >= 90 ? 'Excellent' : 
               complianceScore >= 70 ? 'Good' : 
               complianceScore >= 50 ? 'Fair' : 'Poor'
      },
      statistics: stats,
      results: validationResults,
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    
    // No cleanup needed - using memory storage
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/validate/standards - List available validation standards
router.get('/standards', (req, res) => {
  try {
    res.json({
      standards: [
        {
          code: 'jorc',
          name: 'JORC 2012',
          description: 'Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves',
          sections: 3,
          criteria: jorc2012Rules.length
        },
        {
          code: 'ni43101',
          name: 'NI 43-101',
          description: 'Canadian Standards of Disclosure for Mineral Projects',
          sections: 27,
          criteria: ni43101Rules.length
        }
      ]
    });
  } catch (error) {
    console.error('Error listing standards:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list standards'
    });
  }
});

export default router;


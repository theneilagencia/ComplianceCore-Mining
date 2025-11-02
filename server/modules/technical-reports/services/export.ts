/**
 * Export Service
 * Handles report export to different standards and formats
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow } from 'docx';
import * as XLSX from 'xlsx';
import Handlebars from 'handlebars';
import { storagePut } from '../../../storage';
import * as jorcMapper from './mappers/jorc';
import * as ni43Mapper from './mappers/ni43';
import * as percMapper from './mappers/perc';
import * as samrecMapper from './mappers/samrec';
import * as cbrrMapper from './mappers/cbrr';

const SUPPORTED_STANDARDS = ["JORC_2012", "NI_43_101", "PERC", "SAMREC", "CBRR"] as const;
const SUPPORTED_FORMATS = ["PDF", "DOCX", "XLSX"] as const;

type Standard = typeof SUPPORTED_STANDARDS[number];
type Format = typeof SUPPORTED_FORMATS[number];

interface NormalizedData {
  metadata?: any;
  sections?: any[];
  resource_estimates?: any[];
  competent_persons?: any[];
  economic_assumptions?: any;
  qa_qc?: string;
  geology?: string;
  brand?: {
    logo_s3?: string;
    company_display?: string;
  };
}

function pickMapper(toStandard: Standard) {
  const mappers = {
    JORC_2012: jorcMapper.toStandard,
    NI_43_101: ni43Mapper.toStandard,
    PERC: percMapper.toStandard,
    SAMREC: samrecMapper.toStandard,
    CBRR: cbrrMapper.toStandard,
  };
  return mappers[toStandard];
}

async function renderPDF(payload: any, toStandard: Standard): Promise<Buffer> {
  // Read HTML template based on standard
  const templateName = toStandard === 'CBRR' ? 'cbrr.html' : 'jorc_2012.html';
  const templatePath = path.join(__dirname, '../templates', templateName);
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  
  // Compile with Handlebars
  const template = Handlebars.compile(templateContent);
  
  // Add generated_at timestamp
  payload.generated_at = new Date().toLocaleString('pt-BR');
  
  const html = template(payload);

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true,
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}

async function renderDOCX(payload: any, toStandard: Standard): Promise<Buffer> {
  // Import our professional DOCX renderer
  const { renderDOCX: professionalRender } = await import('./docx-renderer');
  
  // Transform payload to match expected interface
  const reportPayload = {
    title: payload.project_name || 'Relatório Técnico',
    projectName: payload.project_name,
    location: payload.location,
    standard: toStandard,
    date: payload.effective_date || new Date().toLocaleDateString('pt-BR'),
    competentPerson: payload.competent_persons?.[0] ? {
      name: payload.competent_persons[0].name,
      credentials: payload.competent_persons[0].qualification,
      organization: payload.competent_persons[0].organization,
    } : undefined,
    executiveSummary: payload.executive_summary ? {
      overview: payload.executive_summary.overview || '',
      keyFindings: payload.executive_summary.key_findings || [],
    } : undefined,
    introduction: payload.introduction,
    locationAccess: payload.location_access,
    geology: payload.geology_data,
    resources: payload.resources_table?.map((r: any) => ({
      category: r.category,
      tonnage: r.tonnage,
      grade: r.grades?.Au || r.grades?.main || 0,
      contained: r.contained || 0,
    })),
    reserves: payload.reserves_table?.map((r: any) => ({
      category: r.category,
      tonnage: r.tonnage,
      grade: r.grades?.Au || r.grades?.main || 0,
      recoverable: r.recoverable || 0,
    })),
    methodology: payload.methodology,
    economics: payload.economic_assumptions,
    conclusions: payload.conclusions,
  };

  return await professionalRender(reportPayload, toStandard);
}

async function renderXLSX(payload: any, toStandard: Standard): Promise<Buffer> {
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Metadata
  const metadataData = [
    ['Padrão', payload.standard],
    ['Projeto', payload.project_name],
    ['Empresa', payload.company],
    ['Data Efetiva', payload.effective_date],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(metadataData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Metadata');

  // Sheet 2: Resources
  const resourcesData = [
    ['Categoria', 'Tonnage', 'Grades', 'Cutoff'],
    ...payload.resources_table.map((r: any) => [
      r.category,
      r.tonnage,
      JSON.stringify(r.grades),
      JSON.stringify(r.cutoff),
    ]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(resourcesData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Resources');

  // Sheet 3: Competent Persons
  const cpData = [
    ['Nome', 'Qualificação', 'Organização'],
    ...payload.competent_persons.map((cp: any) => [
      cp.name,
      cp.qualification,
      cp.organization,
    ]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(cpData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Competent Persons');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

export async function exportReport(
  tenantId: string,
  reportId: string,
  normalized: NormalizedData,
  toStandard: Standard,
  format: Format
): Promise<string> {
  if (!SUPPORTED_STANDARDS.includes(toStandard)) {
    throw new Error(`Unsupported standard: ${toStandard}`);
  }
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  // 1) Map data to target standard
  const mapper = pickMapper(toStandard);
  const payload = mapper(normalized);

  // 2) Render file based on format
  let buffer: Buffer;
  let contentType: string;
  let extension: string;

  if (format === 'PDF') {
    buffer = await renderPDF(payload, toStandard);
    contentType = 'application/pdf';
    extension = 'pdf';
  } else if (format === 'DOCX') {
    buffer = await renderDOCX(payload, toStandard);
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    extension = 'docx';
  } else if (format === 'XLSX') {
    buffer = await renderXLSX(payload, toStandard);
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    extension = 'xlsx';
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  // 3) Upload to S3
  const s3Key = `reports/${reportId}/exports/${toStandard}/report.${extension}`;
  const result = await storagePut(s3Key, buffer, contentType);

  return result.url;
}

export { SUPPORTED_STANDARDS, SUPPORTED_FORMATS };
export type { Standard, Format };


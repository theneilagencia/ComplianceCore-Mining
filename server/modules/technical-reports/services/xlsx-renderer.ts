/**
 * XLSX Renderer Service
 * 
 * Gera planilhas Excel (.xlsx) a partir de relatórios normalizados.
 * Usa a biblioteca 'exceljs' para criar planilhas estruturadas e profissionais.
 */

import ExcelJS from 'exceljs';

export type Standard = 'JORC_2012' | 'NI_43_101' | 'PERC' | 'SAMREC' | 'CBRR';

interface ReportPayload {
  title: string;
  projectName?: string;
  location?: string;
  standard: Standard;
  date?: string;
  competentPerson?: {
    name: string;
    credentials: string;
    organization: string;
  };
  executiveSummary?: {
    overview: string;
    keyFindings: string[];
  };
  introduction?: {
    background: string;
    objectives: string;
  };
  locationAccess?: {
    coordinates: string;
    accessibility: string;
  };
  geology?: {
    regional: string;
    local: string;
    mineralization: string;
  };
  resources?: Array<{
    category: string;
    tonnage: number;
    grade: number;
    contained: number;
  }>;
  reserves?: Array<{
    category: string;
    tonnage: number;
    grade: number;
    recoverable: number;
  }>;
  methodology?: {
    sampling: string;
    estimation: string;
    qaqc: string;
  };
  economics?: {
    assumptions: string;
    sensitivity: string;
  };
  conclusions?: {
    summary: string;
    recommendations: string[];
  };
}

/**
 * Renderiza um relatório em formato XLSX
 */
export async function renderXLSX(payload: ReportPayload, standard: Standard): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Metadata do workbook
  workbook.creator = 'QIVO Mining Platform';
  workbook.lastModifiedBy = 'QIVO Mining Platform';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  // ========================================
  // SHEET 1: SUMÁRIO EXECUTIVO
  // ========================================
  const summarySheet = workbook.addWorksheet('Sumário Executivo', {
    views: [{ showGridLines: true }],
  });

  // Header styling
  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF2F2C79' } },
    alignment: { vertical: 'middle' as const, horizontal: 'left' as const },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  };

  const dataStyle = {
    alignment: { vertical: 'middle' as const, horizontal: 'left' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    },
  };

  // Column widths
  summarySheet.columns = [
    { width: 25 },
    { width: 60 },
  ];

  // Title
  summarySheet.mergeCells('A1:B1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = payload.title || 'Relatório Técnico';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF2F2C79' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 30;

  // Empty row
  summarySheet.addRow([]);

  // Metadata
  const addMetadataRow = (label: string, value: string) => {
    const row = summarySheet.addRow([label, value]);
    row.getCell(1).style = headerStyle;
    row.getCell(2).style = dataStyle;
    row.height = 25;
  };

  addMetadataRow('Standard', getStandardFullName(standard));
  if (payload.projectName) addMetadataRow('Projeto', payload.projectName);
  if (payload.location) addMetadataRow('Localização', payload.location);
  addMetadataRow('Data', payload.date || new Date().toLocaleDateString('pt-BR'));

  // Empty row
  summarySheet.addRow([]);

  // Competent Person
  if (payload.competentPerson) {
    summarySheet.mergeCells(`A${summarySheet.rowCount + 1}:B${summarySheet.rowCount + 1}`);
    const cpHeaderCell = summarySheet.getCell(`A${summarySheet.rowCount}`);
    cpHeaderCell.value = 'Competent Person';
    cpHeaderCell.font = { bold: true, size: 12, color: { argb: 'FF2F2C79' } };
    summarySheet.getRow(summarySheet.rowCount).height = 25;

    addMetadataRow('Nome', payload.competentPerson.name);
    addMetadataRow('Credenciais', payload.competentPerson.credentials);
    addMetadataRow('Organização', payload.competentPerson.organization);

    summarySheet.addRow([]);
  }

  // Executive Summary
  if (payload.executiveSummary?.overview) {
    summarySheet.mergeCells(`A${summarySheet.rowCount + 1}:B${summarySheet.rowCount + 1}`);
    const esHeaderCell = summarySheet.getCell(`A${summarySheet.rowCount}`);
    esHeaderCell.value = 'Sumário Executivo';
    esHeaderCell.font = { bold: true, size: 12, color: { argb: 'FF2F2C79' } };
    summarySheet.getRow(summarySheet.rowCount).height = 25;

    summarySheet.mergeCells(`A${summarySheet.rowCount + 1}:B${summarySheet.rowCount + 1}`);
    const overviewCell = summarySheet.getCell(`A${summarySheet.rowCount}`);
    overviewCell.value = payload.executiveSummary.overview;
    overviewCell.style = { ...dataStyle, alignment: { ...dataStyle.alignment, wrapText: true } };
    summarySheet.getRow(summarySheet.rowCount).height = 60;
  }

  // ========================================
  // SHEET 2: RECURSOS MINERAIS
  // ========================================
  if (payload.resources && payload.resources.length > 0) {
    const resourcesSheet = workbook.addWorksheet('Recursos Minerais', {
      views: [{ showGridLines: true }],
    });

    resourcesSheet.columns = [
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Tonnage (Mt)', key: 'tonnage', width: 18 },
      { header: 'Grade (%)', key: 'grade', width: 15 },
      { header: 'Contained (kt)', key: 'contained', width: 18 },
    ];

    // Style header row
    const headerRow = resourcesSheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });
    headerRow.height = 25;

    // Add data rows
    payload.resources.forEach((resource) => {
      const row = resourcesSheet.addRow({
        category: resource.category,
        tonnage: resource.tonnage,
        grade: resource.grade,
        contained: resource.contained,
      });

      row.eachCell((cell, colNumber) => {
        cell.style = dataStyle;
        // Number formatting for numeric columns
        if (colNumber >= 2) {
          cell.numFmt = '#,##0.00';
        }
      });
      row.height = 20;
    });

    // Add total row
    const totalRow = resourcesSheet.addRow({
      category: 'TOTAL',
      tonnage: { formula: `SUM(B2:B${resourcesSheet.rowCount})` },
      grade: { formula: `AVERAGE(C2:C${resourcesSheet.rowCount})` },
      contained: { formula: `SUM(D2:D${resourcesSheet.rowCount})` },
    });

    totalRow.eachCell((cell, colNumber) => {
      cell.style = {
        ...headerStyle,
        alignment: { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'right' },
      };
      if (colNumber >= 2) {
        cell.numFmt = '#,##0.00';
      }
    });
    totalRow.height = 25;
  }

  // ========================================
  // SHEET 3: RESERVAS MINERAIS
  // ========================================
  if (payload.reserves && payload.reserves.length > 0) {
    const reservesSheet = workbook.addWorksheet('Reservas Minerais', {
      views: [{ showGridLines: true }],
    });

    reservesSheet.columns = [
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Tonnage (Mt)', key: 'tonnage', width: 18 },
      { header: 'Grade (%)', key: 'grade', width: 15 },
      { header: 'Recoverable (kt)', key: 'recoverable', width: 18 },
    ];

    // Style header row
    const headerRow = reservesSheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });
    headerRow.height = 25;

    // Add data rows
    payload.reserves.forEach((reserve) => {
      const row = reservesSheet.addRow({
        category: reserve.category,
        tonnage: reserve.tonnage,
        grade: reserve.grade,
        recoverable: reserve.recoverable,
      });

      row.eachCell((cell, colNumber) => {
        cell.style = dataStyle;
        if (colNumber >= 2) {
          cell.numFmt = '#,##0.00';
        }
      });
      row.height = 20;
    });

    // Add total row
    const totalRow = reservesSheet.addRow({
      category: 'TOTAL',
      tonnage: { formula: `SUM(B2:B${reservesSheet.rowCount})` },
      grade: { formula: `AVERAGE(C2:C${reservesSheet.rowCount})` },
      recoverable: { formula: `SUM(D2:D${reservesSheet.rowCount})` },
    });

    totalRow.eachCell((cell, colNumber) => {
      cell.style = {
        ...headerStyle,
        alignment: { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'right' },
      };
      if (colNumber >= 2) {
        cell.numFmt = '#,##0.00';
      }
    });
    totalRow.height = 25;
  }

  // ========================================
  // SHEET 4: GEOLOGIA
  // ========================================
  if (payload.geology) {
    const geologySheet = workbook.addWorksheet('Geologia', {
      views: [{ showGridLines: true }],
    });

    geologySheet.columns = [
      { width: 25 },
      { width: 80 },
    ];

    const addGeologySection = (title: string, content: string) => {
      const row = geologySheet.addRow([title, content]);
      row.getCell(1).style = headerStyle;
      row.getCell(2).style = { ...dataStyle, alignment: { ...dataStyle.alignment, wrapText: true } };
      row.height = Math.max(60, Math.ceil(content.length / 80) * 15);
    };

    if (payload.geology.regional) {
      addGeologySection('Geologia Regional', payload.geology.regional);
    }
    if (payload.geology.local) {
      addGeologySection('Geologia Local', payload.geology.local);
    }
    if (payload.geology.mineralization) {
      addGeologySection('Mineralização', payload.geology.mineralization);
    }
  }

  // ========================================
  // SHEET 5: METODOLOGIA
  // ========================================
  if (payload.methodology) {
    const methodSheet = workbook.addWorksheet('Metodologia', {
      views: [{ showGridLines: true }],
    });

    methodSheet.columns = [
      { width: 25 },
      { width: 80 },
    ];

    const addMethodSection = (title: string, content: string) => {
      const row = methodSheet.addRow([title, content]);
      row.getCell(1).style = headerStyle;
      row.getCell(2).style = { ...dataStyle, alignment: { ...dataStyle.alignment, wrapText: true } };
      row.height = Math.max(60, Math.ceil(content.length / 80) * 15);
    };

    if (payload.methodology.sampling) {
      addMethodSection('Amostragem', payload.methodology.sampling);
    }
    if (payload.methodology.estimation) {
      addMethodSection('Estimação de Recursos', payload.methodology.estimation);
    }
    if (payload.methodology.qaqc) {
      addMethodSection('QA/QC', payload.methodology.qaqc);
    }
  }

  // ========================================
  // SHEET 6: PREMISSAS ECONÔMICAS
  // ========================================
  if (payload.economics) {
    const economicsSheet = workbook.addWorksheet('Premissas Econômicas', {
      views: [{ showGridLines: true }],
    });

    economicsSheet.columns = [
      { width: 30 },
      { width: 75 },
    ];

    const addEconomicsSection = (title: string, content: string) => {
      const row = economicsSheet.addRow([title, content]);
      row.getCell(1).style = headerStyle;
      row.getCell(2).style = { ...dataStyle, alignment: { ...dataStyle.alignment, wrapText: true } };
      row.height = Math.max(60, Math.ceil(content.length / 75) * 15);
    };

    if (payload.economics.assumptions) {
      addEconomicsSection('Premissas', payload.economics.assumptions);
    }
    if (payload.economics.sensitivity) {
      addEconomicsSection('Análise de Sensibilidade', payload.economics.sensitivity);
    }
  }

  // ========================================
  // SHEET 7: CONCLUSÕES
  // ========================================
  if (payload.conclusions) {
    const conclusionsSheet = workbook.addWorksheet('Conclusões', {
      views: [{ showGridLines: true }],
    });

    conclusionsSheet.columns = [
      { width: 100 },
    ];

    if (payload.conclusions.summary) {
      const summaryRow = conclusionsSheet.addRow([payload.conclusions.summary]);
      summaryRow.getCell(1).style = {
        ...dataStyle,
        alignment: { ...dataStyle.alignment, wrapText: true },
      };
      summaryRow.height = Math.max(60, Math.ceil(payload.conclusions.summary.length / 100) * 15);

      conclusionsSheet.addRow([]);
    }

    if (payload.conclusions.recommendations && payload.conclusions.recommendations.length > 0) {
      const recHeaderRow = conclusionsSheet.addRow(['Recomendações']);
      recHeaderRow.getCell(1).style = {
        font: { bold: true, size: 12, color: { argb: 'FF2F2C79' } },
      };

      payload.conclusions.recommendations.forEach((rec, idx) => {
        const recRow = conclusionsSheet.addRow([`${idx + 1}. ${rec}`]);
        recRow.getCell(1).style = {
          ...dataStyle,
          alignment: { ...dataStyle.alignment, wrapText: true },
        };
        recRow.height = Math.max(30, Math.ceil(rec.length / 100) * 15);
      });
    }
  }

  // Converter para Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Retorna o nome completo do standard
 */
function getStandardFullName(standard: Standard): string {
  const names: Record<Standard, string> = {
    JORC_2012: 'JORC Code 2012 Edition',
    NI_43_101: 'NI 43-101 Standards of Disclosure',
    PERC: 'Pan-European Reserves and Resources Reporting Committee',
    SAMREC: 'South African Mineral Resource Committee',
    CBRR: 'Código Brasileiro de Recursos e Reservas Minerais',
  };

  return names[standard] || standard;
}

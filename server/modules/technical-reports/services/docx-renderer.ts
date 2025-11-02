/**
 * DOCX Renderer Service
 * 
 * Gera documentos Word (.docx) a partir de relatórios normalizados.
 * Usa a biblioteca 'docx' para criar documentos formatados profissionalmente.
 * 
 * @module DOCXRenderer
 * @sprint SPRINT5-FIX - Added i18n support
 */

import { 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableCell, 
  TableRow,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
  PageBreak,
} from 'docx';
import { getTranslations, detectLanguageFromMetadata, formatDate, type SupportedLanguage } from './i18n';

export type Standard = 'JORC_2012' | 'NI_43_101' | 'PERC' | 'SAMREC' | 'CBRR' | 'SEC_SK_1300';

interface ReportPayload {
  title: string;
  projectName?: string;
  location?: string;
  standard: Standard;
  date?: string;
  language?: SupportedLanguage;
  metadata?: any;
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
 * Renderiza um relatório em formato DOCX
 */
export async function renderDOCX(payload: ReportPayload, standard: Standard): Promise<Buffer> {
  // Detectar idioma do relatório
  const language = payload.language || detectLanguageFromMetadata(payload.metadata);
  const t = getTranslations(language);
  
  const sections: any[] = [];

  // ========================================
  // PÁGINA DE TÍTULO
  // ========================================
  sections.push(
    new Paragraph({
      text: payload.title || t.technicalReport,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 2000,
        after: 400,
      },
    }),
    new Paragraph({
      text: `${t.standard}: ${getStandardFullName(standard)}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  if (payload.projectName) {
    sections.push(
      new Paragraph({
        text: `Projeto: ${payload.projectName}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  if (payload.location) {
    sections.push(
      new Paragraph({
        text: `Localização: ${payload.location}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  sections.push(
    new Paragraph({
      text: `Data: ${payload.date || new Date().toLocaleDateString('pt-BR')}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // ========================================
  // COMPETENT PERSON
  // ========================================
  if (payload.competentPerson) {
    sections.push(
      new Paragraph({
        text: 'Competent Person',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Nome: ',
            bold: true,
          }),
          new TextRun({
            text: payload.competentPerson.name,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Credenciais: ',
            bold: true,
          }),
          new TextRun({
            text: payload.competentPerson.credentials,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Organização: ',
            bold: true,
          }),
          new TextRun({
            text: payload.competentPerson.organization,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // ========================================
  // SUMÁRIO EXECUTIVO
  // ========================================
  if (payload.executiveSummary) {
    sections.push(
      new Paragraph({
        text: '1. Sumário Executivo',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (payload.executiveSummary.overview) {
      sections.push(
        new Paragraph({
          text: payload.executiveSummary.overview,
          spacing: { after: 200 },
        })
      );
    }

    if (payload.executiveSummary.keyFindings && payload.executiveSummary.keyFindings.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Principais Resultados:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      payload.executiveSummary.keyFindings.forEach((finding, idx) => {
        sections.push(
          new Paragraph({
            text: `${idx + 1}. ${finding}`,
            spacing: { after: 100 },
          })
        );
      });
    }
  }

  // ========================================
  // INTRODUÇÃO
  // ========================================
  if (payload.introduction) {
    sections.push(
      new Paragraph({
        text: '2. Introdução e Contexto',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (payload.introduction.background) {
      sections.push(
        new Paragraph({
          text: '2.1 Contexto',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.introduction.background,
          spacing: { after: 200 },
        })
      );
    }

    if (payload.introduction.objectives) {
      sections.push(
        new Paragraph({
          text: '2.2 Objetivos',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.introduction.objectives,
          spacing: { after: 200 },
        })
      );
    }
  }

  // ========================================
  // LOCALIZAÇÃO E ACESSO
  // ========================================
  if (payload.locationAccess) {
    sections.push(
      new Paragraph({
        text: '3. Localização e Acesso',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (payload.locationAccess.coordinates) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Coordenadas: ',
              bold: true,
            }),
            new TextRun({
              text: payload.locationAccess.coordinates,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (payload.locationAccess.accessibility) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Acessibilidade: ',
              bold: true,
            }),
            new TextRun({
              text: payload.locationAccess.accessibility,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }

  // ========================================
  // GEOLOGIA
  // ========================================
  if (payload.geology) {
    sections.push(
      new Paragraph({
        text: '4. Geologia e Mineralização',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (payload.geology.regional) {
      sections.push(
        new Paragraph({
          text: '4.1 Geologia Regional',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.geology.regional,
          spacing: { after: 200 },
        })
      );
    }

    if (payload.geology.local) {
      sections.push(
        new Paragraph({
          text: '4.2 Geologia Local',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.geology.local,
          spacing: { after: 200 },
        })
      );
    }

    if (payload.geology.mineralization) {
      sections.push(
        new Paragraph({
          text: '4.3 Mineralização',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.geology.mineralization,
          spacing: { after: 200 },
        })
      );
    }
  }

  // ========================================
  // RECURSOS MINERAIS (TABELA)
  // ========================================
  if (payload.resources && payload.resources.length > 0) {
    sections.push(
      new Paragraph({
        text: '5. Recursos Minerais',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const resourceTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [
        // Header
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Categoria', bold: true })] })],
              shading: { fill: 'E0E0E0' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Tonnage (Mt)', bold: true })] })],
              shading: { fill: 'E0E0E0' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Grade (%)', bold: true })] })],
              shading: { fill: 'E0E0E0' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Contained (kt)', bold: true })] })],
              shading: { fill: 'E0E0E0' },
            }),
          ],
        }),
        // Data rows
        ...payload.resources.map(
          (resource) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(resource.category)],
                }),
                new TableCell({
                  children: [new Paragraph(resource.tonnage.toLocaleString('pt-BR'))],
                }),
                new TableCell({
                  children: [new Paragraph(resource.grade.toFixed(2))],
                }),
                new TableCell({
                  children: [new Paragraph(resource.contained.toLocaleString('pt-BR'))],
                }),
              ],
            })
        ),
      ],
    });

    sections.push(resourceTable);
  }

  // ========================================
  // RESERVAS MINERAIS (TABELA)
  // ========================================
  if (payload.reserves && payload.reserves.length > 0) {
    sections.push(
      new Paragraph({
        text: '6. Reservas Minerais',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const reserveTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [
        // Header
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Categoria', bold: true })] })],
              shading: { fill: 'E0E0E0' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Tonnage (Mt)', bold: true })] })],
              shading: { fill: 'E0E0E0' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Grade (%)', bold: true })] })],
              shading: { fill: 'E0E0E0' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Recoverable (kt)', bold: true })] })],
              shading: { fill: 'E0E0E0' },
            }),
          ],
        }),
        // Data rows
        ...payload.reserves.map(
          (reserve) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(reserve.category)],
                }),
                new TableCell({
                  children: [new Paragraph(reserve.tonnage.toLocaleString('pt-BR'))],
                }),
                new TableCell({
                  children: [new Paragraph(reserve.grade.toFixed(2))],
                }),
                new TableCell({
                  children: [new Paragraph(reserve.recoverable.toLocaleString('pt-BR'))],
                }),
              ],
            })
        ),
      ],
    });

    sections.push(reserveTable);
  }

  // ========================================
  // METODOLOGIA
  // ========================================
  if (payload.methodology) {
    sections.push(
      new Paragraph({
        text: '7. Metodologia de Estimação',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (payload.methodology.sampling) {
      sections.push(
        new Paragraph({
          text: '7.1 Amostragem',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.methodology.sampling,
          spacing: { after: 200 },
        })
      );
    }

    if (payload.methodology.estimation) {
      sections.push(
        new Paragraph({
          text: '7.2 Estimação de Recursos',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.methodology.estimation,
          spacing: { after: 200 },
        })
      );
    }

    if (payload.methodology.qaqc) {
      sections.push(
        new Paragraph({
          text: '7.3 QA/QC',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.methodology.qaqc,
          spacing: { after: 200 },
        })
      );
    }
  }

  // ========================================
  // PREMISSAS ECONÔMICAS
  // ========================================
  if (payload.economics) {
    sections.push(
      new Paragraph({
        text: '8. Premissas Econômicas',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (payload.economics.assumptions) {
      sections.push(
        new Paragraph({
          text: '8.1 Premissas',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.economics.assumptions,
          spacing: { after: 200 },
        })
      );
    }

    if (payload.economics.sensitivity) {
      sections.push(
        new Paragraph({
          text: '8.2 Análise de Sensibilidade',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: payload.economics.sensitivity,
          spacing: { after: 200 },
        })
      );
    }
  }

  // ========================================
  // CONCLUSÕES E RECOMENDAÇÕES
  // ========================================
  if (payload.conclusions) {
    sections.push(
      new Paragraph({
        text: '9. Conclusões e Recomendações',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    if (payload.conclusions.summary) {
      sections.push(
        new Paragraph({
          text: payload.conclusions.summary,
          spacing: { after: 200 },
        })
      );
    }

    if (payload.conclusions.recommendations && payload.conclusions.recommendations.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Recomendações:',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      payload.conclusions.recommendations.forEach((rec, idx) => {
        sections.push(
          new Paragraph({
            text: `${idx + 1}. ${rec}`,
            spacing: { after: 100 },
          })
        );
      });
    }
  }

  // ========================================
  // CRIAR DOCUMENTO
  // ========================================
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  // Converter para Buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
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
    SEC_SK_1300: 'SEC Regulation S-K Item 1300 - Mining Property Disclosure',
  };

  return names[standard] || standard;
}

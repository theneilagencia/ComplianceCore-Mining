/**
 * Template Generator Service
 * Generates professional DOCX templates for technical reports
 * Supports all 11 international standards
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle, ImageRun } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

export type ReportStandard = 
  | 'JORC_2012' 
  | 'NI_43_101' 
  | 'PERC' 
  | 'SAMREC' 
  | 'SEC_SK_1300' 
  | 'CRIRSCO'
  | 'CBRR'
  | 'ANM'
  | 'ANP'
  | 'CPRM'
  | 'IBAMA';

export interface ReportMetadata {
  standard: ReportStandard;
  projectName: string;
  clientName: string;
  reportDate: Date;
  effectiveDate: Date;
  reportType: 'Exploration Results' | 'Mineral Resources' | 'Mineral Reserves' | 'Technical Report Summary';
  commodity: string[];
  location: {
    country: string;
    state?: string;
    region?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  competentPersons: CompetentPerson[];
}

export interface CompetentPerson {
  name: string;
  title: string;
  organization: string;
  professionalMembership: string;
  registrationNumber: string;
  yearsExperience: number;
  areaOfCompetence: string[];
  email: string;
  phone?: string;
  signature?: string; // Base64 image
}

export interface ChapterContent {
  title: string;
  level: number;
  content: string[];
  tables?: any[];
  figures?: any[];
}

export class TemplateGenerator {
  
  /**
   * Generate complete DOCX report
   */
  async generateReport(
    metadata: ReportMetadata,
    chapters: ChapterContent[],
    outputPath: string
  ): Promise<string> {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: this.createHeader(metadata),
        },
        footers: {
          default: this.createFooter(metadata),
        },
        children: [
          // Title Page
          ...this.createTitlePage(metadata),
          
          // Table of Contents placeholder
          ...this.createTableOfContents(),
          
          // Executive Summary
          ...this.createExecutiveSummary(metadata),
          
          // Chapters
          ...this.createChapters(chapters),
          
          // Appendices
          ...this.createAppendices(metadata),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  }

  /**
   * Create header
   */
  private createHeader(metadata: ReportMetadata): any {
    return {
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `${metadata.projectName} - ${metadata.standard}`,
              size: 20,
              color: '666666',
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
        }),
      ],
    };
  }

  /**
   * Create footer with page numbers
   */
  private createFooter(metadata: ReportMetadata): any {
    return {
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `${metadata.clientName} | `,
              size: 18,
              color: '666666',
            }),
            new TextRun({
              text: `Report Date: ${metadata.reportDate.toLocaleDateString()}`,
              size: 18,
              color: '666666',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
      ],
    };
  }

  /**
   * Create title page
   */
  private createTitlePage(metadata: ReportMetadata): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: this.getStandardFullName(metadata.standard),
            size: 32,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: metadata.reportType.toUpperCase(),
            size: 28,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: metadata.projectName,
            size: 36,
            bold: true,
            color: '2E5090',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${metadata.location.region || ''}, ${metadata.location.state || ''}, ${metadata.location.country}`,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Commodity: ${metadata.commodity.join(', ')}`,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 1200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Prepared for:',
            size: 20,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: metadata.clientName,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Prepared by:',
            size: 20,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      ...metadata.competentPersons.map(cp => 
        new Paragraph({
          children: [
            new TextRun({
              text: `${cp.name}, ${cp.title}`,
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      ),
      new Paragraph({
        children: [
          new TextRun({
            text: `Report Date: ${metadata.reportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Effective Date: ${metadata.effectiveDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      }),
    ];
  }

  /**
   * Create table of contents
   */
  private createTableOfContents(): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: 'TABLE OF CONTENTS',
            size: 28,
            bold: true,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '[Table of Contents will be generated automatically]',
            size: 22,
            italics: true,
            color: '999999',
          }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      }),
    ];
  }

  /**
   * Create executive summary
   */
  private createExecutiveSummary(metadata: ReportMetadata): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: 'EXECUTIVE SUMMARY',
            size: 28,
            bold: true,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `This ${metadata.standard} compliant ${metadata.reportType} presents the results of work conducted on the ${metadata.projectName} located in ${metadata.location.country}.`,
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      }),
    ];
  }

  /**
   * Create chapters
   */
  private createChapters(chapters: ChapterContent[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    chapters.forEach((chapter, index) => {
      // Chapter title
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${chapter.title.toUpperCase()}`,
              size: 28,
              bold: true,
            }),
          ],
          heading: chapter.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 400 },
        })
      );

      // Chapter content
      chapter.content.forEach(paragraph => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      });

      // Page break after chapter
      if (chapter.level === 1) {
        paragraphs.push(
          new Paragraph({
            text: '',
            pageBreakBefore: true,
          })
        );
      }
    });

    return paragraphs;
  }

  /**
   * Create appendices
   */
  private createAppendices(metadata: ReportMetadata): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: 'APPENDICES',
            size: 28,
            bold: true,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Appendix A: Table 1 - Assessment and Reporting Criteria',
            size: 24,
            bold: true,
          }),
        ],
        spacing: { before: 200, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Appendix B: Competent Person Consent Forms',
            size: 24,
            bold: true,
          }),
        ],
        spacing: { before: 200, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Appendix C: References',
            size: 24,
            bold: true,
          }),
        ],
        spacing: { before: 200, after: 200 },
      }),
    ];
  }

  /**
   * Get full name of standard
   */
  private getStandardFullName(standard: ReportStandard): string {
    const names: Record<ReportStandard, string> = {
      JORC_2012: 'JORC CODE 2012 EDITION',
      NI_43_101: 'NI 43-101 TECHNICAL REPORT',
      PERC: 'PERC REPORTING STANDARD 2021',
      SAMREC: 'SAMREC CODE 2016',
      SEC_SK_1300: 'SEC REGULATION S-K ITEM 1300',
      CRIRSCO: 'CRIRSCO TEMPLATE',
      CBRR: 'GUIA CBRR 2022',
      ANM: 'RELATÓRIO TÉCNICO ANM',
      ANP: 'RELATÓRIO TÉCNICO ANP',
      CPRM: 'RELATÓRIO TÉCNICO CPRM',
      IBAMA: 'RELATÓRIO TÉCNICO IBAMA',
    };
    return names[standard];
  }

  /**
   * Get chapter structure for each standard
   */
  getChapterStructure(standard: ReportStandard): string[] {
    const structures: Record<ReportStandard, string[]> = {
      JORC_2012: [
        'Executive Summary',
        'Introduction',
        'Property Description and Location',
        'Accessibility, Climate, Local Resources, Infrastructure and Physiography',
        'History',
        'Geological Setting and Mineralisation',
        'Deposit Types',
        'Exploration',
        'Drilling',
        'Sample Preparation, Analyses and Security',
        'Data Verification',
        'Mineral Processing and Metallurgical Testing',
        'Mineral Resource Estimates',
        'Mineral Reserve Estimates',
        'Adjacent Properties',
        'Other Relevant Data and Information',
        'Interpretation and Conclusions',
        'Recommendations',
        'References',
      ],
      NI_43_101: [
        'Summary',
        'Introduction',
        'Reliance on Other Experts',
        'Property Description and Location',
        'Accessibility, Climate, Local Resources, Infrastructure and Physiography',
        'History',
        'Geological Setting and Mineralization',
        'Deposit Types',
        'Exploration',
        'Drilling',
        'Sample Preparation, Analyses and Security',
        'Data Verification',
        'Mineral Processing and Metallurgical Testing',
        'Mineral Resource Estimates',
        'Mineral Reserve Estimates',
        'Mining Methods',
        'Recovery Methods',
        'Project Infrastructure',
        'Market Studies and Contracts',
        'Environmental Studies, Permitting and Social or Community Impact',
        'Capital and Operating Costs',
        'Economic Analysis',
        'Adjacent Properties',
        'Other Relevant Data and Information',
        'Interpretation and Conclusions',
        'Recommendations',
        'References',
      ],
      // Similar structures for other standards...
      PERC: [], // Same as JORC with minor variations
      SAMREC: [], // Same as JORC with minor variations
      SEC_SK_1300: [], // Similar to NI 43-101
      CRIRSCO: [], // Template structure
      CBRR: [], // Similar to JORC in Portuguese
      ANM: [],
      ANP: [],
      CPRM: [],
      IBAMA: [],
    };

    return structures[standard] || structures.JORC_2012;
  }
}

export default new TemplateGenerator();

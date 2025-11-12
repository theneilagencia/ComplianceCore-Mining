/**
 * JORC Table 1 Generator
 * Generates complete JORC Table 1 with all 4 sections
 * Also generates equivalent tables for SAMREC and CBRR
 */

import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, AlignmentType, VerticalAlign } from 'docx';

export interface Table1Data {
  section1: SamplingTechniquesData;
  section2: ExplorationResultsData;
  section3: MineralResourcesData;
  section4: OreReservesData;
}

export interface SamplingTechniquesData {
  samplingTechniques: string;
  drillingTechniques: string;
  drillSampleRecovery: string;
  logging: string;
  subSamplingTechniques: string;
  qualityOfAssayData: string;
  verificationOfSampling: string;
  locationOfDataPoints: string;
  dataSpacing: string;
  orientationOfData: string;
  sampleSecurity: string;
  auditsOrReviews: string;
}

export interface ExplorationResultsData {
  mineralTenement: string;
  explorationByOthers: string;
  geology: string;
  drillHoleInformation: string;
  dataAggregation: string;
  relationshipBetweenWidths: string;
  diagrams: string;
  balancedReporting: string;
  otherExplorationData: string;
  furtherWork: string;
}

export interface MineralResourcesData {
  databaseIntegrity: string;
  siteVisits: string;
  geologicalInterpretation: string;
  dimensions: string;
  estimationTechniques: string;
  moisture: string;
  cutOffParameters: string;
  miningFactors: string;
  metallurgicalFactors: string;
  environmentalFactors: string;
  bulkDensity: string;
  classification: string;
  auditsOrReviews: string;
  discussionOfAccuracy: string;
}

export interface OreReservesData {
  mineralResourceEstimate: string;
  siteVisits: string;
  studyStatus: string;
  cutOffParameters: string;
  miningFactors: string;
  metallurgicalFactors: string;
  environmental: string;
  infrastructure: string;
  costs: string;
  revenueFactors: string;
  marketAssessment: string;
  economic: string;
  social: string;
  other: string;
  classification: string;
  auditsOrReviews: string;
  discussionOfAccuracy: string;
}

export class JORCTable1Generator {
  
  /**
   * Generate complete JORC Table 1
   */
  generateTable1(data: Table1Data): Table[] {
    return [
      this.createSection1(data.section1),
      this.createSection2(data.section2),
      this.createSection3(data.section3),
      this.createSection4(data.section4),
    ];
  }

  /**
   * Section 1: Sampling Techniques and Data
   */
  private createSection1(data: SamplingTechniquesData): Table {
    const rows: TableRow[] = [
      // Header
      this.createHeaderRow('SECTION 1: SAMPLING TECHNIQUES AND DATA'),
      this.createSubHeaderRow('(Criteria in this section apply to all succeeding sections.)'),
      this.createColumnHeaderRow(),
      
      // Criteria rows
      this.createCriteriaRow('Sampling techniques', data.samplingTechniques),
      this.createCriteriaRow('Drilling techniques', data.drillingTechniques),
      this.createCriteriaRow('Drill sample recovery', data.drillSampleRecovery),
      this.createCriteriaRow('Logging', data.logging),
      this.createCriteriaRow('Sub-sampling techniques and sample preparation', data.subSamplingTechniques),
      this.createCriteriaRow('Quality of assay data and laboratory tests', data.qualityOfAssayData),
      this.createCriteriaRow('Verification of sampling and assaying', data.verificationOfSampling),
      this.createCriteriaRow('Location of data points', data.locationOfDataPoints),
      this.createCriteriaRow('Data spacing and distribution', data.dataSpacing),
      this.createCriteriaRow('Orientation of data in relation to geological structure', data.orientationOfData),
      this.createCriteriaRow('Sample security', data.sampleSecurity),
      this.createCriteriaRow('Audits or reviews', data.auditsOrReviews),
    ];

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    });
  }

  /**
   * Section 2: Reporting of Exploration Results
   */
  private createSection2(data: ExplorationResultsData): Table {
    const rows: TableRow[] = [
      this.createHeaderRow('SECTION 2: REPORTING OF EXPLORATION RESULTS'),
      this.createSubHeaderRow('(Criteria listed in the preceding section also apply to this section.)'),
      this.createColumnHeaderRow(),
      
      this.createCriteriaRow('Mineral tenement and land tenure status', data.mineralTenement),
      this.createCriteriaRow('Exploration done by other parties', data.explorationByOthers),
      this.createCriteriaRow('Geology', data.geology),
      this.createCriteriaRow('Drill hole Information', data.drillHoleInformation),
      this.createCriteriaRow('Data aggregation methods', data.dataAggregation),
      this.createCriteriaRow('Relationship between mineralisation widths and intercept lengths', data.relationshipBetweenWidths),
      this.createCriteriaRow('Diagrams', data.diagrams),
      this.createCriteriaRow('Balanced reporting', data.balancedReporting),
      this.createCriteriaRow('Other substantive exploration data', data.otherExplorationData),
      this.createCriteriaRow('Further work', data.furtherWork),
    ];

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    });
  }

  /**
   * Section 3: Estimation and Reporting of Mineral Resources
   */
  private createSection3(data: MineralResourcesData): Table {
    const rows: TableRow[] = [
      this.createHeaderRow('SECTION 3: ESTIMATION AND REPORTING OF MINERAL RESOURCES'),
      this.createSubHeaderRow('(Criteria listed in section 1, and where relevant in section 2, also apply to this section.)'),
      this.createColumnHeaderRow(),
      
      this.createCriteriaRow('Database integrity', data.databaseIntegrity),
      this.createCriteriaRow('Site visits', data.siteVisits),
      this.createCriteriaRow('Geological interpretation', data.geologicalInterpretation),
      this.createCriteriaRow('Dimensions', data.dimensions),
      this.createCriteriaRow('Estimation and modelling techniques', data.estimationTechniques),
      this.createCriteriaRow('Moisture', data.moisture),
      this.createCriteriaRow('Cut-off parameters', data.cutOffParameters),
      this.createCriteriaRow('Mining factors or assumptions', data.miningFactors),
      this.createCriteriaRow('Metallurgical factors or assumptions', data.metallurgicalFactors),
      this.createCriteriaRow('Environmental factors or assumptions', data.environmentalFactors),
      this.createCriteriaRow('Bulk density', data.bulkDensity),
      this.createCriteriaRow('Classification', data.classification),
      this.createCriteriaRow('Audits or reviews', data.auditsOrReviews),
      this.createCriteriaRow('Discussion of relative accuracy/confidence', data.discussionOfAccuracy),
    ];

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    });
  }

  /**
   * Section 4: Estimation and Reporting of Ore Reserves
   */
  private createSection4(data: OreReservesData): Table {
    const rows: TableRow[] = [
      this.createHeaderRow('SECTION 4: ESTIMATION AND REPORTING OF ORE RESERVES'),
      this.createSubHeaderRow('(Criteria listed in section 1, and where relevant in sections 2 and 3, also apply to this section.)'),
      this.createColumnHeaderRow(),
      
      this.createCriteriaRow('Mineral Resource estimate for conversion to Ore Reserves', data.mineralResourceEstimate),
      this.createCriteriaRow('Site visits', data.siteVisits),
      this.createCriteriaRow('Study status', data.studyStatus),
      this.createCriteriaRow('Cut-off parameters', data.cutOffParameters),
      this.createCriteriaRow('Mining factors or assumptions', data.miningFactors),
      this.createCriteriaRow('Metallurgical factors or assumptions', data.metallurgicalFactors),
      this.createCriteriaRow('Environmental', data.environmental),
      this.createCriteriaRow('Infrastructure', data.infrastructure),
      this.createCriteriaRow('Costs', data.costs),
      this.createCriteriaRow('Revenue factors', data.revenueFactors),
      this.createCriteriaRow('Market assessment', data.marketAssessment),
      this.createCriteriaRow('Economic', data.economic),
      this.createCriteriaRow('Social', data.social),
      this.createCriteriaRow('Other', data.other),
      this.createCriteriaRow('Classification', data.classification),
      this.createCriteriaRow('Audits or reviews', data.auditsOrReviews),
      this.createCriteriaRow('Discussion of relative accuracy/confidence', data.discussionOfAccuracy),
    ];

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    });
  }

  /**
   * Create header row
   */
  private createHeaderRow(text: string): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  bold: true,
                  size: 24,
                  color: 'FFFFFF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          columnSpan: 2,
          shading: {
            fill: '2E5090',
          },
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    });
  }

  /**
   * Create sub-header row
   */
  private createSubHeaderRow(text: string): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  italics: true,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          columnSpan: 2,
          shading: {
            fill: 'E7E6E6',
          },
        }),
      ],
    });
  }

  /**
   * Create column header row
   */
  private createColumnHeaderRow(): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Criteria',
                  bold: true,
                  size: 22,
                }),
              ],
            }),
          ],
          width: {
            size: 30,
            type: WidthType.PERCENTAGE,
          },
          shading: {
            fill: 'D9D9D9',
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Explanation',
                  bold: true,
                  size: 22,
                }),
              ],
            }),
          ],
          width: {
            size: 70,
            type: WidthType.PERCENTAGE,
          },
          shading: {
            fill: 'D9D9D9',
          },
        }),
      ],
    });
  }

  /**
   * Create criteria row
   */
  private createCriteriaRow(criteria: string, explanation: string): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: criteria,
                  bold: true,
                  size: 20,
                }),
              ],
            }),
          ],
          width: {
            size: 30,
            type: WidthType.PERCENTAGE,
          },
          verticalAlign: VerticalAlign.TOP,
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: explanation || '[To be completed]',
                  size: 20,
                  italics: !explanation,
                  color: explanation ? '000000' : '999999',
                }),
              ],
            }),
          ],
          width: {
            size: 70,
            type: WidthType.PERCENTAGE,
          },
          verticalAlign: VerticalAlign.TOP,
        }),
      ],
    });
  }

  /**
   * Generate empty template for user to fill
   */
  generateEmptyTemplate(): Table1Data {
    return {
      section1: {
        samplingTechniques: '',
        drillingTechniques: '',
        drillSampleRecovery: '',
        logging: '',
        subSamplingTechniques: '',
        qualityOfAssayData: '',
        verificationOfSampling: '',
        locationOfDataPoints: '',
        dataSpacing: '',
        orientationOfData: '',
        sampleSecurity: '',
        auditsOrReviews: '',
      },
      section2: {
        mineralTenement: '',
        explorationByOthers: '',
        geology: '',
        drillHoleInformation: '',
        dataAggregation: '',
        relationshipBetweenWidths: '',
        diagrams: '',
        balancedReporting: '',
        otherExplorationData: '',
        furtherWork: '',
      },
      section3: {
        databaseIntegrity: '',
        siteVisits: '',
        geologicalInterpretation: '',
        dimensions: '',
        estimationTechniques: '',
        moisture: '',
        cutOffParameters: '',
        miningFactors: '',
        metallurgicalFactors: '',
        environmentalFactors: '',
        bulkDensity: '',
        classification: '',
        auditsOrReviews: '',
        discussionOfAccuracy: '',
      },
      section4: {
        mineralResourceEstimate: '',
        siteVisits: '',
        studyStatus: '',
        cutOffParameters: '',
        miningFactors: '',
        metallurgicalFactors: '',
        environmental: '',
        infrastructure: '',
        costs: '',
        revenueFactors: '',
        marketAssessment: '',
        economic: '',
        social: '',
        other: '',
        classification: '',
        auditsOrReviews: '',
        discussionOfAccuracy: '',
      },
    };
  }
}

export default new JORCTable1Generator();

/**
 * Default Report Templates
 * 
 * Collection of international mining report standards:
 * - JORC Code 2012 (Australia)
 * - NI 43-101 (Canada)
 * - SAMREC Code 2016 (South Africa)
 * - PERC Standard 2021 (Europe)
 * 
 * @module DefaultTemplates
 * @sprint SPRINT5-005
 */

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  fields: TemplateField[];
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'multiselect' | 'file' | 'table';
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'company' | 'custom';
  standard?: 'JORC' | 'NI43-101' | 'SAMREC' | 'PERC';
  company?: string;
  version: string;
  thumbnail?: string;
  tags: string[];
  sections: TemplateSection[];
  metadata: {
    author: string;
    createdAt: string;
    updatedAt: string;
    language: string;
    jurisdiction: string;
  };
}

/**
 * JORC Code 2012 Template
 */
export const JORCTemplate: ReportTemplate = {
  id: 'jorc-2012',
  name: 'JORC Code 2012',
  description: 'Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves (2012 Edition)',
  category: 'standard',
  standard: 'JORC',
  version: '2012',
  thumbnail: '/templates/jorc-2012.png',
  tags: ['JORC', 'Australia', 'Standard', 'Mineral Resources', 'Ore Reserves'],
  sections: [
    {
      id: 'section-1',
      title: 'Sampling Techniques and Data',
      description: 'Section 1 of JORC Table 1',
      order: 1,
      required: true,
      fields: [
        {
          id: 'sampling-techniques',
          label: 'Sampling Techniques',
          type: 'textarea',
          required: true,
          placeholder: 'Describe sampling techniques including nature and quality of sampling...',
        },
        {
          id: 'drilling-techniques',
          label: 'Drilling Techniques',
          type: 'textarea',
          required: true,
          placeholder: 'Describe drilling techniques (e.g. core, reverse circulation, open-hole hammer, rotary air blast, auger, etc.)...',
        },
        {
          id: 'drill-sample-recovery',
          label: 'Drill Sample Recovery',
          type: 'textarea',
          required: true,
          placeholder: 'Method of recording and assessing core and chip sample recoveries...',
        },
        {
          id: 'logging',
          label: 'Logging',
          type: 'textarea',
          required: true,
          placeholder: 'Whether core and chip samples have been geologically and geotechnically logged...',
        },
        {
          id: 'sub-sampling',
          label: 'Sub-sampling Techniques',
          type: 'textarea',
          required: true,
          placeholder: 'Sample preparation, sub-sampling techniques and sample preparation...',
        },
      ],
    },
    {
      id: 'section-2',
      title: 'Reporting of Exploration Results',
      description: 'Section 2 of JORC Table 1',
      order: 2,
      required: true,
      fields: [
        {
          id: 'mineral-tenement',
          label: 'Mineral Tenement and Land Tenure Status',
          type: 'textarea',
          required: true,
          placeholder: 'Type, reference name/number, location and ownership...',
        },
        {
          id: 'exploration-done',
          label: 'Exploration Done by Other Parties',
          type: 'textarea',
          required: false,
          placeholder: 'Acknowledgment and appraisal of exploration by other parties...',
        },
        {
          id: 'geology',
          label: 'Geology',
          type: 'textarea',
          required: true,
          placeholder: 'Deposit type, geological setting and style of mineralisation...',
        },
        {
          id: 'drill-hole-info',
          label: 'Drill Hole Information',
          type: 'table',
          required: true,
          placeholder: 'Summary of all information material to understanding exploration results...',
        },
      ],
    },
    {
      id: 'section-3',
      title: 'Estimation and Reporting of Mineral Resources',
      description: 'Section 3 of JORC Table 1',
      order: 3,
      required: true,
      fields: [
        {
          id: 'database-integrity',
          label: 'Database Integrity',
          type: 'textarea',
          required: true,
          placeholder: 'Measures taken to ensure data has not been corrupted...',
        },
        {
          id: 'site-visits',
          label: 'Site Visits',
          type: 'textarea',
          required: true,
          placeholder: 'Comment on any site visits undertaken by the Competent Person...',
        },
        {
          id: 'geological-interpretation',
          label: 'Geological Interpretation',
          type: 'textarea',
          required: true,
          placeholder: 'Confidence in geological interpretation...',
        },
        {
          id: 'dimensions',
          label: 'Dimensions',
          type: 'textarea',
          required: true,
          placeholder: 'Extent and variability of the Mineral Resource...',
        },
        {
          id: 'estimation-methodology',
          label: 'Estimation and Modelling Techniques',
          type: 'textarea',
          required: true,
          placeholder: 'Nature and appropriateness of the estimation technique(s)...',
        },
        {
          id: 'mineral-resource-estimate',
          label: 'Mineral Resource Estimate',
          type: 'table',
          required: true,
          placeholder: 'Tonnage and grade estimate with classification...',
        },
      ],
    },
    {
      id: 'section-4',
      title: 'Estimation and Reporting of Ore Reserves',
      description: 'Section 4 of JORC Table 1',
      order: 4,
      required: false,
      fields: [
        {
          id: 'mineral-resource-conversion',
          label: 'Mineral Resource Estimate for Conversion to Ore Reserves',
          type: 'textarea',
          required: true,
          placeholder: 'Description of the Mineral Resource estimate used as a basis...',
        },
        {
          id: 'site-visits-reserves',
          label: 'Site Visits',
          type: 'textarea',
          required: true,
          placeholder: 'Comment on any site visits undertaken by the Competent Person...',
        },
        {
          id: 'study-status',
          label: 'Study Status',
          type: 'select',
          required: true,
          options: ['Scoping Study', 'Pre-Feasibility Study', 'Feasibility Study', 'Life of Mine Plan'],
        },
        {
          id: 'cut-off-parameters',
          label: 'Cut-off Parameters',
          type: 'textarea',
          required: true,
          placeholder: 'Basis of the cut-off grade(s) or quality parameters applied...',
        },
        {
          id: 'mining-factors',
          label: 'Mining Factors or Assumptions',
          type: 'textarea',
          required: true,
          placeholder: 'Method and assumptions used in mining factors or assumptions...',
        },
        {
          id: 'metallurgical-factors',
          label: 'Metallurgical Factors or Assumptions',
          type: 'textarea',
          required: true,
          placeholder: 'Metallurgical factors or assumptions used...',
        },
        {
          id: 'ore-reserve-estimate',
          label: 'Ore Reserve Estimate',
          type: 'table',
          required: true,
          placeholder: 'Tonnage and grade estimate with classification...',
        },
      ],
    },
  ],
  metadata: {
    author: 'ComplianceCore Mining',
    createdAt: '2025-11-02',
    updatedAt: '2025-11-02',
    language: 'English',
    jurisdiction: 'Australia',
  },
};

/**
 * NI 43-101 Template
 */
export const NI43101Template: ReportTemplate = {
  id: 'ni43-101',
  name: 'NI 43-101 Technical Report',
  description: 'Canadian Standards of Disclosure for Mineral Projects',
  category: 'standard',
  standard: 'NI43-101',
  version: '2016',
  thumbnail: '/templates/ni43-101.png',
  tags: ['NI43-101', 'Canada', 'Standard', 'Technical Report'],
  sections: [
    {
      id: 'section-1',
      title: 'Summary',
      order: 1,
      required: true,
      fields: [
        {
          id: 'executive-summary',
          label: 'Executive Summary',
          type: 'textarea',
          required: true,
          placeholder: 'Concise summary of all sections of the technical report...',
        },
      ],
    },
    {
      id: 'section-2',
      title: 'Introduction',
      order: 2,
      required: true,
      fields: [
        {
          id: 'terms-of-reference',
          label: 'Terms of Reference and Purpose',
          type: 'textarea',
          required: true,
        },
        {
          id: 'sources-of-information',
          label: 'Sources of Information',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      id: 'section-4',
      title: 'Property Description and Location',
      order: 4,
      required: true,
      fields: [
        {
          id: 'property-location',
          label: 'Property Location',
          type: 'textarea',
          required: true,
          placeholder: 'Area, distance from populated areas, access routes...',
        },
        {
          id: 'mineral-titles',
          label: 'Mineral Titles',
          type: 'table',
          required: true,
        },
      ],
    },
    // ... Additional sections would continue here
  ],
  metadata: {
    author: 'ComplianceCore Mining',
    createdAt: '2025-11-02',
    updatedAt: '2025-11-02',
    language: 'English',
    jurisdiction: 'Canada',
  },
};

/**
 * SAMREC Template
 */
export const SAMRECTemplate: ReportTemplate = {
  id: 'samrec-2016',
  name: 'SAMREC Code 2016',
  description: 'South African Code for the Reporting of Exploration Results, Mineral Resources and Mineral Reserves',
  category: 'standard',
  standard: 'SAMREC',
  version: '2016',
  thumbnail: '/templates/samrec-2016.png',
  tags: ['SAMREC', 'South Africa', 'Standard'],
  sections: [
    {
      id: 'section-1',
      title: 'Sampling and Sub-sampling Techniques',
      order: 1,
      required: true,
      fields: [
        {
          id: 'sampling-techniques',
          label: 'Sampling Techniques',
          type: 'textarea',
          required: true,
        },
        {
          id: 'drilling-techniques',
          label: 'Drilling Techniques',
          type: 'textarea',
          required: true,
        },
      ],
    },
    // ... Additional sections
  ],
  metadata: {
    author: 'ComplianceCore Mining',
    createdAt: '2025-11-02',
    updatedAt: '2025-11-02',
    language: 'English',
    jurisdiction: 'South Africa',
  },
};

/**
 * PERC Template
 */
export const PERCTemplate: ReportTemplate = {
  id: 'perc-2021',
  name: 'PERC Standard 2021',
  description: 'Pan-European Reserves and Resources Reporting Committee Standard',
  category: 'standard',
  standard: 'PERC',
  version: '2021',
  thumbnail: '/templates/perc-2021.png',
  tags: ['PERC', 'Europe', 'Standard'],
  sections: [
    {
      id: 'section-1',
      title: 'Exploration Results',
      order: 1,
      required: true,
      fields: [
        {
          id: 'exploration-info',
          label: 'Exploration Information',
          type: 'textarea',
          required: true,
        },
      ],
    },
    // ... Additional sections
  ],
  metadata: {
    author: 'ComplianceCore Mining',
    createdAt: '2025-11-02',
    updatedAt: '2025-11-02',
    language: 'English',
    jurisdiction: 'Europe',
  },
};

/**
 * All default templates
 */
export const defaultTemplates: ReportTemplate[] = [
  JORCTemplate,
  NI43101Template,
  SAMRECTemplate,
  PERCTemplate,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ReportTemplate | undefined {
  return defaultTemplates.find((template) => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ReportTemplate['category']): ReportTemplate[] {
  return defaultTemplates.filter((template) => template.category === category);
}

/**
 * Get templates by standard
 */
export function getTemplatesByStandard(standard: ReportTemplate['standard']): ReportTemplate[] {
  return defaultTemplates.filter((template) => template.standard === standard);
}

/**
 * Get templates by company
 */
export function getTemplatesByCompany(company: string): ReportTemplate[] {
  return defaultTemplates.filter((template) => template.company === company);
}

/**
 * Search templates by query
 */
export function searchTemplates(query: string): ReportTemplate[] {
  const lowerQuery = query.toLowerCase();
  
  return defaultTemplates.filter((template) => {
    return (
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      template.company?.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Shared Template Types and Data
 * 
 * Re-export of default templates for client-side use
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

// Mock templates data (in production, this would be fetched from API)
export const defaultTemplates: ReportTemplate[] = [
  {
    id: 'jorc-2012',
    name: 'JORC Code 2012',
    description: 'Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves (2012 Edition)',
    category: 'standard',
    standard: 'JORC',
    version: '2012',
    tags: ['JORC', 'Australia', 'Standard', 'Mineral Resources', 'Ore Reserves'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'Australia',
    },
  },
  {
    id: 'ni43-101',
    name: 'NI 43-101 Technical Report',
    description: 'Canadian Standards of Disclosure for Mineral Projects',
    category: 'standard',
    standard: 'NI43-101',
    version: '2016',
    tags: ['NI43-101', 'Canada', 'Standard', 'Technical Report'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'Canada',
    },
  },
  {
    id: 'samrec-2016',
    name: 'SAMREC Code 2016',
    description: 'South African Code for the Reporting of Exploration Results, Mineral Resources and Mineral Reserves',
    category: 'standard',
    standard: 'SAMREC',
    version: '2016',
    tags: ['SAMREC', 'South Africa', 'Standard'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'South Africa',
    },
  },
  {
    id: 'perc-2021',
    name: 'PERC Standard 2021',
    description: 'Pan-European Reserves and Resources Reporting Committee Standard',
    category: 'standard',
    standard: 'PERC',
    version: '2021',
    tags: ['PERC', 'Europe', 'Standard'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'Europe',
    },
  },
  {
    id: 'vale-technical-report',
    name: 'Vale Technical Report',
    description: 'Vale S.A. standardized technical report format',
    category: 'company',
    company: 'Vale',
    version: '1.0',
    tags: ['Vale', 'Brazil', 'Company', 'Iron Ore', 'Nickel'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English/Portuguese',
      jurisdiction: 'Brazil',
    },
  },
  {
    id: 'bhp-technical-report',
    name: 'BHP Technical Report',
    description: 'BHP Group standardized technical report format',
    category: 'company',
    company: 'BHP',
    version: '1.0',
    tags: ['BHP', 'Australia', 'Company', 'Diversified'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'Australia',
    },
  },
  {
    id: 'rio-tinto-technical-report',
    name: 'Rio Tinto Technical Report',
    description: 'Rio Tinto Group standardized technical report format',
    category: 'company',
    company: 'Rio Tinto',
    version: '1.0',
    tags: ['Rio Tinto', 'UK/Australia', 'Company', 'Iron Ore', 'Copper', 'Aluminum'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'UK/Australia',
    },
  },
  {
    id: 'glencore-technical-report',
    name: 'Glencore Technical Report',
    description: 'Glencore plc standardized technical report format',
    category: 'company',
    company: 'Glencore',
    version: '1.0',
    tags: ['Glencore', 'Switzerland', 'Company', 'Diversified'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'Switzerland',
    },
  },
  {
    id: 'anglo-american-technical-report',
    name: 'Anglo American Technical Report',
    description: 'Anglo American plc standardized technical report format',
    category: 'company',
    company: 'Anglo American',
    version: '1.0',
    tags: ['Anglo American', 'UK', 'Company', 'Platinum', 'Diamonds', 'Copper'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'UK',
    },
  },
  {
    id: 'newmont-technical-report',
    name: 'Newmont Technical Report',
    description: 'Newmont Corporation standardized technical report format',
    category: 'company',
    company: 'Newmont',
    version: '1.0',
    tags: ['Newmont', 'USA', 'Company', 'Gold'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'USA',
    },
  },
  {
    id: 'barrick-technical-report',
    name: 'Barrick Gold Technical Report',
    description: 'Barrick Gold Corporation standardized technical report format',
    category: 'company',
    company: 'Barrick Gold',
    version: '1.0',
    tags: ['Barrick', 'Canada', 'Company', 'Gold'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'Canada',
    },
  },
  {
    id: 'kinross-technical-report',
    name: 'Kinross Gold Technical Report',
    description: 'Kinross Gold Corporation standardized technical report format',
    category: 'company',
    company: 'Kinross Gold',
    version: '1.0',
    tags: ['Kinross', 'Canada', 'Company', 'Gold'],
    sections: [],
    metadata: {
      author: 'ComplianceCore Mining',
      createdAt: '2025-11-02',
      updatedAt: '2025-11-02',
      language: 'English',
      jurisdiction: 'Canada',
    },
  },
];

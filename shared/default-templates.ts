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

// International mining standards templates (in production, this would be fetched from API)
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
];

import { z } from 'zod';

/**
 * Schema de Template Customizável
 * 
 * Define a estrutura de um template para relatórios técnicos.
 * Permite que cada tenant customize o formato e conteúdo dos relatórios.
 */
export const TemplateSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  standard: z.enum(['JORC', 'NI43-101', 'PERC', 'SAMREC', 'NAEN']),
  version: z.number().int().positive(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  
  // Configurações visuais
  styling: z.object({
    // Cores
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#2F2C79'),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#4A90E2'),
    accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#F59E0B'),
    
    // Tipografia
    fontFamily: z.enum(['Inter', 'Roboto', 'Arial', 'Times New Roman']).default('Inter'),
    fontSize: z.number().min(10).max(16).default(12),
    
    // Logo
    logoUrl: z.string().url().optional(),
    logoPosition: z.enum(['left', 'center', 'right']).default('left'),
    
    // Cabeçalho e Rodapé
    headerText: z.string().optional(),
    footerText: z.string().optional(),
    showPageNumbers: z.boolean().default(true),
  }).optional(),
  
  // Seções do relatório
  sections: z.array(z.object({
    id: z.string(),
    type: z.enum([
      'title',
      'executive_summary',
      'competent_person',
      'introduction',
      'location_access',
      'geology',
      'mineral_resources',
      'mineral_reserves',
      'methodology',
      'economic_assumptions',
      'conclusions',
      'recommendations',
      'references',
      'appendices',
      'custom',
    ]),
    title: z.string(),
    order: z.number().int().nonnegative(),
    enabled: z.boolean().default(true),
    required: z.boolean().default(false),
    
    // Configurações específicas da seção
    config: z.object({
      showTables: z.boolean().default(true),
      showCharts: z.boolean().default(true),
      showImages: z.boolean().default(true),
      customFields: z.array(z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      })).optional(),
    }).optional(),
  })).default([]),
  
  // Metadados
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  updatedBy: z.string().optional(),
});

export type Template = z.infer<typeof TemplateSchema>;

/**
 * Template padrão JORC
 */
export const DEFAULT_JORC_TEMPLATE: Omit<Template, 'id' | 'tenantId' | 'createdBy'> = {
  name: 'JORC Standard Template',
  description: 'Template padrão para relatórios JORC Code 2012',
  standard: 'JORC',
  version: 1,
  isActive: true,
  isDefault: true,
  
  styling: {
    primaryColor: '#2F2C79',
    secondaryColor: '#4A90E2',
    accentColor: '#F59E0B',
    fontFamily: 'Inter',
    fontSize: 12,
    logoPosition: 'left',
    showPageNumbers: true,
  },
  
  sections: [
    {
      id: 'title',
      type: 'title',
      title: 'Title Page',
      order: 0,
      enabled: true,
      required: true,
    },
    {
      id: 'executive_summary',
      type: 'executive_summary',
      title: 'Executive Summary',
      order: 1,
      enabled: true,
      required: true,
    },
    {
      id: 'competent_person',
      type: 'competent_person',
      title: 'Competent Person Declaration',
      order: 2,
      enabled: true,
      required: true,
    },
    {
      id: 'introduction',
      type: 'introduction',
      title: 'Introduction',
      order: 3,
      enabled: true,
      required: true,
    },
    {
      id: 'location',
      type: 'location_access',
      title: 'Location and Access',
      order: 4,
      enabled: true,
      required: true,
    },
    {
      id: 'geology',
      type: 'geology',
      title: 'Regional and Local Geology',
      order: 5,
      enabled: true,
      required: true,
      config: {
        showTables: true,
        showCharts: true,
        showImages: true,
      },
    },
    {
      id: 'resources',
      type: 'mineral_resources',
      title: 'Mineral Resource Estimate',
      order: 6,
      enabled: true,
      required: true,
      config: {
        showTables: true,
        showCharts: true,
        showImages: false,
      },
    },
    {
      id: 'reserves',
      type: 'mineral_reserves',
      title: 'Ore Reserve Estimate',
      order: 7,
      enabled: true,
      required: false,
      config: {
        showTables: true,
        showCharts: true,
        showImages: false,
      },
    },
    {
      id: 'methodology',
      type: 'methodology',
      title: 'Methodology and QA/QC',
      order: 8,
      enabled: true,
      required: true,
    },
    {
      id: 'economics',
      type: 'economic_assumptions',
      title: 'Economic Assumptions',
      order: 9,
      enabled: true,
      required: true,
      config: {
        showTables: true,
        showCharts: false,
        showImages: false,
      },
    },
    {
      id: 'conclusions',
      type: 'conclusions',
      title: 'Conclusions',
      order: 10,
      enabled: true,
      required: true,
    },
    {
      id: 'recommendations',
      type: 'recommendations',
      title: 'Recommendations',
      order: 11,
      enabled: true,
      required: false,
    },
    {
      id: 'references',
      type: 'references',
      title: 'References',
      order: 12,
      enabled: true,
      required: false,
    },
  ],
  
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Template padrão NI 43-101
 */
export const DEFAULT_NI43101_TEMPLATE: Omit<Template, 'id' | 'tenantId' | 'createdBy'> = {
  ...DEFAULT_JORC_TEMPLATE,
  name: 'NI 43-101 Standard Template',
  description: 'Template padrão para relatórios NI 43-101',
  standard: 'NI43-101',
};

/**
 * Template padrão PERC
 */
export const DEFAULT_PERC_TEMPLATE: Omit<Template, 'id' | 'tenantId' | 'createdBy'> = {
  ...DEFAULT_JORC_TEMPLATE,
  name: 'PERC Standard Template',
  description: 'Template padrão para relatórios PERC',
  standard: 'PERC',
};

/**
 * Template padrão SAMREC
 */
export const DEFAULT_SAMREC_TEMPLATE: Omit<Template, 'id' | 'tenantId' | 'createdBy'> = {
  ...DEFAULT_JORC_TEMPLATE,
  name: 'SAMREC Standard Template',
  description: 'Template padrão para relatórios SAMREC',
  standard: 'SAMREC',
};

/**
 * Template padrão NAEN
 */
export const DEFAULT_NAEN_TEMPLATE: Omit<Template, 'id' | 'tenantId' | 'createdBy'> = {
  ...DEFAULT_JORC_TEMPLATE,
  name: 'NAEN Standard Template',
  description: 'Template padrão para relatórios NAEN',
  standard: 'NAEN',
};

/**
 * Mapa de templates padrão por standard
 */
export const DEFAULT_TEMPLATES = {
  JORC: DEFAULT_JORC_TEMPLATE,
  'NI43-101': DEFAULT_NI43101_TEMPLATE,
  PERC: DEFAULT_PERC_TEMPLATE,
  SAMREC: DEFAULT_SAMREC_TEMPLATE,
  NAEN: DEFAULT_NAEN_TEMPLATE,
} as const;

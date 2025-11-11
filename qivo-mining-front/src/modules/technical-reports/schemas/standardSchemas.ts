/**
 * Standard-specific field schemas
 * Defines required and optional fields for each reporting standard
 */

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  gridColumn?: '1' | '2' | 'full'; // Layout hint
}

export interface StandardSchema {
  code: string;
  name: string;
  description: string;
  sections: Array<{
    title: string;
    description?: string;
    fields: FieldDefinition[];
  }>;
}

/**
 * JORC 2012 Schema
 * Based on JORC Code 2012 Table 1
 */
export const JORC_SCHEMA: StandardSchema = {
  code: 'JORC_2012',
  name: 'JORC 2012',
  description: 'Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves',
  sections: [
    {
      title: 'Informações Básicas',
      fields: [
        {
          name: 'title',
          label: 'Título do Relatório',
          type: 'text',
          required: true,
          placeholder: 'Ex: Relatório Técnico - Projeto Carajás 2025',
          helpText: 'Mínimo 5 caracteres. Seja específico para facilitar identificação.',
          gridColumn: 'full',
        },
        {
          name: 'projectName',
          label: 'Nome do Projeto',
          type: 'text',
          required: true,
          placeholder: 'Ex: Projeto Carajás - Mina de Ferro',
          gridColumn: '1',
        },
        {
          name: 'location',
          label: 'Localização',
          type: 'text',
          required: true,
          placeholder: 'Ex: Pará, Brasil | Coordenadas: -6.0°, -50.0°',
          gridColumn: '2',
        },
      ],
    },
    {
      title: 'Section 1: Sampling Techniques and Data',
      description: 'Criteria in this section apply to all succeeding sections',
      fields: [
        {
          name: 'samplingTechniques',
          label: 'Sampling Techniques',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva as técnicas de amostragem utilizadas...',
          helpText: 'Nature and quality of sampling (e.g., cut channels, random chips, etc.)',
          gridColumn: 'full',
        },
        {
          name: 'drillingTechniques',
          label: 'Drilling Techniques',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva as técnicas de perfuração...',
          helpText: 'Drill type (e.g., core, reverse circulation, open-hole hammer, etc.)',
          gridColumn: 'full',
        },
        {
          name: 'logging',
          label: 'Logging',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva os procedimentos de logging...',
          helpText: 'Whether core and chip samples have been geologically and geotechnically logged',
          gridColumn: 'full',
        },
      ],
    },
    {
      title: 'Section 3: Mineral Resources',
      fields: [
        {
          name: 'commodity',
          label: 'Commodity',
          type: 'text',
          required: true,
          placeholder: 'Ex: Ferro, Ouro, Cobre',
          gridColumn: '1',
        },
        {
          name: 'resourceTonnes',
          label: 'Recurso (toneladas)',
          type: 'number',
          required: true,
          placeholder: 'Ex: 1000000',
          gridColumn: '1',
        },
        {
          name: 'grade',
          label: 'Teor Médio (%)',
          type: 'number',
          required: true,
          placeholder: 'Ex: 2.5',
          gridColumn: '2',
        },
        {
          name: 'resourceCategory',
          label: 'Resource Category',
          type: 'select',
          required: true,
          options: [
            { value: 'inferred', label: 'Inferred' },
            { value: 'indicated', label: 'Indicated' },
            { value: 'measured', label: 'Measured' },
          ],
          gridColumn: '2',
        },
        {
          name: 'estimationTechnique',
          label: 'Estimation Technique',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva a técnica de estimativa utilizada...',
          helpText: 'The nature and appropriateness of the estimation technique(s) applied',
          gridColumn: 'full',
        },
      ],
    },
    {
      title: 'Descrição do Projeto',
      fields: [
        {
          name: 'description',
          label: 'Descrição do Projeto',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva brevemente o projeto, objetivos e principais características...',
          gridColumn: 'full',
        },
      ],
    },
  ],
};

/**
 * NI 43-101 Schema
 * Based on Canadian National Instrument 43-101
 */
export const NI43101_SCHEMA: StandardSchema = {
  code: 'NI_43_101',
  name: 'NI 43-101',
  description: 'Canadian National Instrument 43-101 Standards of Disclosure for Mineral Projects',
  sections: [
    {
      title: 'Informações Básicas',
      fields: [
        {
          name: 'title',
          label: 'Título do Relatório',
          type: 'text',
          required: true,
          placeholder: 'Ex: Relatório Técnico - Projeto Carajás 2025',
          helpText: 'Mínimo 5 caracteres. Seja específico para facilitar identificação.',
          gridColumn: 'full',
        },
        {
          name: 'projectName',
          label: 'Nome do Projeto',
          type: 'text',
          required: true,
          placeholder: 'Ex: Projeto Carajás - Mina de Ferro',
          gridColumn: '1',
        },
        {
          name: 'location',
          label: 'Localização',
          type: 'text',
          required: true,
          placeholder: 'Ex: Pará, Brasil | Coordenadas: -6.0°, -50.0°',
          gridColumn: '2',
        },
      ],
    },
    {
      title: 'Item 4: Property Description and Location',
      description: 'Description of the mineral property and its location',
      fields: [
        {
          name: 'propertyDescription',
          label: 'Property Description',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva a propriedade mineral...',
          helpText: 'Area, boundaries, and nature of the property',
          gridColumn: 'full',
        },
        {
          name: 'accessibility',
          label: 'Accessibility',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva o acesso à propriedade...',
          helpText: 'Proximity to population centers, means of access, climate, and operating season',
          gridColumn: 'full',
        },
      ],
    },
    {
      title: 'Item 6: History',
      fields: [
        {
          name: 'explorationHistory',
          label: 'Exploration History',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva o histórico de exploração...',
          helpText: 'Previous exploration work and results',
          gridColumn: 'full',
        },
        {
          name: 'productionHistory',
          label: 'Production History',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva o histórico de produção (se aplicável)...',
          helpText: 'Previous production from the property',
          gridColumn: 'full',
        },
      ],
    },
    {
      title: 'Item 14: Mineral Resource Estimates',
      fields: [
        {
          name: 'commodity',
          label: 'Commodity',
          type: 'text',
          required: true,
          placeholder: 'Ex: Ferro, Ouro, Cobre',
          gridColumn: '1',
        },
        {
          name: 'resourceTonnes',
          label: 'Recurso (toneladas)',
          type: 'number',
          required: true,
          placeholder: 'Ex: 1000000',
          gridColumn: '1',
        },
        {
          name: 'grade',
          label: 'Teor Médio (%)',
          type: 'number',
          required: true,
          placeholder: 'Ex: 2.5',
          gridColumn: '2',
        },
        {
          name: 'resourceCategory',
          label: 'Resource Category',
          type: 'select',
          required: true,
          options: [
            { value: 'inferred', label: 'Inferred' },
            { value: 'indicated', label: 'Indicated' },
            { value: 'measured', label: 'Measured' },
          ],
          gridColumn: '2',
        },
      ],
    },
    {
      title: 'Descrição do Projeto',
      fields: [
        {
          name: 'description',
          label: 'Descrição do Projeto',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva brevemente o projeto, objetivos e principais características...',
          gridColumn: 'full',
        },
      ],
    },
  ],
};

/**
 * PERC Schema
 * Based on Pan-European Reserves & Resources Reporting Committee Standard
 */
export const PERC_SCHEMA: StandardSchema = {
  code: 'PERC',
  name: 'PERC',
  description: 'Pan-European Reserves & Resources Reporting Committee Standard',
  sections: [
    {
      title: 'Informações Básicas',
      fields: [
        {
          name: 'title',
          label: 'Título do Relatório',
          type: 'text',
          required: true,
          placeholder: 'Ex: Relatório Técnico - Projeto Carajás 2025',
          helpText: 'Mínimo 5 caracteres. Seja específico para facilitar identificação.',
          gridColumn: 'full',
        },
        {
          name: 'projectName',
          label: 'Nome do Projeto',
          type: 'text',
          required: true,
          placeholder: 'Ex: Projeto Carajás - Mina de Ferro',
          gridColumn: '1',
        },
        {
          name: 'location',
          label: 'Localização',
          type: 'text',
          required: true,
          placeholder: 'Ex: Pará, Brasil | Coordenadas: -6.0°, -50.0°',
          gridColumn: '2',
        },
      ],
    },
    {
      title: 'Environmental and Social Compliance',
      description: 'PERC-specific requirements for EU compliance',
      fields: [
        {
          name: 'environmentalCompliance',
          label: 'Environmental Compliance',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva a conformidade ambiental...',
          helpText: 'Compliance with EU environmental directives',
          gridColumn: 'full',
        },
        {
          name: 'socialLicense',
          label: 'Social License to Operate',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva a licença social para operar...',
          helpText: 'Community engagement and social impact assessment',
          gridColumn: 'full',
        },
        {
          name: 'biodiversityImpact',
          label: 'Biodiversity Impact Assessment',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva o impacto na biodiversidade...',
          helpText: 'Assessment of impact on local biodiversity',
          gridColumn: 'full',
        },
      ],
    },
    {
      title: 'Mineral Resources',
      fields: [
        {
          name: 'commodity',
          label: 'Commodity',
          type: 'text',
          required: true,
          placeholder: 'Ex: Ferro, Ouro, Cobre',
          gridColumn: '1',
        },
        {
          name: 'resourceTonnes',
          label: 'Recurso (toneladas)',
          type: 'number',
          required: true,
          placeholder: 'Ex: 1000000',
          gridColumn: '1',
        },
        {
          name: 'grade',
          label: 'Teor Médio (%)',
          type: 'number',
          required: true,
          placeholder: 'Ex: 2.5',
          gridColumn: '2',
        },
        {
          name: 'resourceCategory',
          label: 'Resource Category',
          type: 'select',
          required: true,
          options: [
            { value: 'inferred', label: 'Inferred' },
            { value: 'indicated', label: 'Indicated' },
            { value: 'measured', label: 'Measured' },
          ],
          gridColumn: '2',
        },
      ],
    },
    {
      title: 'Descrição do Projeto',
      fields: [
        {
          name: 'description',
          label: 'Descrição do Projeto',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva brevemente o projeto, objetivos e principais características...',
          gridColumn: 'full',
        },
      ],
    },
  ],
};

/**
 * SAMREC Schema
 * Based on South African Mineral Resource Committee Code
 */
export const SAMREC_SCHEMA: StandardSchema = {
  code: 'SAMREC',
  name: 'SAMREC',
  description: 'South African Mineral Resource Committee Code',
  sections: [
    {
      title: 'Informações Básicas',
      fields: [
        {
          name: 'title',
          label: 'Título do Relatório',
          type: 'text',
          required: true,
          placeholder: 'Ex: Relatório Técnico - Projeto Carajás 2025',
          helpText: 'Mínimo 5 caracteres. Seja específico para facilitar identificação.',
          gridColumn: 'full',
        },
        {
          name: 'projectName',
          label: 'Nome do Projeto',
          type: 'text',
          required: true,
          placeholder: 'Ex: Projeto Carajás - Mina de Ferro',
          gridColumn: '1',
        },
        {
          name: 'location',
          label: 'Localização',
          type: 'text',
          required: true,
          placeholder: 'Ex: Pará, Brasil | Coordenadas: -6.0°, -50.0°',
          gridColumn: '2',
        },
      ],
    },
    {
      title: 'Competent Person Requirements',
      description: 'SAMREC-specific requirements for Competent Person',
      fields: [
        {
          name: 'competentPersonName',
          label: 'Competent Person Name',
          type: 'text',
          required: true,
          placeholder: 'Nome completo do profissional competente',
          gridColumn: '1',
        },
        {
          name: 'sacnaspRegistration',
          label: 'SACNASP Registration Number',
          type: 'text',
          required: true,
          placeholder: 'Número de registro SACNASP',
          helpText: 'South African Council for Natural Scientific Professions registration',
          gridColumn: '2',
        },
        {
          name: 'professionalExperience',
          label: 'Professional Experience',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva a experiência profissional relevante...',
          helpText: 'Minimum 5 years of relevant experience required',
          gridColumn: 'full',
        },
      ],
    },
    {
      title: 'Mineral Resources',
      fields: [
        {
          name: 'commodity',
          label: 'Commodity',
          type: 'text',
          required: true,
          placeholder: 'Ex: Ferro, Ouro, Cobre',
          gridColumn: '1',
        },
        {
          name: 'resourceTonnes',
          label: 'Recurso (toneladas)',
          type: 'number',
          required: true,
          placeholder: 'Ex: 1000000',
          gridColumn: '1',
        },
        {
          name: 'grade',
          label: 'Teor Médio (%)',
          type: 'number',
          required: true,
          placeholder: 'Ex: 2.5',
          gridColumn: '2',
        },
        {
          name: 'resourceCategory',
          label: 'Resource Category',
          type: 'select',
          required: true,
          options: [
            { value: 'inferred', label: 'Inferred' },
            { value: 'indicated', label: 'Indicated' },
            { value: 'measured', label: 'Measured' },
          ],
          gridColumn: '2',
        },
      ],
    },
    {
      title: 'Descrição do Projeto',
      fields: [
        {
          name: 'description',
          label: 'Descrição do Projeto',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva brevemente o projeto, objetivos e principais características...',
          gridColumn: 'full',
        },
      ],
    },
  ],
};

/**
 * Get schema by standard code
 */
export function getSchemaByStandard(standardCode: string): StandardSchema {
  const schemas: Record<string, StandardSchema> = {
    'JORC_2012': JORC_SCHEMA,
    'NI_43_101': NI43101_SCHEMA,
    'PERC': PERC_SCHEMA,
    'SAMREC': SAMREC_SCHEMA,
  };

  return schemas[standardCode] || JORC_SCHEMA; // Default to JORC
}

/**
 * Get all available standards
 */
export function getAllStandards(): Array<{ code: string; name: string; description: string }> {
  return [
    { code: 'JORC_2012', name: 'JORC 2012', description: 'Australasia' },
    { code: 'NI_43_101', name: 'NI 43-101', description: 'Canadá' },
    { code: 'PERC', name: 'PERC', description: 'Europa' },
    { code: 'SAMREC', name: 'SAMREC', description: 'África do Sul' },
  ];
}


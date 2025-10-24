/**
 * Expanded Standard-specific field schemas
 * Comprehensive field definitions for each reporting standard
 */

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  gridColumn?: '1' | '2' | 'full';
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
 * JORC 2012 Schema (EXPANDED)
 * Based on JORC Code 2012 Table 1 - All 5 Sections
 */
export const JORC_SCHEMA_EXPANDED: StandardSchema = {
  code: 'JORC_2012',
  name: 'JORC 2012',
  description: 'Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves',
  sections: [
    // Informações Básicas
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
        {
          name: 'effectiveDate',
          label: 'Data Efetiva',
          type: 'date',
          required: true,
          helpText: 'Data de referência do relatório',
          gridColumn: '1',
        },
      ],
    },

    // Section 1: Sampling Techniques and Data
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
          helpText: 'Nature and quality of sampling (e.g., cut channels, random chips, sawn or half core)',
          gridColumn: 'full',
        },
        {
          name: 'drillingTechniques',
          label: 'Drilling Techniques',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva as técnicas de perfuração...',
          helpText: 'Drill type (e.g., core, reverse circulation, open-hole hammer, rotary air blast, auger, Bangka, sonic, etc.) and details',
          gridColumn: 'full',
        },
        {
          name: 'drillSampleRecovery',
          label: 'Drill Sample Recovery',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva a recuperação de amostras...',
          helpText: 'Method of recording and assessing core and chip sample recoveries and results assessed',
          gridColumn: 'full',
        },
        {
          name: 'logging',
          label: 'Logging',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva os procedimentos de logging...',
          helpText: 'Whether core and chip samples have been geologically and geotechnically logged to a level of detail to support appropriate Mineral Resource estimation, mining studies and metallurgical studies',
          gridColumn: 'full',
        },
        {
          name: 'subSampling',
          label: 'Sub-sampling Techniques and Sample Preparation',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva técnicas de sub-amostragem...',
          helpText: 'If core, whether cut or sawn and whether quarter, half or all core taken. If non-core, whether riffled, tube sampled, rotary split, etc.',
          gridColumn: 'full',
        },
        {
          name: 'qualityOfAssayData',
          label: 'Quality of Assay Data and Laboratory Tests',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva procedimentos de QA/QC...',
          helpText: 'The nature, quality and appropriateness of the assaying and laboratory procedures used and whether the technique is considered partial or total',
          gridColumn: 'full',
        },
        {
          name: 'verification',
          label: 'Verification of Sampling and Assaying',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva procedimentos de verificação...',
          helpText: 'The verification of significant intersections by either independent or alternative company personnel',
          gridColumn: 'full',
        },
        {
          name: 'locationOfDataPoints',
          label: 'Location of Data Points',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva sistema de coordenadas e precisão...',
          helpText: 'Accuracy and quality of surveys used to locate drill holes (collar and down-hole surveys), trenches, mine workings and other locations used in Mineral Resource estimation',
          gridColumn: 'full',
        },
        {
          name: 'dataSpacing',
          label: 'Data Spacing and Distribution',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva espaçamento de furos e distribuição...',
          helpText: 'Data spacing for reporting of Exploration Results. Whether the data spacing and distribution is sufficient to establish the degree of geological and grade continuity',
          gridColumn: 'full',
        },
        {
          name: 'orientationOfData',
          label: 'Orientation of Data in Relation to Geological Structure',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva orientação dos dados em relação à geologia...',
          helpText: 'Whether sample compositing has been applied. Whether the orientation of sampling achieves unbiased sampling of possible structures',
          gridColumn: 'full',
        },
        {
          name: 'sampleSecurity',
          label: 'Sample Security',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva medidas de segurança das amostras...',
          helpText: 'The measures taken to ensure sample security',
          gridColumn: 'full',
        },
        {
          name: 'auditsOrReviews',
          label: 'Audits or Reviews',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva auditorias realizadas...',
          helpText: 'The results of any audits or reviews of sampling techniques and data',
          gridColumn: 'full',
        },
      ],
    },

    // Section 2: Reporting of Exploration Results
    {
      title: 'Section 2: Reporting of Exploration Results',
      description: 'Criteria for reporting Exploration Results',
      fields: [
        {
          name: 'mineralTenementStatus',
          label: 'Mineral Tenement and Land Tenure Status',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva status de propriedade e licenças...',
          helpText: 'Type, reference name/number, location and ownership including agreements or material issues with third parties',
          gridColumn: 'full',
        },
        {
          name: 'explorationDone',
          label: 'Exploration Done by Other Parties',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva trabalhos anteriores...',
          helpText: 'Acknowledgment and appraisal of exploration by other parties',
          gridColumn: 'full',
        },
        {
          name: 'geology',
          label: 'Geology',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva contexto geológico...',
          helpText: 'Deposit type, geological setting and style of mineralisation',
          gridColumn: 'full',
        },
        {
          name: 'drillHoleInformation',
          label: 'Drill Hole Information',
          type: 'textarea',
          required: true,
          placeholder: 'Resumo de furos de sondagem...',
          helpText: 'A summary of all information material to the understanding of the exploration results including tabulation of the following information for all Material drill holes',
          gridColumn: 'full',
        },
        {
          name: 'dataAggregation',
          label: 'Data Aggregation Methods',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva métodos de agregação...',
          helpText: 'In reporting Exploration Results, weighting averaging techniques, maximum and/or minimum grade truncations and cut-off grades are usually Material',
          gridColumn: 'full',
        },
        {
          name: 'relationshipBetweenMineralisation',
          label: 'Relationship between Mineralisation Widths and Intercept Lengths',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva relação entre espessuras...',
          helpText: 'These relationships are particularly important in the reporting of Exploration Results',
          gridColumn: 'full',
        },
        {
          name: 'diagrams',
          label: 'Diagrams',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva diagramas incluídos...',
          helpText: 'Appropriate maps and sections (with scales) and tabulations of intercepts should be included for any significant discovery',
          gridColumn: 'full',
        },
        {
          name: 'balancedReporting',
          label: 'Balanced Reporting',
          type: 'textarea',
          required: false,
          placeholder: 'Comente sobre reporte balanceado...',
          helpText: 'Where comprehensive reporting of all Exploration Results is not practicable, representative reporting of both low and high grades and/or widths should be practiced',
          gridColumn: 'full',
        },
        {
          name: 'otherSubstantiveData',
          label: 'Other Substantive Exploration Data',
          type: 'textarea',
          required: false,
          placeholder: 'Outros dados relevantes...',
          helpText: 'Other exploration data, if meaningful and material, should be reported including (but not limited to): geological observations; geophysical survey results; geochemical survey results',
          gridColumn: 'full',
        },
        {
          name: 'furtherWork',
          label: 'Further Work',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva trabalhos futuros planejados...',
          helpText: 'The nature and scale of planned further work (e.g. tests for lateral extensions or depth extensions or large-scale step-out drilling)',
          gridColumn: 'full',
        },
      ],
    },

    // Section 3: Estimation and Reporting of Mineral Resources
    {
      title: 'Section 3: Estimation and Reporting of Mineral Resources',
      description: 'Criteria for Mineral Resource estimation',
      fields: [
        {
          name: 'databaseIntegrity',
          label: 'Database Integrity',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva medidas de integridade do banco de dados...',
          helpText: 'Measures taken to ensure that data has not been corrupted by, for example, transcription or keying errors',
          gridColumn: 'full',
        },
        {
          name: 'siteVisits',
          label: 'Site Visits',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva visitas ao site pela Pessoa Competente...',
          helpText: 'Comment on any site visits undertaken by the Competent Person and the outcome of those visits',
          gridColumn: 'full',
        },
        {
          name: 'geologicalInterpretation',
          label: 'Geological Interpretation',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva interpretação geológica...',
          helpText: 'Confidence in (or conversely, the uncertainty of) the geological interpretation of the mineral deposit',
          gridColumn: 'full',
        },
        {
          name: 'dimensions',
          label: 'Dimensions',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva dimensões do depósito...',
          helpText: 'The extent and variability of the Mineral Resource expressed as length (along strike or otherwise), plan width, and depth below surface to the upper and lower limits of the Mineral Resource',
          gridColumn: 'full',
        },
        {
          name: 'estimationTechniques',
          label: 'Estimation and Modelling Techniques',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva técnicas de estimativa utilizadas...',
          helpText: 'The nature and appropriateness of the estimation technique(s) applied and key assumptions, including treatment of extreme grade values, domaining, interpolation parameters and maximum distance of extrapolation from data points',
          gridColumn: 'full',
        },
        {
          name: 'moisture',
          label: 'Moisture',
          type: 'select',
          required: true,
          options: [
            { value: 'dry', label: 'Dry tonnage' },
            { value: 'wet', label: 'Wet tonnage' },
          ],
          helpText: 'Whether the tonnages are estimated on a dry basis or with natural moisture',
          gridColumn: '1',
        },
        {
          name: 'cutOffParameters',
          label: 'Cut-off Parameters',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva parâmetros de teor de corte...',
          helpText: 'The basis of the adopted cut-off grade(s) or quality parameters applied',
          gridColumn: 'full',
        },
        {
          name: 'miningFactors',
          label: 'Mining Factors or Assumptions',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva premissas de mineração...',
          helpText: 'Assumptions made regarding possible mining methods, minimum mining dimensions and internal (or, if applicable, external) mining dilution',
          gridColumn: 'full',
        },
        {
          name: 'metallurgicalFactors',
          label: 'Metallurgical Factors or Assumptions',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva premissas metalúrgicas...',
          helpText: 'The basis for assumptions or predictions regarding metallurgical amenability',
          gridColumn: 'full',
        },
        {
          name: 'environmentalFactors',
          label: 'Environmental Factors or Assumptions',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva fatores ambientais...',
          helpText: 'Assumptions made regarding possible waste and process residue disposal options',
          gridColumn: 'full',
        },
        {
          name: 'bulkDensity',
          label: 'Bulk Density',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva determinação de densidade...',
          helpText: 'Whether assumed or determined. If assumed, the basis for the assumptions. If determined, the method used',
          gridColumn: 'full',
        },
        {
          name: 'classification',
          label: 'Classification',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva critérios de classificação...',
          helpText: 'The basis for the classification of the Mineral Resources into varying confidence categories',
          gridColumn: 'full',
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
          gridColumn: '1',
        },
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
          name: 'auditsOrReviewsResources',
          label: 'Audits or Reviews',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva auditorias da estimativa...',
          helpText: 'The results of any audits or reviews of Mineral Resource estimates',
          gridColumn: 'full',
        },
        {
          name: 'discussionOfRelativeAccuracy',
          label: 'Discussion of Relative Accuracy/Confidence',
          type: 'textarea',
          required: true,
          placeholder: 'Discuta precisão e confiança da estimativa...',
          helpText: 'Where appropriate a statement of the relative accuracy and confidence level in the Mineral Resource estimate using an approach or procedure deemed appropriate by the Competent Person',
          gridColumn: 'full',
        },
      ],
    },

    // Section 4: Estimation and Reporting of Ore Reserves
    {
      title: 'Section 4: Estimation and Reporting of Ore Reserves',
      description: 'Criteria for Ore Reserve estimation (if applicable)',
      fields: [
        {
          name: 'mineralResourceEstimate',
          label: 'Mineral Resource Estimate for Conversion to Ore Reserves',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva estimativa de recurso base...',
          helpText: 'Description of the Mineral Resource estimate used as a basis for the conversion to an Ore Reserve',
          gridColumn: 'full',
        },
        {
          name: 'siteVisitsReserves',
          label: 'Site Visits',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva visitas ao site...',
          helpText: 'Comment on any site visits undertaken by the Competent Person and the outcome of those visits',
          gridColumn: 'full',
        },
        {
          name: 'studyStatus',
          label: 'Study Status',
          type: 'select',
          required: false,
          options: [
            { value: 'prefeasibility', label: 'Pre-Feasibility Study' },
            { value: 'feasibility', label: 'Feasibility Study' },
            { value: 'operational', label: 'Operational Mine' },
          ],
          helpText: 'The type and level of study undertaken to enable Mineral Resources to be converted to Ore Reserves',
          gridColumn: '1',
        },
        {
          name: 'cutOffParametersReserves',
          label: 'Cut-off Parameters',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva parâmetros de teor de corte para reservas...',
          helpText: 'The basis of the cut-off grade(s) or quality parameters applied',
          gridColumn: 'full',
        },
        {
          name: 'miningFactorsReserves',
          label: 'Mining Factors or Assumptions',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva método de mineração e premissas...',
          helpText: 'The method and assumptions used as reported in the Pre-Feasibility or Feasibility Study to convert the Mineral Resource to an Ore Reserve',
          gridColumn: 'full',
        },
        {
          name: 'metallurgicalFactorsReserves',
          label: 'Metallurgical Factors or Assumptions',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva premissas metalúrgicas...',
          helpText: 'The metallurgical process proposed and the appropriateness of that process to the style of mineralisation',
          gridColumn: 'full',
        },
        {
          name: 'environmentalReserves',
          label: 'Environmental',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva status de licenciamento ambiental...',
          helpText: 'The status of studies of potential environmental impacts of the mining and processing operation',
          gridColumn: 'full',
        },
        {
          name: 'infrastructure',
          label: 'Infrastructure',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva infraestrutura existente e planejada...',
          helpText: 'The existence of appropriate infrastructure: availability of land for plant development, power, water, transportation, labour, accommodation',
          gridColumn: 'full',
        },
        {
          name: 'costs',
          label: 'Costs',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva base de custos...',
          helpText: 'The derivation of, or assumptions made, regarding projected capital costs in the study',
          gridColumn: 'full',
        },
        {
          name: 'revenueFactors',
          label: 'Revenue Factors',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva premissas de receita...',
          helpText: 'The derivation of, or assumptions made regarding revenue factors including head grade, metal or commodity price(s) exchange rates, transportation and treatment charges, penalties, net smelter returns, etc.',
          gridColumn: 'full',
        },
        {
          name: 'marketAssessment',
          label: 'Market Assessment',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva avaliação de mercado...',
          helpText: 'The demand, supply and stock situation for the particular commodity, consumption trends and factors likely to affect supply and demand into the future',
          gridColumn: 'full',
        },
        {
          name: 'economicReserves',
          label: 'Economic',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva análise econômica...',
          helpText: 'The inputs to the economic analysis to produce the net present value (NPV) in the study, the source and confidence of these economic inputs including estimated inflation, discount rate, etc.',
          gridColumn: 'full',
        },
        {
          name: 'socialReserves',
          label: 'Social',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva aspectos sociais...',
          helpText: 'The status of agreements with key stakeholders and matters leading to social licence to operate',
          gridColumn: 'full',
        },
        {
          name: 'otherReserves',
          label: 'Other',
          type: 'textarea',
          required: false,
          placeholder: 'Outros fatores relevantes...',
          helpText: 'To the extent relevant, the impact of the following on the project and/or on the estimation and classification of the Ore Reserves',
          gridColumn: 'full',
        },
        {
          name: 'classificationReserves',
          label: 'Classification',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva classificação de reservas...',
          helpText: 'The basis for the classification of the Ore Reserves into varying confidence categories',
          gridColumn: 'full',
        },
        {
          name: 'reserveCategory',
          label: 'Reserve Category',
          type: 'select',
          required: false,
          options: [
            { value: 'probable', label: 'Probable' },
            { value: 'proved', label: 'Proved' },
          ],
          gridColumn: '1',
        },
        {
          name: 'auditsOrReviewsReserves',
          label: 'Audits or Reviews',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva auditorias...',
          helpText: 'The results of any audits or reviews of Ore Reserve estimates',
          gridColumn: 'full',
        },
        {
          name: 'discussionOfRelativeAccuracyReserves',
          label: 'Discussion of Relative Accuracy/Confidence',
          type: 'textarea',
          required: false,
          placeholder: 'Discuta precisão da estimativa de reservas...',
          helpText: 'Where appropriate a statement of the relative accuracy and confidence level in the Ore Reserve estimate using an approach or procedure deemed appropriate by the Competent Person',
          gridColumn: 'full',
        },
      ],
    },

    // Descrição do Projeto
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
 * NI 43-101 Schema (EXPANDED)
 * Based on Canadian NI 43-101 Standards - All 27 Items
 */
export const NI_43_101_SCHEMA_EXPANDED: StandardSchema = {
  code: 'NI_43_101',
  name: 'NI 43-101',
  description: 'Canadian National Instrument 43-101 Standards of Disclosure for Mineral Projects',
  sections: [
    // Informações Básicas
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
        {
          name: 'effectiveDate',
          label: 'Data Efetiva',
          type: 'date',
          required: true,
          helpText: 'Data de referência do relatório',
          gridColumn: '1',
        },
      ],
    },

    // Item 4: Property Description and Location
    {
      title: 'Item 4: Property Description and Location',
      description: 'Description of the mineral property and its location',
      fields: [
        {
          name: 'propertyDescription',
          label: 'Property Description',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva área, limites e natureza da propriedade...',
          helpText: 'Area, boundaries, and nature of the property',
          gridColumn: 'full',
        },
        {
          name: 'accessibility',
          label: 'Accessibility',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva proximidade a centros urbanos, acessos, clima...',
          helpText: 'Proximity to population centers, means of access, climate, and operating season',
          gridColumn: 'full',
        },
        {
          name: 'physiography',
          label: 'Physiography',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva topografia, elevação, vegetação...',
          helpText: 'Topography, elevation, and vegetation',
          gridColumn: 'full',
        },
      ],
    },

    // Item 5: History
    {
      title: 'Item 5: History',
      description: 'Previous exploration, development, and production history',
      fields: [
        {
          name: 'explorationHistory',
          label: 'Exploration History',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva trabalhos de exploração anteriores...',
          helpText: 'Previous exploration work and results',
          gridColumn: 'full',
        },
        {
          name: 'productionHistory',
          label: 'Production History',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva histórico de produção (se aplicável)...',
          helpText: 'Previous production from the property',
          gridColumn: 'full',
        },
      ],
    },

    // Item 6: Geological Setting and Mineralization
    {
      title: 'Item 6: Geological Setting and Mineralization',
      description: 'Regional and local geology',
      fields: [
        {
          name: 'regionalGeology',
          label: 'Regional Geology',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva geologia regional...',
          helpText: 'Regional geological setting',
          gridColumn: 'full',
        },
        {
          name: 'localGeology',
          label: 'Local Geology',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva geologia local...',
          helpText: 'Local geological setting and style of mineralization',
          gridColumn: 'full',
        },
        {
          name: 'mineralization',
          label: 'Mineralization',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva tipo e estilo de mineralização...',
          helpText: 'Deposit type and style of mineralization',
          gridColumn: 'full',
        },
      ],
    },

    // Item 7: Deposit Types
    {
      title: 'Item 7: Deposit Types',
      fields: [
        {
          name: 'depositType',
          label: 'Deposit Type',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva tipo de depósito mineral...',
          helpText: 'The geological characteristics of the deposit type',
          gridColumn: 'full',
        },
      ],
    },

    // Item 8: Exploration
    {
      title: 'Item 8: Exploration',
      fields: [
        {
          name: 'explorationMethods',
          label: 'Exploration Methods',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva métodos de exploração utilizados...',
          helpText: 'Nature and extent of all relevant exploration work carried out',
          gridColumn: 'full',
        },
      ],
    },

    // Item 9: Drilling
    {
      title: 'Item 9: Drilling',
      fields: [
        {
          name: 'drillingType',
          label: 'Drilling Type and Extent',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva tipo e extensão da perfuração...',
          helpText: 'Type, nature, and extent of drilling (core, reverse circulation, etc.)',
          gridColumn: 'full',
        },
        {
          name: 'drillingProcedures',
          label: 'Drilling Procedures',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva procedimentos de perfuração...',
          helpText: 'Procedures for drill hole collar surveying and down-hole surveying',
          gridColumn: 'full',
        },
      ],
    },

    // Item 10: Sample Preparation, Analyses and Security
    {
      title: 'Item 10: Sample Preparation, Analyses and Security',
      fields: [
        {
          name: 'samplePreparation',
          label: 'Sample Preparation',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva métodos de preparação de amostras...',
          helpText: 'Sample preparation methods and quality control procedures',
          gridColumn: 'full',
        },
        {
          name: 'analysisMethod',
          label: 'Analysis Method',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva métodos analíticos...',
          helpText: 'Analytical and testing procedures used',
          gridColumn: 'full',
        },
        {
          name: 'sampleSecurity',
          label: 'Sample Security',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva medidas de segurança das amostras...',
          helpText: 'Sample security measures',
          gridColumn: 'full',
        },
      ],
    },

    // Item 11: Data Verification
    {
      title: 'Item 11: Data Verification',
      fields: [
        {
          name: 'dataVerification',
          label: 'Data Verification',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva procedimentos de verificação de dados...',
          helpText: 'Procedures for verifying data, including quality assurance and quality control measures',
          gridColumn: 'full',
        },
      ],
    },

    // Item 12: Mineral Processing and Metallurgical Testing
    {
      title: 'Item 12: Mineral Processing and Metallurgical Testing',
      fields: [
        {
          name: 'metallurgicalTesting',
          label: 'Metallurgical Testing',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva testes metalúrgicos realizados...',
          helpText: 'Nature and extent of metallurgical testing and results',
          gridColumn: 'full',
        },
      ],
    },

    // Item 13: Mineral Resource Estimates
    {
      title: 'Item 13: Mineral Resource Estimates',
      fields: [
        {
          name: 'resourceEstimationMethod',
          label: 'Resource Estimation Method',
          type: 'textarea',
          required: true,
          placeholder: 'Descreva método de estimativa de recursos...',
          helpText: 'Methods and parameters for estimating Mineral Resources',
          gridColumn: 'full',
        },
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

    // Item 14: Mineral Reserve Estimates
    {
      title: 'Item 14: Mineral Reserve Estimates',
      fields: [
        {
          name: 'reserveEstimationMethod',
          label: 'Reserve Estimation Method',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva método de estimativa de reservas...',
          helpText: 'Methods and parameters for estimating Mineral Reserves',
          gridColumn: 'full',
        },
        {
          name: 'reserveCategory',
          label: 'Reserve Category',
          type: 'select',
          required: false,
          options: [
            { value: 'probable', label: 'Probable' },
            { value: 'proven', label: 'Proven' },
          ],
          gridColumn: '1',
        },
      ],
    },

    // Item 15: Mining Methods
    {
      title: 'Item 15: Mining Methods',
      fields: [
        {
          name: 'miningMethod',
          label: 'Mining Method',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva método de mineração proposto...',
          helpText: 'Proposed mining method (open pit, underground, etc.)',
          gridColumn: 'full',
        },
      ],
    },

    // Item 16: Recovery Methods
    {
      title: 'Item 16: Recovery Methods',
      fields: [
        {
          name: 'recoveryMethod',
          label: 'Recovery Method',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva método de recuperação/processamento...',
          helpText: 'Proposed recovery/processing method',
          gridColumn: 'full',
        },
      ],
    },

    // Item 17: Project Infrastructure
    {
      title: 'Item 17: Project Infrastructure',
      fields: [
        {
          name: 'infrastructure',
          label: 'Infrastructure',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva infraestrutura existente e necessária...',
          helpText: 'Requirements for infrastructure (power, water, transportation, etc.)',
          gridColumn: 'full',
        },
      ],
    },

    // Item 18: Market Studies and Contracts
    {
      title: 'Item 18: Market Studies and Contracts',
      fields: [
        {
          name: 'marketStudies',
          label: 'Market Studies',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva estudos de mercado...',
          helpText: 'Market studies, contracts, and marketing arrangements',
          gridColumn: 'full',
        },
      ],
    },

    // Item 19: Environmental Studies, Permitting and Social Impact
    {
      title: 'Item 19: Environmental Studies, Permitting and Social Impact',
      fields: [
        {
          name: 'environmentalStudies',
          label: 'Environmental Studies',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva estudos ambientais...',
          helpText: 'Environmental studies and baseline data',
          gridColumn: 'full',
        },
        {
          name: 'permittingStatus',
          label: 'Permitting Status',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva status de licenciamento...',
          helpText: 'Status of environmental permitting',
          gridColumn: 'full',
        },
        {
          name: 'socialImpact',
          label: 'Social Impact',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva impactos sociais...',
          helpText: 'Social and community impact considerations',
          gridColumn: 'full',
        },
      ],
    },

    // Item 20: Capital and Operating Costs
    {
      title: 'Item 20: Capital and Operating Costs',
      fields: [
        {
          name: 'capitalCosts',
          label: 'Capital Costs',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva custos de capital...',
          helpText: 'Initial and sustaining capital cost estimates',
          gridColumn: 'full',
        },
        {
          name: 'operatingCosts',
          label: 'Operating Costs',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva custos operacionais...',
          helpText: 'Operating cost estimates',
          gridColumn: 'full',
        },
      ],
    },

    // Item 21: Economic Analysis
    {
      title: 'Item 21: Economic Analysis',
      fields: [
        {
          name: 'economicAnalysis',
          label: 'Economic Analysis',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva análise econômica (NPV, IRR, payback)...',
          helpText: 'Economic analysis including NPV, IRR, and payback period',
          gridColumn: 'full',
        },
      ],
    },

    // Item 22: Adjacent Properties
    {
      title: 'Item 22: Adjacent Properties',
      fields: [
        {
          name: 'adjacentProperties',
          label: 'Adjacent Properties',
          type: 'textarea',
          required: false,
          placeholder: 'Descreva propriedades adjacentes relevantes...',
          helpText: 'Information on adjacent properties if relevant',
          gridColumn: 'full',
        },
      ],
    },

    // Item 23: Other Relevant Data and Information
    {
      title: 'Item 23: Other Relevant Data and Information',
      fields: [
        {
          name: 'otherRelevantData',
          label: 'Other Relevant Data',
          type: 'textarea',
          required: false,
          placeholder: 'Outros dados relevantes...',
          helpText: 'Any other relevant data and information',
          gridColumn: 'full',
        },
      ],
    },

    // Item 24: Interpretation and Conclusions
    {
      title: 'Item 24: Interpretation and Conclusions',
      fields: [
        {
          name: 'interpretationAndConclusions',
          label: 'Interpretation and Conclusions',
          type: 'textarea',
          required: true,
          placeholder: 'Interpretação e conclusões...',
          helpText: 'Summary of key findings and conclusions',
          gridColumn: 'full',
        },
      ],
    },

    // Item 25: Recommendations
    {
      title: 'Item 25: Recommendations',
      fields: [
        {
          name: 'recommendations',
          label: 'Recommendations',
          type: 'textarea',
          required: true,
          placeholder: 'Recomendações para trabalhos futuros...',
          helpText: 'Recommendations for further work',
          gridColumn: 'full',
        },
      ],
    },

    // Descrição do Projeto
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

// Export function to get schema by standard code
export function getSchemaByStandard(standardCode: string): StandardSchema {
  switch (standardCode) {
    case 'JORC_2012':
      return JORC_SCHEMA_EXPANDED;
    case 'NI_43_101':
      return NI_43_101_SCHEMA_EXPANDED;
    // PERC and SAMREC can use the original schemas for now
    default:
      return JORC_SCHEMA_EXPANDED;
  }
}

export function getAllStandards() {
  return [
    { code: 'JORC_2012', name: 'JORC 2012', description: 'Australasia' },
    { code: 'NI_43_101', name: 'NI 43-101', description: 'Canadá' },
    { code: 'PERC', name: 'PERC', description: 'Europa' },
    { code: 'SAMREC', name: 'SAMREC', description: 'África do Sul' },
  ];
}


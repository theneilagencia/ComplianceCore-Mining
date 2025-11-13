/**
 * Brazilian Regulatory Compliance Fields
 * Campos específicos para conformidade com órgãos reguladores brasileiros
 * 
 * Órgãos:
 * - ANM (Agência Nacional de Mineração)
 * - CPRM (Serviço Geológico do Brasil)
 * - IBAMA (Instituto Brasileiro do Meio Ambiente)
 * - ANP (Agência Nacional do Petróleo, Gás Natural e Biocombustíveis)
 * - ANA (Agência Nacional de Águas)
 * - FUNAI (Fundação Nacional dos Povos Indígenas)
 */

import { FieldDefinition } from './standardSchemasExpanded';

export interface BrazilianComplianceSection {
  title: string;
  description: string;
  fields: FieldDefinition[];
}

/**
 * Brazilian Regulatory Compliance Section
 * Para ser adicionada a JORC, NI 43-101, PERC, SAMREC, CRIRSCO
 */
export const BRAZILIAN_COMPLIANCE_SECTION: BrazilianComplianceSection = {
  title: 'Conformidade Regulatória Brasileira',
  description: 'Informações específicas para conformidade com órgãos reguladores brasileiros (ANM, CPRM, IBAMA, ANP, ANA, FUNAI)',
  fields: [
    // ==================== ANM ====================
    {
      name: 'anm_processNumber',
      label: 'Número do Processo ANM',
      type: 'text',
      required: false,
      placeholder: 'Ex: 48226.800153/2023',
      helpText: 'Formato: XXXXX.XXXXXX/XXXX. Número do processo de autorização/concessão da ANM',
      gridColumn: '1',
    },
    {
      name: 'anm_processPhase',
      label: 'Fase do Processo ANM',
      type: 'select',
      required: false,
      helpText: 'Fase atual do processo minerário na ANM',
      options: [
        { value: 'AUTORIZACAO_PESQUISA', label: 'Autorização de Pesquisa' },
        { value: 'CONCESSAO_LAVRA', label: 'Concessão de Lavra' },
        { value: 'LICENCIAMENTO', label: 'Licenciamento' },
        { value: 'REGISTRO_EXTRACAO', label: 'Registro de Extração' },
        { value: 'PERMISSAO_LAVRA_GARIMPEIRA', label: 'Permissão de Lavra Garimpeira' },
        { value: 'MANIFESTO_MINA', label: 'Manifesto de Mina' },
      ],
      gridColumn: '2',
    },
    {
      name: 'anm_dnpmCode',
      label: 'Código DNPM (Legado)',
      type: 'text',
      required: false,
      placeholder: 'Ex: 800.153/2010',
      helpText: 'Código antigo do DNPM, se aplicável (processos anteriores a 2018)',
      gridColumn: '1',
    },
    {
      name: 'anm_holderName',
      label: 'Titular do Direito Minerário',
      type: 'text',
      required: false,
      placeholder: 'Ex: Mineradora ABC Ltda',
      helpText: 'Razão social do titular do processo ANM',
      gridColumn: '2',
    },
    {
      name: 'anm_holderCpfCnpj',
      label: 'CPF/CNPJ do Titular',
      type: 'text',
      required: false,
      placeholder: 'Ex: 12.345.678/0001-99',
      helpText: 'CPF ou CNPJ do titular do direito minerário',
      gridColumn: '1',
    },
    {
      name: 'anm_miningArea_ha',
      label: 'Área Requerida/Concedida (ha)',
      type: 'number',
      required: false,
      placeholder: 'Ex: 1234.56',
      helpText: 'Área total em hectares conforme processo ANM',
      gridColumn: '2',
    },
    {
      name: 'anm_cfemValue',
      label: 'CFEM Anual Estimada (R$)',
      type: 'number',
      required: false,
      placeholder: 'Ex: 500000.00',
      helpText: 'Compensação Financeira pela Exploração Mineral (valor anual estimado)',
      gridColumn: '1',
    },
    {
      name: 'anm_cfemPercentage',
      label: 'Alíquota CFEM (%)',
      type: 'select',
      required: false,
      helpText: 'Alíquota de CFEM conforme Lei 13.540/2017',
      options: [
        { value: '0.2', label: '0,2% - Ouro' },
        { value: '1.0', label: '1,0% - Diamante' },
        { value: '1.5', label: '1,5% - Alumínio, manganês, sal-gema, potássio' },
        { value: '2.0', label: '2,0% - Ferro, fertilizantes, carvão' },
        { value: '3.0', label: '3,0% - Bauxita, níquel, demais substâncias' },
        { value: '4.0', label: '4,0% - Pedras preciosas, pedras coradas, carbonados' },
      ],
      gridColumn: '2',
    },
    {
      name: 'anm_paeStatus',
      label: 'Status PAE (Plano de Aproveitamento Econômico)',
      type: 'select',
      required: false,
      helpText: 'Status do PAE exigido para concessão de lavra',
      options: [
        { value: 'NAO_APLICAVEL', label: 'Não Aplicável' },
        { value: 'EM_ELABORACAO', label: 'Em Elaboração' },
        { value: 'PROTOCOLADO', label: 'Protocolado' },
        { value: 'APROVADO', label: 'Aprovado' },
        { value: 'PENDENTE_CORRECOES', label: 'Pendente de Correções' },
      ],
      gridColumn: 'full',
    },

    // ==================== IBAMA ====================
    {
      name: 'ibama_licenseNumber',
      label: 'Número da Licença Ambiental IBAMA',
      type: 'text',
      required: false,
      placeholder: 'Ex: 123456/2023',
      helpText: 'Formato: XXXXXX/XXXX. Licença ambiental federal (se aplicável)',
      gridColumn: '1',
    },
    {
      name: 'ibama_licenseType',
      label: 'Tipo de Licença IBAMA',
      type: 'select',
      required: false,
      helpText: 'Tipo de licença ambiental federal',
      options: [
        { value: 'LP', label: 'LP - Licença Prévia' },
        { value: 'LI', label: 'LI - Licença de Instalação' },
        { value: 'LO', label: 'LO - Licença de Operação' },
        { value: 'LA', label: 'LA - Licença por Adesão e Compromisso' },
      ],
      gridColumn: '2',
    },
    {
      name: 'ibama_licenseValidity',
      label: 'Validade da Licença IBAMA',
      type: 'date',
      required: false,
      helpText: 'Data de validade da licença ambiental',
      gridColumn: '1',
    },
    {
      name: 'ibama_environmentalStudy',
      label: 'Estudo Ambiental Realizado',
      type: 'select',
      required: false,
      helpText: 'Tipo de estudo ambiental apresentado ao IBAMA',
      options: [
        { value: 'EIA_RIMA', label: 'EIA/RIMA - Estudo e Relatório de Impacto Ambiental' },
        { value: 'RCA', label: 'RCA - Relatório de Controle Ambiental' },
        { value: 'PCA', label: 'PCA - Plano de Controle Ambiental' },
        { value: 'PRAD', label: 'PRAD - Plano de Recuperação de Área Degradada' },
        { value: 'EAS', label: 'EAS - Estudo Ambiental Simplificado' },
      ],
      gridColumn: '2',
    },
    {
      name: 'ibama_compensationArea_ha',
      label: 'Área de Compensação Ambiental (ha)',
      type: 'number',
      required: false,
      placeholder: 'Ex: 150.00',
      helpText: 'Área destinada à compensação ambiental (Lei 9.985/2000)',
      gridColumn: '1',
    },
    {
      name: 'ibama_compensationValue',
      label: 'Valor da Compensação Ambiental (R$)',
      type: 'number',
      required: false,
      placeholder: 'Ex: 1000000.00',
      helpText: 'Valor destinado à compensação ambiental (0,5% do custo total)',
      gridColumn: '2',
    },

    // ==================== Licenciamento Estadual ====================
    {
      name: 'state_environmentalLicense',
      label: 'Licença Ambiental Estadual',
      type: 'text',
      required: false,
      placeholder: 'Ex: COPAM 123/2023',
      helpText: 'Número da licença ambiental do órgão estadual (COPAM, CETESB, etc.)',
      gridColumn: '1',
    },
    {
      name: 'state_environmentalAgency',
      label: 'Órgão Ambiental Estadual',
      type: 'select',
      required: false,
      helpText: 'Órgão estadual responsável pelo licenciamento',
      options: [
        { value: 'COPAM_MG', label: 'COPAM - Minas Gerais' },
        { value: 'CETESB_SP', label: 'CETESB - São Paulo' },
        { value: 'INEA_RJ', label: 'INEA - Rio de Janeiro' },
        { value: 'IAP_PR', label: 'IAP - Paraná' },
        { value: 'FEPAM_RS', label: 'FEPAM - Rio Grande do Sul' },
        { value: 'SEMA_PA', label: 'SEMA - Pará' },
        { value: 'SEMAD_GO', label: 'SEMAD - Goiás' },
        { value: 'IMA_SC', label: 'IMA - Santa Catarina' },
        { value: 'OUTRO', label: 'Outro Órgão Estadual' },
      ],
      gridColumn: '2',
    },

    // ==================== CPRM ====================
    {
      name: 'cprm_geologicalProvince',
      label: 'Província Geológica (CPRM)',
      type: 'text',
      required: false,
      placeholder: 'Ex: Quadrilátero Ferrífero',
      helpText: 'Província geológica conforme mapeamento CPRM/SGB',
      gridColumn: '1',
    },
    {
      name: 'cprm_mineralDistrict',
      label: 'Distrito Mineral (CPRM)',
      type: 'text',
      required: false,
      placeholder: 'Ex: Distrito Ferrífero de Itabira',
      helpText: 'Distrito mineral conforme classificação CPRM',
      gridColumn: '2',
    },
    {
      name: 'cprm_geologicalMap',
      label: 'Folha Mapa Geológico CPRM',
      type: 'text',
      required: false,
      placeholder: 'Ex: SE-23-Z-C-VI (Ouro Preto)',
      helpText: 'Folha do mapa geológico do Brasil (1:100.000 ou 1:250.000)',
      gridColumn: '1',
    },
    {
      name: 'cprm_hydrogeology',
      label: 'Domínio Hidrogeológico',
      type: 'select',
      required: false,
      helpText: 'Classificação hidrogeológica conforme CPRM',
      options: [
        { value: 'POROSO', label: 'Poroso (Sedimentar)' },
        { value: 'FRATURADO', label: 'Fraturado (Cristalino)' },
        { value: 'CARSTICO', label: 'Cárstico (Carbonático)' },
      ],
      gridColumn: '2',
    },

    // ==================== ANP (Petróleo/Gás) ====================
    {
      name: 'anp_concessionNumber',
      label: 'Número da Concessão ANP',
      type: 'text',
      required: false,
      placeholder: 'Ex: BM-S-11, ES-T-19',
      helpText: 'Código do bloco exploratório ou área de concessão (apenas para petróleo/gás)',
      gridColumn: '1',
    },
    {
      name: 'anp_basin',
      label: 'Bacia Sedimentar (ANP)',
      type: 'select',
      required: false,
      helpText: 'Bacia sedimentar conforme classificação ANP',
      options: [
        { value: 'SANTOS', label: 'Santos' },
        { value: 'CAMPOS', label: 'Campos' },
        { value: 'ESPIRITO_SANTO', label: 'Espírito Santo' },
        { value: 'SERGIPE_ALAGOAS', label: 'Sergipe-Alagoas' },
        { value: 'RECONCAVO', label: 'Recôncavo' },
        { value: 'SOLIMOES', label: 'Solimões' },
        { value: 'PARANA', label: 'Paraná' },
        { value: 'PARNAIBA', label: 'Parnaíba' },
        { value: 'AMAZONAS', label: 'Amazonas' },
      ],
      gridColumn: '2',
    },
    {
      name: 'anp_concessionPhase',
      label: 'Fase da Concessão ANP',
      type: 'select',
      required: false,
      helpText: 'Fase atual da concessão de petróleo/gás',
      options: [
        { value: 'EXPLORACAO', label: 'Exploração' },
        { value: 'AVALIACAO', label: 'Avaliação' },
        { value: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
        { value: 'PRODUCAO', label: 'Produção' },
        { value: 'DESATIVACAO', label: 'Desativação' },
      ],
      gridColumn: 'full',
    },

    // ==================== ANA (Recursos Hídricos) ====================
    {
      name: 'ana_waterGrantNumber',
      label: 'Número da Outorga de Água (ANA)',
      type: 'text',
      required: false,
      placeholder: 'Ex: 12345678/2023',
      helpText: 'Número da outorga de direito de uso de recursos hídricos',
      gridColumn: '1',
    },
    {
      name: 'ana_waterVolume_m3h',
      label: 'Vazão Outorgada (m³/h)',
      type: 'number',
      required: false,
      placeholder: 'Ex: 100.00',
      helpText: 'Volume de água outorgado (metros cúbicos por hora)',
      gridColumn: '2',
    },
    {
      name: 'ana_waterUsePurpose',
      label: 'Finalidade do Uso da Água',
      type: 'select',
      required: false,
      helpText: 'Finalidade declarada na outorga de água',
      options: [
        { value: 'MINERACAO', label: 'Mineração (beneficiamento)' },
        { value: 'INDUSTRIAL', label: 'Uso Industrial' },
        { value: 'ABASTECIMENTO_HUMANO', label: 'Abastecimento Humano' },
        { value: 'IRRIGACAO', label: 'Irrigação' },
        { value: 'OUTROS', label: 'Outros Usos' },
      ],
      gridColumn: '1',
    },
    {
      name: 'ana_waterBody',
      label: 'Corpo Hídrico',
      type: 'text',
      required: false,
      placeholder: 'Ex: Rio Doce',
      helpText: 'Nome do rio, córrego ou aquífero utilizado',
      gridColumn: '2',
    },

    // ==================== FUNAI (Áreas Indígenas) ====================
    {
      name: 'funai_indigenousLandProximity',
      label: 'Proximidade de Terra Indígena',
      type: 'select',
      required: false,
      helpText: 'Proximidade do projeto com terras indígenas',
      options: [
        { value: 'NENHUMA', label: 'Nenhuma (> 10 km)' },
        { value: 'PROXIMA', label: 'Próxima (< 10 km)' },
        { value: 'LIMITROFE', label: 'Limítrofe (fronteira)' },
        { value: 'SOBREPOSTA', label: 'Sobreposta (requer autorização FUNAI)' },
      ],
      gridColumn: '1',
    },
    {
      name: 'funai_indigenousLandName',
      label: 'Nome da Terra Indígena',
      type: 'text',
      required: false,
      placeholder: 'Ex: TI Kayapó',
      helpText: 'Nome da terra indígena próxima ou afetada',
      gridColumn: '2',
    },
    {
      name: 'funai_consultationStatus',
      label: 'Status da Consulta Prévia',
      type: 'select',
      required: false,
      helpText: 'Status da consulta prévia, livre e informada (Convenção 169 OIT)',
      options: [
        { value: 'NAO_APLICAVEL', label: 'Não Aplicável' },
        { value: 'NAO_INICIADA', label: 'Não Iniciada' },
        { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
        { value: 'CONCLUIDA', label: 'Concluída' },
        { value: 'APROVADA', label: 'Aprovada pela Comunidade' },
      ],
      gridColumn: 'full',
    },

    // ==================== Comunidades Quilombolas ====================
    {
      name: 'quilombola_proximityStatus',
      label: 'Proximidade de Território Quilombola',
      type: 'select',
      required: false,
      helpText: 'Proximidade do projeto com territórios quilombolas certificados',
      options: [
        { value: 'NENHUMA', label: 'Nenhuma (> 5 km)' },
        { value: 'PROXIMA', label: 'Próxima (< 5 km)' },
        { value: 'LIMITROFE', label: 'Limítrofe' },
        { value: 'SOBREPOSTA', label: 'Sobreposta (requer consulta)' },
      ],
      gridColumn: '1',
    },
    {
      name: 'quilombola_communityName',
      label: 'Nome da Comunidade Quilombola',
      type: 'text',
      required: false,
      placeholder: 'Ex: Comunidade Quilombola Kalunga',
      helpText: 'Nome da comunidade quilombola certificada pela Fundação Palmares',
      gridColumn: '2',
    },

    // ==================== TAC e Conformidade ====================
    {
      name: 'tac_exists',
      label: 'Possui TAC (Termo de Ajustamento de Conduta)',
      type: 'select',
      required: false,
      helpText: 'Existência de TAC com órgãos ambientais ou MPF',
      options: [
        { value: 'NAO', label: 'Não' },
        { value: 'SIM_ATIVO', label: 'Sim - Ativo' },
        { value: 'SIM_CUMPRIDO', label: 'Sim - Cumprido' },
        { value: 'SIM_INADIMPLENTE', label: 'Sim - Inadimplente' },
      ],
      gridColumn: '1',
    },
    {
      name: 'tac_description',
      label: 'Descrição do TAC',
      type: 'textarea',
      required: false,
      placeholder: 'Descreva as obrigações do TAC...',
      helpText: 'Resumo das principais obrigações e prazos do TAC',
      gridColumn: 'full',
    },

    // ==================== Segurança de Barragens ====================
    {
      name: 'dam_exists',
      label: 'Possui Barragens de Rejeitos/Contenção',
      type: 'select',
      required: false,
      helpText: 'Existência de barragens sujeitas à Lei 12.334/2010 e Portaria ANM 70.389/2017',
      options: [
        { value: 'NAO', label: 'Não' },
        { value: 'SIM', label: 'Sim' },
        { value: 'PLANEJADA', label: 'Planejada' },
      ],
      gridColumn: '1',
    },
    {
      name: 'dam_riskCategory',
      label: 'Categoria de Risco da Barragem (CRI)',
      type: 'select',
      required: false,
      helpText: 'Categoria de Risco Integrado conforme Portaria ANM 95.344/2022',
      options: [
        { value: 'A', label: 'A - Risco Baixo' },
        { value: 'B', label: 'B - Risco Médio' },
        { value: 'C', label: 'C - Risco Alto' },
        { value: 'D', label: 'D - Risco Muito Alto' },
        { value: 'E', label: 'E - Risco Extremo' },
      ],
      gridColumn: '2',
    },
    {
      name: 'dam_damageCategory',
      label: 'Categoria de Dano Potencial (DPA)',
      type: 'select',
      required: false,
      helpText: 'Dano Potencial Associado conforme Portaria ANM',
      options: [
        { value: 'BAIXO', label: 'Baixo' },
        { value: 'MEDIO', label: 'Médio' },
        { value: 'ALTO', label: 'Alto' },
      ],
      gridColumn: '1',
    },
    {
      name: 'dam_sigbmNumber',
      label: 'Número SIGBM (Sistema de Gestão de Barragens)',
      type: 'text',
      required: false,
      placeholder: 'Ex: 31000012345',
      helpText: 'Número de cadastro no Sistema de Gestão de Barragens da ANM',
      gridColumn: '2',
    },

    // ==================== Outras Informações ====================
    {
      name: 'brazilian_additionalNotes',
      label: 'Observações Adicionais sobre Conformidade',
      type: 'textarea',
      required: false,
      placeholder: 'Adicione informações relevantes sobre licenças, autorizações pendentes, consultas públicas, etc.',
      helpText: 'Espaço livre para informações complementares sobre conformidade regulatória brasileira',
      gridColumn: 'full',
    },
  ],
};

/**
 * Exporta apenas os nomes dos campos brasileiros
 * Útil para filtros e validações
 */
export const BRAZILIAN_FIELD_NAMES = BRAZILIAN_COMPLIANCE_SECTION.fields.map(f => f.name);

/**
 * Verifica se um campo é brasileiro
 */
export function isBrazilianField(fieldName: string): boolean {
  return BRAZILIAN_FIELD_NAMES.includes(fieldName);
}

/**
 * Retorna campos brasileiros por categoria
 */
export function getBrazilianFieldsByCategory(category: 'ANM' | 'IBAMA' | 'CPRM' | 'ANP' | 'ANA' | 'FUNAI' | 'QUILOMBOLA' | 'TAC' | 'DAM' | 'STATE'): FieldDefinition[] {
  const prefix = category === 'STATE' ? 'state_' : category.toLowerCase() + '_';
  return BRAZILIAN_COMPLIANCE_SECTION.fields.filter(f => f.name.startsWith(prefix));
}

import express from 'express';
import ExcelJS from 'exceljs';

const router = express.Router();

// ============================================================================
// TEMPLATE DEFINITIONS BASED ON REAL JORC REPORTS
// ============================================================================

const templates = {
  // JORC 2012 (Australasian Code)
  jorc: {
    report: {
      filename_csv: 'template_jorc_2012_relatorio_tecnico.csv',
      filename_xlsx: 'template_jorc_2012_relatorio_tecnico.xlsx',
      sections: [
        {
          name: 'Informacoes_Documento',
          headers: ['Campo', 'Valor', 'Observacoes'],
          data: [
            ['Titulo_Relatorio', '', 'Ex: JORC Mineral Resource Estimate Report'],
            ['Nome_Projeto', '', 'Ex: Projeto Carajas'],
            ['Localizacao', '', 'Ex: Para, Brasil'],
            ['Data_Efetiva', '', 'DD/MM/AAAA'],
            ['Numero_Revisao', '', 'Ex: 01'],
            ['Cliente', '', 'Nome da empresa'],
            ['Pessoa_Competente', '', 'Nome e qualificacoes'],
            ['Afiliacao_PC', '', 'Independente/Empregado'],
            ['Registro_Profissional', '', 'Ex: AusIMM, FAusIMM']
          ]
        },
        {
          name: 'Executive_Summary',
          headers: ['Topico', 'Descricao', 'Detalhes'],
          data: [
            ['Introducao', '', 'Contexto e proposito do relatorio'],
            ['Localizacao_Propriedade', '', 'Coordenadas, acesso, jurisdicao'],
            ['Historico', '', 'Historico de exploracao e producao'],
            ['Geologia', '', 'Geologia regional e local'],
            ['Mineralizacao', '', 'Tipo de deposito e minerais'],
            ['Perfuracao', '', 'Resumo de campanhas de perfuracao'],
            ['Amostragem', '', 'Metodos de amostragem'],
            ['Estimativa_Recursos', '', 'Metodologia de estimativa'],
            ['Classificacao', '', 'Measured, Indicated, Inferred'],
            ['Teor_Corte', '', 'Cut-off grade utilizado'],
            ['Declaracao_Recursos', '', 'Tonelagem e teores'],
            ['Conclusoes', '', 'Principais conclusoes'],
            ['Recomendacoes', '', 'Proximos passos']
          ]
        },
        {
          name: 'Amostragem_Perfuracao',
          headers: ['Furo', 'Tipo', 'Profundidade_m', 'Azimute', 'Inclinacao', 'Coordenada_E', 'Coordenada_N', 'Elevacao', 'Data', 'Observacoes'],
          data: [
            ['DDH-001', 'Diamond Core', '', '', '', '', '', '', '', ''],
            ['RC-001', 'Reverse Circulation', '', '', '', '', '', '', '', ''],
            ['BH-001', 'Bench Hole', '', '', '', '', '', '', '', '']
          ]
        },
        {
          name: 'Resultados_Analises',
          headers: ['Furo', 'De_m', 'Ate_m', 'Intervalo_m', 'Au_g/t', 'Ag_g/t', 'Cu_%', 'Pb_%', 'Zn_%', 'Fe_%', 'Metodo_Analise', 'Laboratorio', 'Observacoes'],
          data: [
            ['DDH-001', '0.0', '1.5', '1.5', '', '', '', '', '', '', '', '', ''],
            ['DDH-001', '1.5', '3.0', '1.5', '', '', '', '', '', '', '', '', ''],
            ['DDH-001', '3.0', '4.5', '1.5', '', '', '', '', '', '', '', '', '']
          ]
        },
        {
          name: 'QA_QC',
          headers: ['Tipo_Amostra', 'Numero_Amostra', 'Furo', 'Profundidade_m', 'Au_g/t', 'Valor_Esperado', 'Desvio_%', 'Status', 'Observacoes'],
          data: [
            ['Standard', 'STD-001', '', '', '', '', '', 'Pass/Fail', ''],
            ['Blank', 'BLK-001', '', '', '', '<0.01', '', 'Pass/Fail', ''],
            ['Duplicate', 'DUP-001', '', '', '', '', '', 'Pass/Fail', ''],
            ['CRM', 'CRM-001', '', '', '', '', '', 'Pass/Fail', '']
          ]
        },
        {
          name: 'Estimativa_Recursos',
          headers: ['Categoria', 'Tonelagem_Mt', 'Au_g/t', 'Ag_g/t', 'Cu_%', 'Teor_Corte', 'Metodo_Estimativa', 'Observacoes'],
          data: [
            ['Measured', '', '', '', '', '', 'OK/ID/NN', ''],
            ['Indicated', '', '', '', '', '', 'OK/ID/NN', ''],
            ['Inferred', '', '', '', '', '', 'OK/ID/NN', ''],
            ['Total', '', '', '', '', '', '', '']
          ]
        },
        {
          name: 'Declaracao_Recursos_JORC',
          headers: ['Projeto', 'Deposito', 'Categoria', 'Teor_Corte', 'Tonelagem_Mt', 'Au_g/t', 'Ag_g/t', 'Cu_%', 'Contido_Au_Moz', 'Data_Efetiva', 'Pessoa_Competente'],
          data: [
            ['', '', 'Measured', '', '', '', '', '', '', '', ''],
            ['', '', 'Indicated', '', '', '', '', '', '', '', ''],
            ['', '', 'M+I', '', '', '', '', '', '', '', ''],
            ['', '', 'Inferred', '', '', '', '', '', '', '', '']
          ]
        }
      ]
    },
    audit: {
      filename_csv: 'template_jorc_auditoria_krci.csv',
      filename_xlsx: 'template_jorc_auditoria_krci.xlsx',
      headers: ['Secao_JORC', 'Criterio', 'Categoria', 'Nivel_Risco', 'Status_Conformidade', 'Evidencias', 'Observacoes', 'Responsavel', 'Data_Verificacao', 'Acoes_Requeridas'],
      data: [
        ['Section 1', 'Sampling Techniques', 'Amostragem', 'Alto', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 1', 'Drilling Techniques', 'Perfuracao', 'Alto', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 1', 'Drill Sample Recovery', 'Recuperacao', 'Alto', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 1', 'Logging', 'Logging', 'Medio', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 1', 'Sub-sampling techniques', 'Sub-amostragem', 'Alto', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 1', 'Sample Analysis', 'Analises', 'Alto', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 1', 'Estimation Methodology', 'Estimativa', 'Critico', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 1', 'Cut-off Grade', 'Teor_Corte', 'Alto', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 1', 'Mining Parameters', 'Parametros_Lavra', 'Medio', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 2', 'Resource Classification', 'Classificacao', 'Critico', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 2', 'Audits or Reviews', 'Auditorias', 'Alto', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 3', 'Reserve Estimation', 'Reservas', 'Critico', 'Nao_Verificado', '', '', '', '', ''],
        ['Section 3', 'Modifying Factors', 'Fatores_Modificadores', 'Alto', 'Nao_Verificado', '', '', '', '', '']
      ]
    }
  },

  // NI 43-101 (Canadian Standard)
  ni43101: {
    report: {
      filename_csv: 'template_ni43101_relatorio_tecnico.csv',
      filename_xlsx: 'template_ni43101_relatorio_tecnico.xlsx',
      sections: [
        {
          name: 'Informacoes_Documento',
          headers: ['Item', 'Descricao', 'Valor'],
          data: [
            ['Item 1', 'Title Page', ''],
            ['Item 2', 'Table of Contents', ''],
            ['Item 3', 'Summary', ''],
            ['Item 4', 'Introduction', ''],
            ['Item 5', 'Reliance on Other Experts', ''],
            ['Item 6', 'Property Description and Location', ''],
            ['Item 7', 'Accessibility, Climate, Local Resources', ''],
            ['Item 8', 'History', ''],
            ['Item 9', 'Geological Setting', ''],
            ['Item 10', 'Deposit Types', ''],
            ['Item 11', 'Mineralization', ''],
            ['Item 12', 'Exploration', ''],
            ['Item 13', 'Drilling', ''],
            ['Item 14', 'Sample Preparation, Analyses and Security', ''],
            ['Item 15', 'Data Verification', ''],
            ['Item 16', 'Adjacent Properties', ''],
            ['Item 17', 'Mineral Processing and Metallurgical Testing', ''],
            ['Item 18', 'Mineral Resource Estimates', ''],
            ['Item 19', 'Mineral Reserve Estimates', ''],
            ['Item 20', 'Mining Methods', ''],
            ['Item 21', 'Recovery Methods', ''],
            ['Item 22', 'Project Infrastructure', ''],
            ['Item 23', 'Market Studies', ''],
            ['Item 24', 'Environmental Studies', ''],
            ['Item 25', 'Capital and Operating Costs', ''],
            ['Item 26', 'Economic Analysis', ''],
            ['Item 27', 'Interpretations and Conclusions', '']
          ]
        },
        {
          name: 'Recursos_Minerais_NI43101',
          headers: ['Categoria', 'Zona', 'Tonelagem_Mt', 'Teor_Au_g/t', 'Teor_Ag_g/t', 'Teor_Cu_%', 'Contido_Au_Moz', 'Teor_Corte', 'Data_Efetiva', 'QP_Responsavel'],
          data: [
            ['Measured', '', '', '', '', '', '', '', '', ''],
            ['Indicated', '', '', '', '', '', '', '', '', ''],
            ['M+I', '', '', '', '', '', '', '', '', ''],
            ['Inferred', '', '', '', '', '', '', '', '', '']
          ]
        }
      ]
    }
  },

  // PERC (Pan-European Reserves & Resources Reporting Committee)
  perc: {
    report: {
      filename_csv: 'template_perc_relatorio_tecnico.csv',
      filename_xlsx: 'template_perc_relatorio_tecnico.xlsx',
      headers: ['Secao', 'Item', 'Descricao', 'Valor', 'Observacoes'],
      data: [
        ['1', 'Sampling Techniques', '', '', ''],
        ['2', 'Drilling Techniques', '', '', ''],
        ['3', 'Sample Recovery', '', '', ''],
        ['4', 'Logging', '', '', ''],
        ['5', 'Sub-sampling', '', '', ''],
        ['6', 'Sample Analysis', '', '', ''],
        ['7', 'Estimation Methodology', '', '', ''],
        ['8', 'Cut-off Grade', '', '', ''],
        ['9', 'Resource Classification', '', '', ''],
        ['10', 'Audits or Reviews', '', '', '']
      ]
    }
  },

  // SAMREC (South African Code)
  samrec: {
    report: {
      filename_csv: 'template_samrec_relatorio_tecnico.csv',
      filename_xlsx: 'template_samrec_relatorio_tecnico.xlsx',
      headers: ['Tabela', 'Secao', 'Criterio', 'Descricao', 'Comentarios', 'Status'],
      data: [
        ['Table 1', 'Section 1', 'Sampling Techniques', '', '', 'Pendente'],
        ['Table 1', 'Section 1', 'Drilling Techniques', '', '', 'Pendente'],
        ['Table 1', 'Section 1', 'Drill Sample Recovery', '', '', 'Pendente'],
        ['Table 1', 'Section 1', 'Logging', '', '', 'Pendente'],
        ['Table 1', 'Section 2', 'Mineral Resource Estimation', '', '', 'Pendente'],
        ['Table 1', 'Section 2', 'Classification', '', '', 'Pendente'],
        ['Table 1', 'Section 3', 'Mineral Reserve Estimation', '', '', 'Pendente']
      ]
    }
  },

  // CRIRSCO (Committee for Mineral Reserves International Reporting Standards)
  crirsco: {
    report: {
      filename_csv: 'template_crirsco_relatorio_internacional.csv',
      filename_xlsx: 'template_crirsco_relatorio_internacional.xlsx',
      headers: ['Codigo_Base', 'Secao', 'Requisito', 'Descricao', 'Conformidade', 'Observacoes'],
      data: [
        ['JORC/NI43-101/PERC/SAMREC', 'Exploration Results', 'Data Aggregation', '', '', ''],
        ['JORC/NI43-101/PERC/SAMREC', 'Mineral Resources', 'Estimation and Reporting', '', '', ''],
        ['JORC/NI43-101/PERC/SAMREC', 'Mineral Reserves', 'Modifying Factors', '', '', ''],
        ['JORC/NI43-101/PERC/SAMREC', 'Competent/Qualified Person', 'Declaration', '', '', '']
      ]
    }
  },

  // CBRR (Brazilian Code)
  cbrr: {
    report: {
      filename_csv: 'template_cbrr_relatorio_brasil.csv',
      filename_xlsx: 'template_cbrr_relatorio_brasil.xlsx',
      headers: ['Secao_CBRR', 'Item', 'Descricao', 'Valor', 'Unidade', 'Observacoes', 'Responsavel_Tecnico'],
      data: [
        ['1', 'Identificacao do Projeto', '', '', '', '', ''],
        ['2', 'Localizacao e Acesso', '', '', '', '', ''],
        ['3', 'Historico', '', '', '', '', ''],
        ['4', 'Contexto Geologico', '', '', '', '', ''],
        ['5', 'Trabalhos de Exploracao', '', '', '', '', ''],
        ['6', 'Amostragem', '', '', '', '', ''],
        ['7', 'Preparacao e Analise de Amostras', '', '', '', '', ''],
        ['8', 'Controle de Qualidade', '', '', '', '', ''],
        ['9', 'Banco de Dados', '', '', '', '', ''],
        ['10', 'Estimativa de Recursos', '', '', '', '', ''],
        ['11', 'Classificacao de Recursos', '', '', '', '', ''],
        ['12', 'Recursos Minerais - Medido', '', 'Mt', '', '', ''],
        ['13', 'Recursos Minerais - Indicado', '', 'Mt', '', '', ''],
        ['14', 'Recursos Minerais - Inferido', '', 'Mt', '', '', '']
      ]
    }
  },

  // Pre-Certification Template
  precert: {
    filename_csv: 'template_pre_certificacao_compliance.csv',
    filename_xlsx: 'template_pre_certificacao_compliance.xlsx',
    headers: ['Codigo', 'Secao', 'Requisito', 'Status_Conformidade', 'Evidencias', 'Gap_Identificado', 'Acoes_Corretivas', 'Prazo', 'Responsavel', 'Prioridade'],
    data: [
      ['JORC 1.1', 'Sampling Techniques', 'Natureza e qualidade da amostragem', 'Nao_Verificado', '', '', '', '', '', 'Alta'],
      ['JORC 1.2', 'Drilling Techniques', 'Metodo de perfuracao e recuperacao', 'Nao_Verificado', '', '', '', '', '', 'Alta'],
      ['JORC 1.3', 'Drill Sample Recovery', 'Recuperacao de testemunhos', 'Nao_Verificado', '', '', '', '', '', 'Alta'],
      ['JORC 1.4', 'Logging', 'Procedimentos de logging', 'Nao_Verificado', '', '', '', '', '', 'Media'],
      ['JORC 2.1', 'Mineral Resource Estimation', 'Metodologia de estimativa', 'Nao_Verificado', '', '', '', '', '', 'Critica'],
      ['NI43-101 Item 14', 'Sample Preparation', 'Preparacao de amostras', 'Nao_Verificado', '', '', '', '', '', 'Alta']
    ]
  },

  // Governance & Security Template
  governance: {
    filename_csv: 'template_governanca_seguranca_dados.csv',
    filename_xlsx: 'template_governanca_seguranca_dados.xlsx',
    headers: ['Area_Controle', 'Controle', 'Tipo_Controle', 'Descricao', 'Frequencia', 'Responsavel', 'Status', 'Ultima_Revisao', 'Proxima_Revisao', 'Observacoes'],
    data: [
      ['Acesso Fisico', 'Controle de Acesso ao Site', 'Preventivo', 'Controle de entrada/saida de pessoal', 'Continua', '', 'Ativo', '', '', ''],
      ['Acesso Logico', 'Autenticacao Multifator', 'Preventivo', 'MFA para todos os usuarios', 'Continua', '', 'Ativo', '', '', ''],
      ['Dados Geologicos', 'Backup de Banco de Dados', 'Corretivo', 'Backup diario de dados de perfuracao', 'Diaria', '', 'Ativo', '', '', ''],
      ['Dados Geologicos', 'Versionamento de Modelos', 'Preventivo', 'Controle de versao de modelos geologicos', 'Por_Evento', '', 'Ativo', '', '', ''],
      ['Dados Analíticos', 'Rastreabilidade de Amostras', 'Detectivo', 'Chain of custody de amostras', 'Por_Amostra', '', 'Ativo', '', '', ''],
      ['Compliance', 'Auditoria de Logs', 'Detectivo', 'Revisao de logs de acesso', 'Mensal', '', 'Ativo', '', '', ''],
      ['Compliance', 'Revisao de Permissoes', 'Detectivo', 'Revisao trimestral de permissoes', 'Trimestral', '', 'Ativo', '', '', '']
    ]
  },

  // Valuation Template
  valuation: {
    filename_csv: 'template_valuation_automatico_projeto.csv',
    filename_xlsx: 'template_valuation_automatico_projeto.xlsx',
    headers: ['Categoria', 'Parametro', 'Valor', 'Unidade', 'Fonte', 'Data_Referencia', 'Confianca', 'Observacoes'],
    data: [
      ['Recursos', 'Tonelagem Medida', '', 'Mt', '', '', 'Alta/Media/Baixa', ''],
      ['Recursos', 'Tonelagem Indicada', '', 'Mt', '', '', 'Alta/Media/Baixa', ''],
      ['Recursos', 'Tonelagem Inferida', '', 'Mt', '', '', 'Alta/Media/Baixa', ''],
      ['Teores', 'Teor Medio Au', '', 'g/t', '', '', 'Alta/Media/Baixa', ''],
      ['Teores', 'Teor Medio Ag', '', 'g/t', '', '', 'Alta/Media/Baixa', ''],
      ['Teores', 'Teor Medio Cu', '', '%', '', '', 'Alta/Media/Baixa', ''],
      ['Mercado', 'Preco Au', '', 'USD/oz', '', '', 'Alta/Media/Baixa', ''],
      ['Mercado', 'Preco Ag', '', 'USD/oz', '', '', 'Alta/Media/Baixa', ''],
      ['Mercado', 'Preco Cu', '', 'USD/lb', '', '', 'Alta/Media/Baixa', ''],
      ['Recuperacao', 'Taxa Recuperacao Au', '', '%', '', '', 'Alta/Media/Baixa', ''],
      ['Recuperacao', 'Taxa Recuperacao Ag', '', '%', '', '', 'Alta/Media/Baixa', ''],
      ['Recuperacao', 'Taxa Recuperacao Cu', '', '%', '', '', 'Alta/Media/Baixa', ''],
      ['CAPEX', 'Investimento Inicial', '', 'USD milhoes', '', '', 'Alta/Media/Baixa', ''],
      ['CAPEX', 'Equipamentos', '', 'USD milhoes', '', '', 'Alta/Media/Baixa', ''],
      ['CAPEX', 'Infraestrutura', '', 'USD milhoes', '', '', 'Alta/Media/Baixa', ''],
      ['OPEX', 'Custo Operacional', '', 'USD/t', '', '', 'Alta/Media/Baixa', ''],
      ['OPEX', 'Custo Processamento', '', 'USD/t', '', '', 'Alta/Media/Baixa', ''],
      ['Economico', 'Taxa Desconto', '', '%', '', '', 'Alta/Media/Baixa', ''],
      ['Economico', 'Vida Util Mina', '', 'anos', '', '', 'Alta/Media/Baixa', ''],
      ['Economico', 'NPV', '', 'USD milhoes', '', '', 'Alta/Media/Baixa', ''],
      ['Economico', 'IRR', '', '%', '', '', 'Alta/Media/Baixa', ''],
      ['Economico', 'Payback', '', 'anos', '', '', 'Alta/Media/Baixa', '']
    ]
  }
};

// ============================================================================
// CSV GENERATION FUNCTIONS
// ============================================================================

function generateCSV(headers: string[], data: string[][]): string {
  const rows = [headers, ...data];
  return rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateMultiSectionCSV(sections: any[]): string {
  let csv = '';
  sections.forEach((section, index) => {
    if (index > 0) csv += '\n\n';
    csv += `"${section.name}"\n`;
    csv += generateCSV(section.headers, section.data);
  });
  return csv;
}

// ============================================================================
// XLSX GENERATION FUNCTIONS
// ============================================================================

async function generateXLSX(template: any, type: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'QIVO Mining';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  if (template.sections) {
    // Multi-section template (JORC, NI 43-101, etc.)
    template.sections.forEach((section: any) => {
      const worksheet = workbook.addWorksheet(section.name);
      
      // Add headers with styling
      const headerRow = worksheet.addRow(section.headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Add data rows
      section.data.forEach((row: string[]) => {
        worksheet.addRow(row);
      });
      
      // Auto-fit columns
      worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell!({ includeEmpty: true }, (cell: any) => {
          const length = cell.value ? String(cell.value).length : 10;
          if (length > maxLength) maxLength = length;
        });
        column.width = Math.min(maxLength + 2, 50);
      });
      
      // Freeze header row
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    });
  } else {
    // Single-section template
    const worksheet = workbook.addWorksheet('Template');
    
    // Add headers
    const headerRow = worksheet.addRow(template.headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add data rows
    template.data.forEach((row: string[]) => {
      worksheet.addRow(row);
    });
    
    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell: any) => {
        const length = cell.value ? String(cell.value).length : 10;
        if (length > maxLength) maxLength = length;
      });
      column.width = Math.min(maxLength + 2, 50);
    });
    
    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }
  
  return await workbook.xlsx.writeBuffer() as Buffer;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// GET /api/templates/:kind
router.get('/:kind', async (req, res) => {
  try {
    const { kind } = req.params;
    const { format = 'csv', type = 'report' } = req.query;

    // Validate format
    if (format !== 'csv' && format !== 'xlsx') {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'Format must be either "csv" or "xlsx"'
      });
    }

    // Validate kind
    const validKinds = ['jorc', 'ni43101', 'perc', 'samrec', 'crirsco', 'cbrr', 'precert', 'governance', 'valuation'];
    if (!validKinds.includes(kind)) {
      return res.status(400).json({
        error: 'Invalid kind',
        message: `Kind must be one of: ${validKinds.join(', ')}`
      });
    }

    // Get template
    const templateGroup = templates[kind as keyof typeof templates];
    if (!templateGroup) {
      return res.status(404).json({
        error: 'Template not found',
        message: `No template found for kind: ${kind}`
      });
    }

    // Get specific template type
    const template = typeof type === 'string' && type in templateGroup 
      ? templateGroup[type as keyof typeof templateGroup]
      : templateGroup;

    if (!template) {
      return res.status(404).json({
        error: 'Template type not found',
        message: `No template type "${type}" found for kind: ${kind}`
      });
    }

    // Generate file
    if (format === 'csv') {
      const csvContent = template.sections 
        ? generateMultiSectionCSV(template.sections)
        : generateCSV(template.headers, template.data);
      
      const filename = template.filename_csv || `template_${kind}_${type}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send('\ufeff' + csvContent); // UTF-8 BOM
    } else {
      const xlsxBuffer = await generateXLSX(template, kind);
      const filename = template.filename_xlsx || `template_${kind}_${type}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(xlsxBuffer);
    }
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/templates - List available templates
router.get('/', (req, res) => {
  try {
    const availableTemplates = Object.entries(templates).map(([kind, group]) => {
      if ('sections' in group) {
        return {
          kind,
          name: kind.toUpperCase(),
          types: Object.keys(group),
          formats: ['csv', 'xlsx'],
          description: getTemplateDescription(kind)
        };
      } else {
        return {
          kind,
          name: kind.toUpperCase(),
          types: ['default'],
          formats: ['csv', 'xlsx'],
          description: getTemplateDescription(kind)
        };
      }
    });

    res.json({
      templates: availableTemplates,
      total: availableTemplates.length
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list templates'
    });
  }
});

function getTemplateDescription(kind: string): string {
  const descriptions: Record<string, string> = {
    jorc: 'JORC 2012 - Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves',
    ni43101: 'NI 43-101 - Canadian Standards of Disclosure for Mineral Projects',
    perc: 'PERC - Pan-European Reserves & Resources Reporting Committee Standard',
    samrec: 'SAMREC - South African Code for Reporting of Exploration Results, Mineral Resources and Mineral Reserves',
    crirsco: 'CRIRSCO - Committee for Mineral Reserves International Reporting Standards',
    cbrr: 'CBRR - Codigo Brasileiro de Recursos e Reservas Minerais',
    precert: 'Pre-Certification Compliance Checklist',
    governance: 'Governance & Data Security Controls',
    valuation: 'Automatic Project Valuation Template'
  };
  return descriptions[kind] || '';
}

export default router;


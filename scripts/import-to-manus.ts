#!/usr/bin/env tsx

/**
 * Script de Importação de Roadmap QIVO v1.3 para Manus
 * 
 * Lê o arquivo Excel gerado (docs/QIVO_v1.3_Roadmap.xlsx) e cria
 * automaticamente tarefas no Manus via API, organizadas por Sprint.
 * 
 * @requires exceljs - Leitura de arquivos Excel
 * @requires axios - Requisições HTTP para API Manus
 * @requires dotenv - Variáveis de ambiente
 * 
 * @author QIVO Mining Platform
 * @date 01/11/2025
 * @version 1.0.0
 */

import ExcelJS from 'exceljs';
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// ==================== TIPOS E INTERFACES ====================

interface TaskData {
  id: string;
  title: string;
  description: string;
  responsible: string;
  sprint: string;
  estimateDays: number;
  acceptanceCriteria: string[];
  risk: 'Alto' | 'Médio' | 'Baixo';
  dependencies: string[];
  commands: string;
  deliverable: string;
}

interface ManusTask {
  title: string;
  description: string;
  assignee?: string;
  sprint?: string;
  estimate?: number;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  labels?: string[];
  metadata?: {
    acceptanceCriteria?: string[];
    commands?: string;
    deliverable?: string;
    dependencies?: string[];
  };
}

interface ManusProject {
  id?: string;
  name: string;
  description?: string;
  sprints?: ManusProject[];
}

interface ImportStats {
  totalTasks: number;
  successfulImports: number;
  failedImports: number;
  sprintsCreated: number;
  errors: string[];
}

// ==================== CONFIGURAÇÃO ====================

const CONFIG = {
  EXCEL_PATH: path.join(process.cwd(), 'docs/QIVO_v1.3_Roadmap.xlsx'),
  MANUS_API_KEY: process.env.MANUS_API_KEY || '',
  MANUS_BASE_URL: process.env.MANUS_BASE_URL || 'https://api.manus.ai/v1',
  PROJECT_NAME: 'QIVO Mining Platform v1.3',
  DRY_RUN: process.env.DRY_RUN === 'true', // Modo de teste sem criar tarefas
};

// ==================== CLIENTE API MANUS ====================

class ManusApiClient {
  private client: AxiosInstance;
  private projectId: string | null = null;
  private sprintMap: Map<string, string> = new Map(); // Sprint name -> Sprint ID

  constructor(apiKey: string, baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptor para logs
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ API Error: ${error.response?.status} - ${error.config?.url}`);
        console.error(`   Message: ${error.response?.data?.message || error.message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Cria ou busca o projeto no Manus
   */
  async createOrGetProject(name: string, description?: string): Promise<string> {
    try {
      // Tentar buscar projeto existente
      const { data: projects } = await this.client.get('/projects', {
        params: { name },
      });

      if (projects?.length > 0) {
        this.projectId = projects[0].id;
        console.log(`📂 Projeto existente encontrado: ${name} (ID: ${this.projectId})`);
        return this.projectId;
      }

      // Criar novo projeto
      const { data: newProject } = await this.client.post('/projects', {
        name,
        description: description || `Roadmap técnico gerado em ${new Date().toLocaleDateString('pt-BR')}`,
      });

      this.projectId = newProject.id;
      console.log(`📂 Novo projeto criado: ${name} (ID: ${this.projectId})`);
      return this.projectId;
    } catch (error) {
      console.error('❌ Erro ao criar/buscar projeto:', error);
      throw new Error('Falha ao inicializar projeto no Manus');
    }
  }

  /**
   * Cria ou busca um Sprint no projeto
   */
  async createOrGetSprint(sprintName: string): Promise<string> {
    if (this.sprintMap.has(sprintName)) {
      return this.sprintMap.get(sprintName)!;
    }

    try {
      // Buscar sprints existentes
      const { data: sprints } = await this.client.get(`/projects/${this.projectId}/sprints`, {
        params: { name: sprintName },
      });

      if (sprints?.length > 0) {
        const sprintId = sprints[0].id;
        this.sprintMap.set(sprintName, sprintId);
        console.log(`  🏃 Sprint existente: ${sprintName} (ID: ${sprintId})`);
        return sprintId;
      }

      // Criar novo sprint
      const { data: newSprint } = await this.client.post(`/projects/${this.projectId}/sprints`, {
        name: sprintName,
        startDate: new Date().toISOString(),
        status: 'planned',
      });

      this.sprintMap.set(sprintName, newSprint.id);
      console.log(`  🏃 Novo sprint criado: ${sprintName} (ID: ${newSprint.id})`);
      return newSprint.id;
    } catch (error) {
      console.error(`❌ Erro ao criar/buscar sprint ${sprintName}:`, error);
      throw error;
    }
  }

  /**
   * Cria uma tarefa no Manus
   */
  async createTask(task: ManusTask, sprintId?: string): Promise<string> {
    try {
      const endpoint = sprintId 
        ? `/projects/${this.projectId}/sprints/${sprintId}/tasks`
        : `/projects/${this.projectId}/tasks`;

      const { data: newTask } = await this.client.post(endpoint, task);
      
      console.log(`    ✅ Tarefa criada: ${task.title} (ID: ${newTask.id})`);
      return newTask.id;
    } catch (error) {
      console.error(`    ❌ Erro ao criar tarefa "${task.title}":`, error);
      throw error;
    }
  }

  /**
   * Testa a conexão com a API Manus
   */
  async testConnection(): Promise<boolean> {
    try {
      // Tentar listar projetos como teste de conexão
      await this.client.get('/projects');
      console.log('✅ Conexão com API Manus estabelecida');
      return true;
    } catch (error) {
      console.error('❌ Falha ao conectar com API Manus');
      console.error('   Verifique se a URL da API e a chave estão corretas');
      return false;
    }
  }
}

// ==================== LEITOR DE EXCEL ====================

class ExcelRoadmapReader {
  private workbook: ExcelJS.Workbook;
  private filePath: string;

  constructor(filePath: string) {
    this.workbook = new ExcelJS.Workbook();
    this.filePath = filePath;
  }

  /**
   * Carrega o arquivo Excel
   */
  async load(): Promise<void> {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Arquivo não encontrado: ${this.filePath}`);
    }

    await this.workbook.xlsx.readFile(this.filePath);
    console.log(`📊 Excel carregado: ${this.filePath}`);
  }

  /**
   * Extrai todas as tarefas de todas as abas (sprints)
   */
  extractTasks(): TaskData[] {
    const tasks: TaskData[] = [];

    this.workbook.eachSheet((worksheet, sheetId) => {
      const sheetName = worksheet.name;

      // Ignorar aba de visão geral
      if (sheetName.toLowerCase().includes('overview') || 
          sheetName.toLowerCase().includes('visão geral')) {
        console.log(`⏭️  Ignorando aba: ${sheetName}`);
        return;
      }

      console.log(`📄 Processando aba: ${sheetName}`);

      // Encontrar linha de cabeçalho
      let headerRow: ExcelJS.Row | null = null;
      let headerRowNumber = 0;

      worksheet.eachRow((row, rowNumber) => {
        const firstCell = row.getCell(1).value?.toString().toLowerCase() || '';
        if (firstCell.includes('id') || firstCell === 'id') {
          headerRow = row;
          headerRowNumber = rowNumber;
        }
      });

      if (!headerRow || headerRowNumber === 0) {
        console.warn(`⚠️  Cabeçalho não encontrado na aba: ${sheetName}`);
        return;
      }

      // Mapear colunas
      const columnMap = this.mapColumns(headerRow);
      
      // Extrair dados das linhas
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowNumber) return; // Pular cabeçalho

        const taskData = this.extractTaskFromRow(row, columnMap, sheetName);
        if (taskData) {
          tasks.push(taskData);
        }
      });
    });

    console.log(`✅ Total de tarefas extraídas: ${tasks.length}`);
    return tasks;
  }

  /**
   * Mapeia os nomes das colunas para seus índices
   */
  private mapColumns(headerRow: ExcelJS.Row): Map<string, number> {
    const map = new Map<string, number>();
    
    headerRow.eachCell((cell, colNumber) => {
      const header = cell.value?.toString().toLowerCase() || '';
      
      if (header.includes('id')) map.set('id', colNumber);
      if (header.includes('título') || header.includes('title')) map.set('title', colNumber);
      if (header.includes('descrição') || header.includes('description')) map.set('description', colNumber);
      if (header.includes('responsável') || header.includes('assignee')) map.set('responsible', colNumber);
      if (header.includes('estimativa') || header.includes('estimate')) map.set('estimate', colNumber);
      if (header.includes('risco') || header.includes('risk')) map.set('risk', colNumber);
      if (header.includes('dependência') || header.includes('dependencies')) map.set('dependencies', colNumber);
      if (header.includes('critério') || header.includes('acceptance')) map.set('criteria', colNumber);
      if (header.includes('comando') || header.includes('commands')) map.set('commands', colNumber);
      if (header.includes('entregável') || header.includes('deliverable')) map.set('deliverable', colNumber);
    });

    return map;
  }

  /**
   * Extrai dados de uma tarefa de uma linha do Excel
   */
  private extractTaskFromRow(
    row: ExcelJS.Row, 
    columnMap: Map<string, number>, 
    sprintName: string
  ): TaskData | null {
    try {
      const id = row.getCell(columnMap.get('id') || 1).value?.toString() || '';
      
      // Ignorar linhas vazias ou de cabeçalho
      if (!id || id.toLowerCase() === 'id') return null;

      const title = row.getCell(columnMap.get('title') || 2).value?.toString() || '';
      const description = row.getCell(columnMap.get('description') || 3).value?.toString() || '';
      const responsible = row.getCell(columnMap.get('responsible') || 4).value?.toString() || '';
      const estimateRaw = row.getCell(columnMap.get('estimate') || 5).value?.toString() || '0';
      const risk = row.getCell(columnMap.get('risk') || 6).value?.toString() as 'Alto' | 'Médio' | 'Baixo' || 'Médio';
      
      // Processar estimativa (extrair número de "X dias")
      const estimateDays = parseInt(estimateRaw.match(/\d+/)?.[0] || '0');

      // Processar critérios de aceitação (separados por linha ou ponto e vírgula)
      const criteriaRaw = row.getCell(columnMap.get('criteria') || 7).value?.toString() || '';
      const acceptanceCriteria = criteriaRaw
        .split(/[\n;]/)
        .map(c => c.trim())
        .filter(c => c.length > 0);

      // Processar dependências
      const dependenciesRaw = row.getCell(columnMap.get('dependencies') || 8).value?.toString() || '';
      const dependencies = dependenciesRaw
        .split(/[,;]/)
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const commands = row.getCell(columnMap.get('commands') || 9).value?.toString() || '';
      const deliverable = row.getCell(columnMap.get('deliverable') || 10).value?.toString() || '';

      return {
        id,
        title,
        description,
        responsible,
        sprint: sprintName,
        estimateDays,
        acceptanceCriteria,
        risk,
        dependencies,
        commands,
        deliverable,
      };
    } catch (error) {
      console.error(`⚠️  Erro ao processar linha ${row.number}:`, error);
      return null;
    }
  }
}

// ==================== IMPORTADOR PRINCIPAL ====================

class ManusImporter {
  private apiClient: ManusApiClient;
  private excelReader: ExcelRoadmapReader;
  private stats: ImportStats = {
    totalTasks: 0,
    successfulImports: 0,
    failedImports: 0,
    sprintsCreated: 0,
    errors: [],
  };

  constructor(apiClient: ManusApiClient, excelReader: ExcelRoadmapReader) {
    this.apiClient = apiClient;
    this.excelReader = excelReader;
  }

  /**
   * Converte TaskData para formato Manus
   */
  private convertToManusTask(task: TaskData): ManusTask {
    // Determinar prioridade baseada no risco
    const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
      'Alto': 'high',
      'Médio': 'medium',
      'Baixo': 'low',
    };

    // Formatar descrição completa
    const fullDescription = `
${task.description}

**📦 Entregável:**
${task.deliverable}

**🔗 Dependências:**
${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'Nenhuma'}

**⚙️ Comandos:**
\`\`\`bash
${task.commands}
\`\`\`
    `.trim();

    return {
      title: `[${task.id}] ${task.title}`,
      description: fullDescription,
      assignee: task.responsible,
      sprint: task.sprint,
      estimate: task.estimateDays,
      status: 'todo',
      priority: priorityMap[task.risk] || 'medium',
      labels: [task.risk, `Sprint: ${task.sprint}`],
      metadata: {
        acceptanceCriteria: task.acceptanceCriteria,
        commands: task.commands,
        deliverable: task.deliverable,
        dependencies: task.dependencies,
      },
    };
  }

  /**
   * Executa a importação completa
   */
  async import(): Promise<ImportStats> {
    console.log('\n🚀 Iniciando importação para Manus...\n');

    try {
      // 1. Carregar Excel
      console.log('📊 Carregando arquivo Excel...');
      await this.excelReader.load();

      // 2. Extrair tarefas
      console.log('📝 Extraindo tarefas do Excel...');
      const tasks = this.excelReader.extractTasks();
      this.stats.totalTasks = tasks.length;

      if (tasks.length === 0) {
        throw new Error('Nenhuma tarefa encontrada no arquivo Excel');
      }

      // 3. Teste de conexão (modo não dry-run)
      if (!CONFIG.DRY_RUN) {
        console.log('\n🔌 Testando conexão com Manus...');
        const connected = await this.apiClient.testConnection();
        if (!connected) {
          throw new Error('Não foi possível conectar ao Manus');
        }

        // 4. Criar/buscar projeto
        console.log('\n📂 Configurando projeto...');
        await this.apiClient.createOrGetProject(
          CONFIG.PROJECT_NAME,
          'Roadmap completo gerado a partir da auditoria técnica QIVO v1.3'
        );
      }

      // 5. Agrupar tarefas por sprint
      const tasksBySprint = new Map<string, TaskData[]>();
      tasks.forEach(task => {
        if (!tasksBySprint.has(task.sprint)) {
          tasksBySprint.set(task.sprint, []);
        }
        tasksBySprint.get(task.sprint)!.push(task);
      });

      // 6. Importar tarefas sprint por sprint
      console.log('\n📥 Importando tarefas...\n');

      for (const [sprintName, sprintTasks] of tasksBySprint) {
        console.log(`\n🏃 ${sprintName} (${sprintTasks.length} tarefas)`);
        console.log('━'.repeat(60));

        let sprintId: string | undefined;

        if (!CONFIG.DRY_RUN) {
          try {
            sprintId = await this.apiClient.createOrGetSprint(sprintName);
            this.stats.sprintsCreated++;
          } catch (error) {
            const errorMsg = `Erro ao criar sprint ${sprintName}`;
            console.error(`❌ ${errorMsg}`);
            this.stats.errors.push(errorMsg);
            continue;
          }
        }

        // Importar tarefas do sprint
        for (const task of sprintTasks) {
          try {
            const manusTask = this.convertToManusTask(task);

            if (CONFIG.DRY_RUN) {
              console.log(`    🔍 [DRY-RUN] ${task.id} - ${task.title}`);
              this.stats.successfulImports++;
            } else {
              await this.apiClient.createTask(manusTask, sprintId);
              this.stats.successfulImports++;
            }

            // Delay para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (error) {
            const errorMsg = `Erro ao importar ${task.id}: ${error}`;
            console.error(`    ❌ ${errorMsg}`);
            this.stats.failedImports++;
            this.stats.errors.push(errorMsg);
          }
        }
      }

      console.log('\n✅ Importação concluída!\n');
      return this.stats;

    } catch (error) {
      console.error('\n❌ Erro fatal durante importação:', error);
      this.stats.errors.push(`Erro fatal: ${error}`);
      throw error;
    }
  }

  /**
   * Exibe relatório final
   */
  printReport(): void {
    console.log('\n');
    console.log('━'.repeat(60));
    console.log('📊 RELATÓRIO DE IMPORTAÇÃO - QIVO v1.3 → MANUS');
    console.log('━'.repeat(60));
    console.log();
    console.log(`📝 Total de tarefas encontradas:  ${this.stats.totalTasks}`);
    console.log(`✅ Tarefas importadas com sucesso: ${this.stats.successfulImports}`);
    console.log(`❌ Tarefas com falha:              ${this.stats.failedImports}`);
    console.log(`🏃 Sprints criados:                ${this.stats.sprintsCreated}`);
    console.log();
    
    const successRate = this.stats.totalTasks > 0 
      ? ((this.stats.successfulImports / this.stats.totalTasks) * 100).toFixed(1)
      : '0.0';
    
    console.log(`📈 Taxa de sucesso:                ${successRate}%`);
    console.log();

    if (this.stats.errors.length > 0) {
      console.log('⚠️  ERROS ENCONTRADOS:');
      this.stats.errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${error}`);
      });
      console.log();
    }

    if (CONFIG.DRY_RUN) {
      console.log('🔍 MODO DRY-RUN: Nenhuma alteração foi feita no Manus');
      console.log('   Para executar a importação real, rode sem DRY_RUN=true');
      console.log();
    }

    console.log('━'.repeat(60));
    console.log();
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  📦 IMPORTADOR DE ROADMAP QIVO v1.3 → MANUS              ║');
  console.log('║  Versão 1.0.0 - 01/11/2025                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  // Validar configuração
  if (!CONFIG.MANUS_API_KEY) {
    console.error('❌ ERRO: Variável MANUS_API_KEY não configurada');
    console.error('   Configure no arquivo .env ou via export:');
    console.error('   export MANUS_API_KEY="sua-chave-aqui"');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.EXCEL_PATH)) {
    console.error(`❌ ERRO: Arquivo Excel não encontrado: ${CONFIG.EXCEL_PATH}`);
    console.error('   Execute primeiro: pnpm run generate:sprints');
    process.exit(1);
  }

  console.log('⚙️  CONFIGURAÇÃO:');
  console.log(`   📄 Excel:     ${CONFIG.EXCEL_PATH}`);
  console.log(`   🌐 API Base:  ${CONFIG.MANUS_BASE_URL}`);
  console.log(`   🔑 API Key:   ${CONFIG.MANUS_API_KEY.substring(0, 10)}...`);
  console.log(`   📂 Projeto:   ${CONFIG.PROJECT_NAME}`);
  console.log(`   🔍 Dry Run:   ${CONFIG.DRY_RUN ? 'SIM' : 'NÃO'}`);
  console.log();

  try {
    // Inicializar componentes
    const apiClient = new ManusApiClient(CONFIG.MANUS_API_KEY, CONFIG.MANUS_BASE_URL);
    const excelReader = new ExcelRoadmapReader(CONFIG.EXCEL_PATH);
    const importer = new ManusImporter(apiClient, excelReader);

    // Executar importação
    await importer.import();

    // Exibir relatório
    importer.printReport();

    console.log('🎉 Processo concluído com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('\n💥 ERRO FATAL:', error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ManusImporter, ManusApiClient, ExcelRoadmapReader };

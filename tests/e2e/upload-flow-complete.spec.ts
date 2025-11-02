import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test: Complete Upload Flow
 * 
 * Testa o fluxo completo de upload de arquivos com:
 * - Validação de tamanho (50MB)
 * - Validação de tipo
 * - Upload para storage híbrido
 * - Parsing e detecção de padrão
 * - Geração de relatório
 * - Notificações progressivas
 */

test.describe('Upload Flow - Complete', () => {
  test.beforeEach(async ({ page }) => {
    // Login (assumindo que existe autenticação)
    await page.goto('/login');
    
    // Preencher credenciais de teste
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Esperar redirecionamento
    await page.waitForURL('/dashboard');
    
    // Navegar para página de relatórios
    await page.goto('/reports/generate');
  });

  test('should upload PDF file successfully', async ({ page }) => {
    // Abrir modal de upload
    await page.click('button:has-text("Upload de Arquivo")');
    
    // Esperar modal abrir
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Preparar arquivo de teste
    const testFile = path.join(__dirname, '../fixtures/sample-jorc-report.pdf');
    
    // Upload do arquivo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);
    
    // Verificar que arquivo foi selecionado
    await expect(page.locator('text=/sample-jorc-report.pdf/')).toBeVisible();
    
    // Clicar em upload
    await page.click('button:has-text("Fazer Upload")');
    
    // Verificar toasts progressivos
    await expect(page.locator('text="Iniciando upload..."')).toBeVisible();
    await expect(page.locator('text="Enviando arquivo..."')).toBeVisible();
    await expect(page.locator('text="Analisando conteúdo..."')).toBeVisible();
    
    // Esperar sucesso (timeout maior para processamento)
    await expect(page.locator('text=/Relatório processado com sucesso/')).toBeVisible({
      timeout: 30000
    });
    
    // Verificar que modal fechou
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({
      timeout: 3000
    });
    
    // Verificar que relatório aparece na lista
    await page.goto('/reports');
    await expect(page.locator('text=/sample-jorc-report/')).toBeVisible();
  });

  test('should validate file size (max 50MB)', async ({ page }) => {
    // Abrir modal de upload
    await page.click('button:has-text("Upload de Arquivo")');
    
    // Mock de arquivo grande (> 50MB)
    // Nota: Playwright não permite criar arquivos grandes facilmente,
    // então este teste valida a mensagem de erro
    
    const fileInput = page.locator('input[type="file"]');
    
    // Criar blob grande (simulação)
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large-file.pdf', {
        type: 'application/pdf'
      });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(largeFile);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Clicar em upload
    await page.click('button:has-text("Fazer Upload")');
    
    // Verificar erro de tamanho
    await expect(page.locator('text="Arquivo muito grande"')).toBeVisible();
    await expect(page.locator('text=/Tamanho máximo: 50MB/')).toBeVisible();
  });

  test('should validate file type', async ({ page }) => {
    // Abrir modal de upload
    await page.click('button:has-text("Upload de Arquivo")');
    
    // Tentar upload de arquivo não suportado
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(invalidFile);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Clicar em upload
    await page.click('button:has-text("Fazer Upload")');
    
    // Verificar erro de tipo
    await expect(page.locator('text="Tipo de arquivo não suportado"')).toBeVisible();
    await expect(page.locator('text=/Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP/')).toBeVisible();
  });

  test('should show parsing progress with detected standard', async ({ page }) => {
    // Abrir modal de upload
    await page.click('button:has-text("Upload de Arquivo")');
    
    const testFile = path.join(__dirname, '../fixtures/sample-jorc-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);
    
    // Upload
    await page.click('button:has-text("Fazer Upload")');
    
    // Verificar detecção de padrão
    await expect(page.locator('text=/Padrão detectado: JORC/')).toBeVisible({
      timeout: 30000
    });
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Mock de erro de rede
    await page.route('**/api/trpc/**', route => {
      if (route.request().url().includes('uploadFile')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Abrir modal de upload
    await page.click('button:has-text("Upload de Arquivo")');
    
    const testFile = path.join(__dirname, '../fixtures/sample-jorc-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);
    
    // Tentar upload
    await page.click('button:has-text("Fazer Upload")');
    
    // Verificar erro
    await expect(page.locator('text="Erro no upload"')).toBeVisible();
    await expect(page.locator('text=/Tente novamente/')).toBeVisible();
    
    // Modal deve permanecer aberto
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should allow retry after error', async ({ page }) => {
    let requestCount = 0;
    
    // Mock: primeira tentativa falha, segunda sucede
    await page.route('**/api/trpc/**', route => {
      if (route.request().url().includes('uploadFile')) {
        requestCount++;
        if (requestCount === 1) {
          route.abort('failed');
        } else {
          route.continue();
        }
      } else {
        route.continue();
      }
    });
    
    // Abrir modal
    await page.click('button:has-text("Upload de Arquivo")');
    
    const testFile = path.join(__dirname, '../fixtures/sample-jorc-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);
    
    // Primeira tentativa (deve falhar)
    await page.click('button:has-text("Fazer Upload")');
    await expect(page.locator('text="Erro no upload"')).toBeVisible();
    
    // Retry
    await page.click('button:has-text("Fazer Upload")');
    
    // Segunda tentativa (deve suceder)
    await expect(page.locator('text=/Relatório processado com sucesso/')).toBeVisible({
      timeout: 30000
    });
  });

  test('should support drag and drop upload', async ({ page }) => {
    // Abrir modal
    await page.click('button:has-text("Upload de Arquivo")');
    
    const testFile = path.join(__dirname, '../fixtures/sample-jorc-report.pdf');
    
    // Simular drag and drop
    const dropZone = page.locator('[data-testid="upload-dropzone"]');
    
    // Ler arquivo
    const buffer = require('fs').readFileSync(testFile);
    const dataTransfer = await page.evaluateHandle((data: number[]) => {
      const dt = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'sample-jorc-report.pdf', {
        type: 'application/pdf'
      });
      dt.items.add(file);
      return dt;
    }, Array.from(buffer) as number[]);
    
    // Drop
    await dropZone.dispatchEvent('drop', { dataTransfer });
    
    // Verificar arquivo selecionado
    await expect(page.locator('text=/sample-jorc-report.pdf/')).toBeVisible();
  });

  test('should show file info before upload', async ({ page }) => {
    // Abrir modal
    await page.click('button:has-text("Upload de Arquivo")');
    
    const testFile = path.join(__dirname, '../fixtures/sample-jorc-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);
    
    // Verificar informações do arquivo
    await expect(page.locator('text=/sample-jorc-report.pdf/')).toBeVisible();
    await expect(page.locator('text=/PDF/')).toBeVisible();
    
    // Tamanho deve ser visível (formato KB/MB)
    const sizeText = await page.locator('[data-testid="file-size"]').textContent();
    expect(sizeText).toMatch(/\d+(\.\d+)?\s*(KB|MB)/);
  });

  test('should clear file selection', async ({ page }) => {
    // Abrir modal
    await page.click('button:has-text("Upload de Arquivo")');
    
    const testFile = path.join(__dirname, '../fixtures/sample-jorc-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);
    
    // Verificar arquivo selecionado
    await expect(page.locator('text=/sample-jorc-report.pdf/')).toBeVisible();
    
    // Limpar seleção
    await page.click('button:has-text("Remover")');
    
    // Verificar que arquivo foi removido
    await expect(page.locator('text=/sample-jorc-report.pdf/')).not.toBeVisible();
  });
});

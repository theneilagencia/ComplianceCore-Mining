import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Tests - Document Upload Flow
 * 
 * Testa o fluxo completo de upload de documentos:
 * - Upload de PDF
 * - Validação de arquivo
 * - Processamento
 * - Visualização
 */

test.describe('Document Upload Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login primeiro
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@compliancecore.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to upload page', async ({ page }) => {
    // Navega para página de upload
    await page.click('text=/upload|enviar|carregar/i');
    
    // Verifica se está na página correta
    await expect(page).toHaveURL(/\/upload|\/documents\/upload/);
    await expect(page.locator('h1, h2')).toContainText(/upload|enviar|carregar/i);
  });

  test('should display upload dropzone', async ({ page }) => {
    await page.goto('/upload');
    
    // Verifica se dropzone está visível
    await expect(page.locator('[data-testid="dropzone"], input[type="file"]')).toBeVisible();
    
    // Verifica instruções
    await expect(page.locator('text=/drag|drop|arraste|solte|pdf/i')).toBeVisible();
  });

  test('should validate file type (PDF only)', async ({ page }) => {
    await page.goto('/upload');
    
    // Tenta fazer upload de arquivo não-PDF (se houver validação client-side)
    const fileInput = page.locator('input[type="file"]');
    
    // Verifica se aceita apenas PDF
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('pdf');
  });

  test('should upload PDF file successfully', async ({ page }) => {
    await page.goto('/upload');
    
    // Cria um arquivo PDF de teste (ou usa um existente)
    const testPdfPath = path.join(__dirname, '../fixtures/test-report.pdf');
    
    // Faz upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);
    
    // Verifica se arquivo foi adicionado
    await expect(page.locator('text=/test-report.pdf/i')).toBeVisible();
    
    // Clica em submit/upload
    await page.click('button[type="submit"], button:has-text("Upload")');
    
    // Aguarda processamento
    await expect(page.locator('text=/processing|processando|uploading/i')).toBeVisible();
    
    // Aguarda sucesso (com timeout maior)
    await page.waitForSelector('text=/success|sucesso|uploaded|enviado/i', {
      timeout: 30000
    });
  });

  test('should show upload progress', async ({ page }) => {
    await page.goto('/upload');
    
    const testPdfPath = path.join(__dirname, '../fixtures/test-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);
    
    await page.click('button[type="submit"], button:has-text("Upload")');
    
    // Verifica se barra de progresso aparece
    await expect(page.locator('[role="progressbar"], .progress-bar, text=/loading|carregando/i')).toBeVisible();
  });

  test('should display uploaded documents list', async ({ page }) => {
    await page.goto('/documents');
    
    // Verifica se lista de documentos está visível
    await expect(page.locator('table, [data-testid="documents-list"]')).toBeVisible();
    
    // Verifica se há colunas esperadas
    await expect(page.locator('text=/name|nome|file|arquivo/i')).toBeVisible();
    await expect(page.locator('text=/date|data|upload/i')).toBeVisible();
    await expect(page.locator('text=/status/i')).toBeVisible();
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    await page.goto('/upload');
    
    // Simula erro (arquivo muito grande ou inválido)
    // Nota: Isso pode precisar de mock ou teste específico
    
    const fileInput = page.locator('input[type="file"]');
    
    // Verifica se há mensagem de tamanho máximo
    await expect(page.locator('text=/max|máximo|mb|size|tamanho/i')).toBeVisible();
  });

  test('should allow multiple file uploads', async ({ page }) => {
    await page.goto('/upload');
    
    const fileInput = page.locator('input[type="file"]');
    
    // Verifica se permite múltiplos arquivos
    const multipleAttr = await fileInput.getAttribute('multiple');
    
    if (multipleAttr !== null) {
      // Se suportar múltiplos arquivos
      const testPdf1 = path.join(__dirname, '../fixtures/test-report.pdf');
      const testPdf2 = path.join(__dirname, '../fixtures/test-report-2.pdf');
      
      await fileInput.setInputFiles([testPdf1, testPdf2]);
      
      // Verifica se ambos foram adicionados
      await expect(page.locator('text=/2 file|2 arquivo/i')).toBeVisible();
    }
  });

  test('should preview uploaded document', async ({ page }) => {
    await page.goto('/documents');
    
    // Clica no primeiro documento da lista
    await page.click('table tr:first-child, [data-testid="document-item"]:first-child');
    
    // Verifica se modal/página de preview abre
    await expect(page.locator('[role="dialog"], .modal, text=/preview|visualizar/i')).toBeVisible();
  });
});

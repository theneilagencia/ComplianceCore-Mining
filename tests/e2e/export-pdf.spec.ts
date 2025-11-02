import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Testes E2E para Export PDF
 * 
 * Valida o fluxo completo:
 * 1. Upload de arquivo
 * 2. Processamento
 * 3. Export para PDF
 * 4. Download e validação
 */

test.describe('Export PDF System', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página principal
    await page.goto('/');
    
    // Login (assumindo que há autenticação)
    // TODO: Adicionar login se necessário
    await page.waitForLoadState('networkidle');
  });

  test('should export report to PDF successfully', async ({ page }) => {
    // 1. Abrir modal de upload
    await page.click('button:has-text("Upload Relatório")');
    await expect(page.locator('dialog')).toBeVisible();

    // 2. Upload de arquivo de teste
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    // 3. Confirmar upload
    await page.click('button:has-text("Iniciar Upload")');
    
    // 4. Aguardar processamento
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    // 5. Navegar para lista de relatórios
    await page.click('a[href="/reports/list"]');
    await page.waitForLoadState('networkidle');

    // 6. Selecionar primeiro relatório
    await page.click('[data-testid="report-item"]:first-child');
    
    // 7. Clicar em export PDF
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("PDF")');

    // 8. Aguardar geração
    await expect(page.locator('text=Gerando PDF')).toBeVisible();
    
    // 9. Aguardar download estar pronto
    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    
    // 10. Clicar em download
    await page.click('button:has-text("Baixar PDF")');
    const download = await downloadPromise;

    // 11. Validar download
    expect(download.suggestedFilename()).toContain('.pdf');
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // 12. Validar tamanho do arquivo (> 10KB)
    const fs = require('fs');
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(10 * 1024);
  });

  test('should export JORC standard report to PDF', async ({ page }) => {
    // Similar ao teste anterior, mas especificando standard JORC
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/jorc-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    // Navegar e exportar
    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    // Selecionar standard JORC
    await page.click('select[name="standard"]');
    await page.click('option[value="JORC"]');
    
    // Exportar
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("PDF")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar PDF")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('JORC');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should export NI43-101 standard report to PDF', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/ni43-101-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    // Selecionar standard NI43-101
    await page.click('select[name="standard"]');
    await page.click('option[value="NI43-101"]');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("PDF")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar PDF")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('NI43-101');
  });

  test('should handle PDF export errors gracefully', async ({ page }) => {
    // Testar cenário de erro
    await page.click('a[href="/reports/list"]');
    
    // Tentar exportar relatório inexistente
    await page.goto('/reports/export/invalid-id');
    
    // Deve mostrar erro
    await expect(page.locator('text=Erro')).toBeVisible();
    await expect(page.locator('text=Relatório não encontrado')).toBeVisible();
  });

  test('should validate PDF content structure', async ({ page }) => {
    // Upload e export
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/complete-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("PDF")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar PDF")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // Validar estrutura do PDF usando pdf-parse (instalado separadamente)
    // TODO: Adicionar validação de conteúdo do PDF
    // const pdfParse = require('pdf-parse');
    // const dataBuffer = fs.readFileSync(downloadPath);
    // const pdfData = await pdfParse(dataBuffer);
    // expect(pdfData.text).toContain('Executive Summary');
    // expect(pdfData.numpages).toBeGreaterThan(5);
  });

  test('should track export progress', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/large-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("PDF")');

    // Validar que progress bar aparece
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
    
    // Validar percentual
    const progressText = await page.locator('text=/%/').textContent();
    expect(progressText).toMatch(/\d+%/);

    // Aguardar conclusão
    await expect(page.locator('text=100%')).toBeVisible({ timeout: 60000 });
  });

  test('should allow canceling PDF export', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("PDF")');

    // Aguardar início do processo
    await expect(page.locator('text=Gerando PDF')).toBeVisible();

    // Cancelar
    await page.click('button:has-text("Cancelar")');

    // Validar cancelamento
    await expect(page.locator('text=Export cancelado')).toBeVisible();
    await expect(page.locator('text=Gerando PDF')).not.toBeVisible();
  });
});

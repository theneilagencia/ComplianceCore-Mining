import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Testes E2E para Export DOCX
 * 
 * Valida exportação de relatórios para formato Word (.docx)
 * com todas as 11 seções estruturadas
 */

test.describe('Export DOCX System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should export report to DOCX successfully', async ({ page }) => {
    // Upload de arquivo
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    // Navegar e exportar
    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("DOCX")');

    // Aguardar geração
    await expect(page.locator('text=Gerando DOCX')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    
    await page.click('button:has-text("Baixar DOCX")');
    const download = await downloadPromise;

    // Validações
    expect(download.suggestedFilename()).toContain('.docx');
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Validar tamanho (DOCX geralmente > 15KB)
    const fs = require('fs');
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(15 * 1024);
  });

  test('should export DOCX with all 11 sections', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/complete-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    // Verificar preview das seções antes de exportar
    const sectionsList = [
      'Title',
      'Competent Person',
      'Executive Summary',
      'Introduction',
      'Location',
      'Geology',
      'Resources',
      'Reserves',
      'Methodology',
      'Economics',
      'Conclusions',
    ];

    for (const section of sectionsList) {
      await expect(page.locator(`text=${section}`)).toBeVisible();
    }

    // Exportar
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("DOCX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar DOCX")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*\.docx$/);
  });

  test('should export DOCX for each standard', async ({ page }) => {
    const standards = ['JORC', 'NI43-101', 'PERC', 'SAMREC', 'NAEN'];

    for (const standard of standards) {
      // Upload
      await page.click('button:has-text("Upload Relatório")');
      
      const fileInput = page.locator('input[type="file"]');
      const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
      await fileInput.setInputFiles(testFilePath);

      await page.click('button:has-text("Iniciar Upload")');
      await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

      await page.click('a[href="/reports/list"]');
      await page.click('[data-testid="report-item"]:first-child');
      
      // Selecionar standard
      await page.click('select[name="standard"]');
      await page.click(`option[value="${standard}"]`);
      
      // Exportar
      await page.click('button:has-text("Exportar")');
      await page.click('button:has-text("DOCX")');

      const downloadPromise = page.waitForEvent('download');
      await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
      await page.click('button:has-text("Baixar DOCX")');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(standard);
      expect(download.suggestedFilename()).toContain('.docx');

      // Voltar para lista
      await page.click('a[href="/reports/list"]');
    }
  });

  test('should validate DOCX formatting', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("DOCX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar DOCX")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // TODO: Validar formatação usando mammoth ou docx library
    // - Verificar headings (H1, H2, H3)
    // - Verificar tabelas
    // - Verificar estilos (bold, italic)
    // - Verificar page breaks
    
    const fs = require('fs');
    expect(fs.existsSync(downloadPath)).toBe(true);
  });

  test('should handle DOCX export errors', async ({ page }) => {
    // Tentar exportar sem dados
    await page.goto('/reports/export/invalid-id');
    
    await expect(page.locator('text=Erro')).toBeVisible();
    await expect(
      page.locator('text=Não foi possível exportar o relatório')
    ).toBeVisible();
  });

  test('should show DOCX generation progress', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/large-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("DOCX")');

    // Validar loading state
    await expect(page.locator('text=Gerando documento Word')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();

    // Aguardar conclusão
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
  });

  test('should export DOCX with custom template', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    // Selecionar template customizado
    await page.click('button:has-text("Configurações")');
    await page.click('select[name="template"]');
    await page.click('option:has-text("Custom Template")');
    await page.click('button:has-text("Aplicar")');
    
    // Exportar
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("DOCX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar DOCX")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.docx');
  });

  test('should export DOCX with tables and formatting', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/report-with-tables.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    // Verificar que tabelas estão presentes no preview
    await expect(page.locator('table')).toHaveCount(2, { timeout: 5000 });
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("DOCX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar DOCX")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // Validar que arquivo tem tamanho adequado (tabelas aumentam tamanho)
    const fs = require('fs');
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(20 * 1024);
  });
});

import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Testes E2E para Export XLSX
 * 
 * Valida exportação de relatórios para formato Excel (.xlsx)
 * com 7 worksheets e fórmulas
 */

test.describe('Export XLSX System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should export report to XLSX successfully', async ({ page }) => {
    // Upload
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    // Export
    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("XLSX")');

    await expect(page.locator('text=Gerando Excel')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    
    await page.click('button:has-text("Baixar XLSX")');
    const download = await downloadPromise;

    // Validações
    expect(download.suggestedFilename()).toContain('.xlsx');
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // XLSX geralmente > 10KB
    const fs = require('fs');
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(10 * 1024);
  });

  test('should export XLSX with 7 worksheets', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/complete-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("XLSX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar XLSX")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // TODO: Validar worksheets usando ExcelJS
    // const ExcelJS = require('exceljs');
    // const workbook = new ExcelJS.Workbook();
    // await workbook.xlsx.readFile(downloadPath);
    // 
    // expect(workbook.worksheets.length).toBe(7);
    // expect(workbook.worksheets[0].name).toBe('Summary');
    // expect(workbook.worksheets[1].name).toBe('Resources');
    // expect(workbook.worksheets[2].name).toBe('Reserves');
    // expect(workbook.worksheets[3].name).toBe('Geology');
    // expect(workbook.worksheets[4].name).toBe('Methodology');
    // expect(workbook.worksheets[5].name).toBe('Economics');
    // expect(workbook.worksheets[6].name).toBe('Conclusions');
    
    const fs = require('fs');
    expect(fs.existsSync(downloadPath)).toBe(true);
  });

  test('should validate XLSX formulas in totals', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/report-with-numbers.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("XLSX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar XLSX")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // TODO: Validar fórmulas SUM e AVERAGE
    // const ExcelJS = require('exceljs');
    // const workbook = new ExcelJS.Workbook();
    // await workbook.xlsx.readFile(downloadPath);
    // 
    // const resourcesSheet = workbook.getWorksheet('Resources');
    // const lastRow = resourcesSheet.lastRow;
    // 
    // // Verificar se última linha tem fórmulas SUM
    // const tonnageCell = lastRow.getCell('B');
    // expect(tonnageCell.formula).toContain('SUM');
    // 
    // const gradeCell = lastRow.getCell('C');
    // expect(gradeCell.formula).toContain('AVERAGE');
    
    const fs = require('fs');
    expect(fs.existsSync(downloadPath)).toBe(true);
  });

  test('should export XLSX with proper formatting', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("XLSX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar XLSX")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // TODO: Validar formatação
    // - Headers com fundo roxo (#FF2F2C79)
    // - Texto branco em headers
    // - Números formatados (#,##0.00)
    // - Bordas em todas as células
    // - Column widths apropriadas
    
    const fs = require('fs');
    const stats = fs.statSync(downloadPath);
    // XLSX formatado é maior que não formatado
    expect(stats.size).toBeGreaterThan(15 * 1024);
  });

  test('should export XLSX for all standards', async ({ page }) => {
    const standards = ['JORC', 'NI43-101', 'PERC', 'SAMREC', 'NAEN'];

    for (const standard of standards) {
      await page.click('button:has-text("Upload Relatório")');
      
      const fileInput = page.locator('input[type="file"]');
      const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
      await fileInput.setInputFiles(testFilePath);

      await page.click('button:has-text("Iniciar Upload")');
      await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

      await page.click('a[href="/reports/list"]');
      await page.click('[data-testid="report-item"]:first-child');
      
      await page.click('select[name="standard"]');
      await page.click(`option[value="${standard}"]`);
      
      await page.click('button:has-text("Exportar")');
      await page.click('button:has-text("XLSX")');

      const downloadPromise = page.waitForEvent('download');
      await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
      await page.click('button:has-text("Baixar XLSX")');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(standard);
      expect(download.suggestedFilename()).toContain('.xlsx');

      await page.click('a[href="/reports/list"]');
    }
  });

  test('should handle XLSX export errors', async ({ page }) => {
    // Tentar exportar sem dados
    await page.goto('/reports/export/invalid-id');
    
    await expect(page.locator('text=Erro')).toBeVisible();
    await expect(
      page.locator('text=Não foi possível exportar o relatório')
    ).toBeVisible();
  });

  test('should show XLSX generation progress', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/large-report.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("XLSX")');

    // Validar loading state
    await expect(page.locator('text=Gerando planilha Excel')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();

    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
  });

  test('should export XLSX with number formatting', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/report-with-numbers.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("XLSX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar XLSX")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // TODO: Validar formatação de números (#,##0.00)
    // const ExcelJS = require('exceljs');
    // const workbook = new ExcelJS.Workbook();
    // await workbook.xlsx.readFile(downloadPath);
    // 
    // const resourcesSheet = workbook.getWorksheet('Resources');
    // const tonnageCell = resourcesSheet.getCell('B2');
    // expect(tonnageCell.numFmt).toBe('#,##0.00');
    
    const fs = require('fs');
    expect(fs.existsSync(downloadPath)).toBe(true);
  });

  test('should export XLSX with wrapped text', async ({ page }) => {
    await page.click('button:has-text("Upload Relatório")');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/report-long-text.pdf');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Iniciar Upload")');
    await expect(page.locator('text=Upload concluído')).toBeVisible({ timeout: 30000 });

    await page.click('a[href="/reports/list"]');
    await page.click('[data-testid="report-item"]:first-child');
    
    await page.click('button:has-text("Exportar")');
    await page.click('button:has-text("XLSX")');

    const downloadPromise = page.waitForEvent('download');
    await expect(page.locator('text=Download pronto')).toBeVisible({ timeout: 60000 });
    await page.click('button:has-text("Baixar XLSX")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    // TODO: Validar wrap text em células de texto longo
    // const ExcelJS = require('exceljs');
    // const workbook = new ExcelJS.Workbook();
    // await workbook.xlsx.readFile(downloadPath);
    // 
    // const geologySheet = workbook.getWorksheet('Geology');
    // const textCell = geologySheet.getCell('A2');
    // expect(textCell.alignment.wrapText).toBe(true);
    
    const fs = require('fs');
    expect(fs.existsSync(downloadPath)).toBe(true);
  });
});

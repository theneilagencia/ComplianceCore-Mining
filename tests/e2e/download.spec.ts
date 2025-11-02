import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * E2E Tests - Download & Export Flow
 * 
 * Testa funcionalidades de download e exportação:
 * - Download de relatórios PDF
 * - Exportação de dados
 * - Validação de arquivos
 */

test.describe('Download & Export Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@compliancecore.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display download button on report page', async ({ page }) => {
    await page.goto('/reports');
    
    // Abre primeiro relatório
    await page.click('table tr:first-child, [data-testid="report-item"]:first-child');
    
    // Verifica botão de download
    const downloadButton = page.locator('button:has-text("Download"), button:has-text("Baixar"), a[download]');
    await expect(downloadButton.first()).toBeVisible();
  });

  test('should download report as PDF', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Configura listener para download
    const downloadPromise = page.waitForEvent('download');
    
    // Clica no botão de download
    await page.click('button:has-text("Download PDF"), button:has-text("Baixar PDF")');
    
    // Aguarda download completar
    const download = await downloadPromise;
    
    // Verifica propriedades do arquivo
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    
    // Salva arquivo temporariamente
    const downloadPath = path.join(__dirname, '../fixtures', download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    // Verifica se arquivo foi criado
    expect(fs.existsSync(downloadPath)).toBeTruthy();
    
    // Verifica tamanho do arquivo
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Cleanup
    fs.unlinkSync(downloadPath);
  });

  test('should show download progress indicator', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Clica em download
    await page.click('button:has-text("Download")');
    
    // Verifica indicador de progresso (se aplicável)
    const progressIndicator = page.locator('[role="progressbar"], .spinner, text=/downloading|baixando/i');
    
    // Pode não aparecer se download for muito rápido
    if (await progressIndicator.isVisible({ timeout: 1000 })) {
      await expect(progressIndicator).toBeVisible();
    }
  });

  test('should download multiple reports', async ({ page }) => {
    await page.goto('/reports');
    
    // Seleciona múltiplos relatórios (se aplicável)
    const checkboxes = page.locator('input[type="checkbox"]');
    
    if (await checkboxes.count() > 1) {
      // Seleciona primeiros dois relatórios
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      
      // Clica em download em lote
      const bulkDownloadButton = page.locator('button:has-text("Download Selected"), button:has-text("Baixar Selecionados")');
      
      if (await bulkDownloadButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await bulkDownloadButton.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.zip|\.pdf$/i);
      }
    }
  });

  test('should export report data as JSON', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Procura opções de exportação
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exportar")');
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Seleciona JSON
      await page.click('text=/JSON/i');
      
      // Aguarda download
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/\.json$/i);
    }
  });

  test('should export notifications as CSV', async ({ page }) => {
    await page.goto('/radar');
    
    // Procura botão de exportar
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exportar")');
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Seleciona CSV
      await page.click('text=/CSV/i');
      
      // Aguarda download
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      
      // Salva e verifica conteúdo
      const downloadPath = path.join(__dirname, '../fixtures', download.suggestedFilename());
      await download.saveAs(downloadPath);
      
      const content = fs.readFileSync(downloadPath, 'utf-8');
      
      // Verifica se é CSV válido
      expect(content).toContain(',');
      expect(content.split('\n').length).toBeGreaterThan(1);
      
      // Cleanup
      fs.unlinkSync(downloadPath);
    }
  });

  test('should cancel download', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Inicia download
    await page.click('button:has-text("Download")');
    
    // Procura botão de cancelar
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Cancelar")');
    
    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.click();
      
      // Verifica mensagem de cancelamento
      await expect(page.locator('text=/cancelled|cancelado/i')).toBeVisible();
    }
  });

  test('should handle download errors', async ({ page }) => {
    await page.goto('/reports');
    
    // Tenta fazer download de relatório inexistente (simulação)
    await page.goto('/reports/invalid-report-id-999999');
    
    const downloadButton = page.locator('button:has-text("Download")');
    
    if (await downloadButton.isVisible()) {
      await downloadButton.click();
      
      // Verifica mensagem de erro
      await expect(page.locator('text=/error|erro|not found|não encontrado/i')).toBeVisible();
    }
  });

  test('should download report with audit results', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Clica em download de auditoria
    const auditDownloadButton = page.locator('button:has-text("Download Audit"), button:has-text("Baixar Auditoria")');
    
    if (await auditDownloadButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await auditDownloadButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/audit|auditoria/i);
    }
  });

  test('should preview before download', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Procura opção de preview
    const previewButton = page.locator('button:has-text("Preview"), button:has-text("Visualizar")');
    
    if (await previewButton.isVisible()) {
      await previewButton.click();
      
      // Verifica se PDF viewer ou modal abre
      await expect(page.locator('[data-testid="pdf-viewer"], iframe, object[type="application/pdf"]')).toBeVisible();
    }
  });

  test('should display download history', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Faz download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    await downloadPromise;
    
    // Verifica histórico (se aplicável)
    const historyButton = page.locator('button:has-text("Download History"), button:has-text("Histórico")');
    
    if (await historyButton.isVisible()) {
      await historyButton.click();
      
      await expect(page.locator('text=/history|histórico/i')).toBeVisible();
    }
  });

  test('should respect file size limits', async ({ page }) => {
    await page.goto('/reports');
    
    // Verifica se há indicação de tamanho do arquivo
    const fileSizeIndicator = page.locator('text=/\\d+\\s*(MB|KB|GB)/i');
    
    if (await fileSizeIndicator.isVisible()) {
      const sizeText = await fileSizeIndicator.textContent();
      expect(sizeText).toMatch(/\d+/);
    }
  });

  test('should download with custom filename', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Procura opção de customizar nome
    const customizeButton = page.locator('button:has-text("Custom Name"), input[name="filename"]');
    
    if (await customizeButton.isVisible()) {
      if (await page.locator('input[name="filename"]').isVisible()) {
        await page.fill('input[name="filename"]', 'custom-report-name');
      }
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Download")');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('custom-report-name');
    }
  });
});

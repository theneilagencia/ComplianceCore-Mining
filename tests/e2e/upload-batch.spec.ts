/**
 * E2E Tests - Batch Upload System
 * 
 * Tests the BatchUploadModal component with multiple file upload scenarios:
 * - Batch upload (3 simultaneous files)
 * - Individual progress tracking for each file
 * - Parallel upload processing
 * - Partial success handling
 * - Batch retry mechanism
 * - Overall progress aggregation
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Batch Upload System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should upload multiple files simultaneously', async ({ page }) => {
    // Click batch upload button
    await page.click('button:has-text("Upload em Lote")');
    
    // Wait for batch modal to appear
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    // Prepare test files
    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    // Upload multiple files
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    // Verify all files are added
    await expect(page.locator('[data-testid="file-item"]')).toHaveCount(3);
    await expect(page.locator('text=report-1.pdf')).toBeVisible();
    await expect(page.locator('text=report-2.pdf')).toBeVisible();
    await expect(page.locator('text=report-3.pdf')).toBeVisible();

    // Click upload button
    await page.click('button:has-text("Enviar Todos")');

    // Wait for batch progress
    await expect(page.locator('[data-testid="batch-progress"]')).toBeVisible();

    // Wait for success message
    await expect(page.locator('text=3 arquivos enviados com sucesso')).toBeVisible({ timeout: 60000 });
  });

  test('should show individual progress for each file', async ({ page }) => {
    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    await page.click('button:has-text("Enviar Todos")');

    // Verify individual progress bars
    const progressBars = page.locator('[data-testid="file-progress"]');
    await expect(progressBars).toHaveCount(3);

    // Verify each file has its own percentage
    for (let i = 0; i < 3; i++) {
      const fileProgress = page.locator(`[data-testid="file-progress-${i}"]`);
      await expect(fileProgress).toBeVisible();
    }
  });

  test('should show overall batch progress', async ({ page }) => {
    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    await page.click('button:has-text("Enviar Todos")');

    // Verify overall progress
    await expect(page.locator('[data-testid="batch-overall-progress"]')).toBeVisible();
    await expect(page.locator('text=0 de 3 concluídos')).toBeVisible();

    // Wait for completion
    await expect(page.locator('text=3 de 3 concluídos')).toBeVisible({ timeout: 60000 });
  });

  test('should handle partial success (some files fail)', async ({ page }) => {
    // Mock API to fail for specific file
    await page.route('**/api/trpc/upload.batch*', (route) => {
      const postData = route.request().postData();
      
      if (postData?.includes('report-2.pdf')) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            error: { message: 'Erro ao processar report-2.pdf' }
          })
        });
      } else {
        route.continue();
      }
    });

    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    await page.click('button:has-text("Enviar Todos")');

    // Wait for partial completion
    await expect(page.locator('text=2 de 3 arquivos enviados com sucesso')).toBeVisible({ timeout: 60000 });

    // Verify error for failed file
    await expect(page.locator('text=1 arquivo com erro')).toBeVisible();
    await expect(page.locator('text=report-2.pdf: Erro ao processar')).toBeVisible();
  });

  test('should allow retrying failed files only', async ({ page }) => {
    // Mock API to fail initially for report-2.pdf
    let attempt = 0;
    await page.route('**/api/trpc/upload.batch*', (route) => {
      const postData = route.request().postData();
      
      if (postData?.includes('report-2.pdf') && attempt === 0) {
        attempt++;
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            error: { message: 'Erro temporário' }
          })
        });
      } else {
        route.continue();
      }
    });

    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    await page.click('button:has-text("Enviar Todos")');

    // Wait for partial completion
    await expect(page.locator('text=2 de 3 arquivos enviados')).toBeVisible({ timeout: 60000 });

    // Click retry button for failed files
    await page.click('button:has-text("Reenviar Arquivos com Erro")');

    // Wait for full completion
    await expect(page.locator('text=3 de 3 arquivos enviados com sucesso')).toBeVisible({ timeout: 30000 });
  });

  test('should allow removing files before upload', async ({ page }) => {
    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    // Verify 3 files added
    await expect(page.locator('[data-testid="file-item"]')).toHaveCount(3);

    // Remove second file
    const removeButton = page.locator('[data-testid="remove-file-1"]');
    await removeButton.click();

    // Verify 2 files remain
    await expect(page.locator('[data-testid="file-item"]')).toHaveCount(2);
    await expect(page.locator('text=report-2.pdf')).not.toBeVisible();
  });

  test('should validate max batch size (10 files)', async ({ page }) => {
    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    // Try to upload more than 10 files
    const testFiles = Array.from({ length: 11 }, (_, i) => 
      path.join(__dirname, `../fixtures/report-${i + 1}.pdf`)
    );
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    // Verify error message
    await expect(page.locator('text=Máximo de 10 arquivos por lote')).toBeVisible();

    // Verify only first 10 files are added
    await expect(page.locator('[data-testid="file-item"]')).toHaveCount(10);
  });

  test('should show estimated total time for batch', async ({ page }) => {
    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    // Verify estimated time is shown
    await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible();
    await expect(page.locator('text=Tempo estimado')).toBeVisible();
  });

  test('should cancel entire batch upload', async ({ page }) => {
    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    await page.click('button:has-text("Enviar Todos")');

    // Wait for upload to start
    await expect(page.locator('[data-testid="batch-progress"]')).toBeVisible();

    // Click cancel batch button
    await page.click('button:has-text("Cancelar Todos")');

    // Verify cancellation
    await expect(page.locator('text=Upload em lote cancelado')).toBeVisible();
    await expect(page.locator('text=Cancelado')).toHaveCount(3);
  });

  test('should show summary after batch completion', async ({ page }) => {
    await page.click('button:has-text("Upload em Lote")');
    await expect(page.locator('[data-testid="batch-upload-modal"]')).toBeVisible();

    const testFiles = [
      path.join(__dirname, '../fixtures/report-1.pdf'),
      path.join(__dirname, '../fixtures/report-2.pdf'),
      path.join(__dirname, '../fixtures/report-3.pdf')
    ];
    
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles(testFiles);

    await page.click('button:has-text("Enviar Todos")');

    // Wait for completion
    await expect(page.locator('text=3 de 3 arquivos enviados com sucesso')).toBeVisible({ timeout: 60000 });

    // Verify summary is shown
    await expect(page.locator('[data-testid="batch-summary"]')).toBeVisible();
    await expect(page.locator('text=Sucesso: 3')).toBeVisible();
    await expect(page.locator('text=Erros: 0')).toBeVisible();
    await expect(page.locator('text=Total: 3')).toBeVisible();
  });
});

/**
 * E2E Tests - Upload Single File System
 * 
 * Tests the UploadModalV2 component with single file upload scenarios:
 * - Basic file upload with progress tracking
 * - File validation (size, type, name)
 * - Success and error states
 * - Retry mechanism (up to 3 attempts)
 * - Upload cancellation
 * - File preview after upload
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Upload Single File System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should upload single PDF file successfully', async ({ page }) => {
    // Click upload button to open modal
    await page.click('button:has-text("Upload")');
    
    // Wait for upload modal to appear
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    // Prepare test file
    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Verify file is added to the list
    await expect(page.locator('[data-testid="file-item"]')).toBeVisible();
    await expect(page.locator('text=sample-report.pdf')).toBeVisible();

    // Click upload button
    await page.click('button:has-text("Enviar")');

    // Wait for progress bar
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

    // Wait for success message
    await expect(page.locator('text=Upload concluído com sucesso')).toBeVisible({ timeout: 30000 });

    // Verify modal closes automatically
    await expect(page.locator('[data-testid="upload-modal"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('should show upload progress with percentage', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    const testFilePath = path.join(__dirname, '../fixtures/large-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Verify progress bar appears
    const progressBar = page.locator('[data-testid="upload-progress"]');
    await expect(progressBar).toBeVisible();

    // Verify percentage is shown
    await expect(page.locator('[data-testid="upload-percentage"]')).toBeVisible();

    // Wait for completion
    await expect(page.locator('text=100%')).toBeVisible({ timeout: 30000 });
  });

  test('should validate file type (only PDF allowed)', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    // Try to upload invalid file type
    const testFilePath = path.join(__dirname, '../fixtures/invalid-file.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Verify error message
    await expect(page.locator('text=Apenas arquivos PDF são permitidos')).toBeVisible();

    // Verify file is not added to list
    await expect(page.locator('[data-testid="file-item"]')).not.toBeVisible();
  });

  test('should validate file size (max 50MB)', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    // Try to upload oversized file
    const testFilePath = path.join(__dirname, '../fixtures/oversized-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Verify error message
    await expect(page.locator('text=Arquivo muito grande')).toBeVisible();
    await expect(page.locator('text=Tamanho máximo: 50MB')).toBeVisible();
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/trpc/upload.single*', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: {
            message: 'Erro ao processar arquivo'
          }
        })
      });
    });

    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Verify error message is shown
    await expect(page.locator('text=Erro ao processar arquivo')).toBeVisible();

    // Verify retry button is available
    await expect(page.locator('button:has-text("Tentar Novamente")')).toBeVisible();
  });

  test('should retry failed upload up to 3 times', async ({ page }) => {
    let attemptCount = 0;

    // Mock API to fail twice, then succeed
    await page.route('**/api/trpc/upload.single*', (route) => {
      attemptCount++;
      if (attemptCount <= 2) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            error: { message: 'Erro temporário' }
          })
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            result: {
              data: {
                id: 'test-upload-id',
                filename: 'sample-report.pdf',
                status: 'success'
              }
            }
          })
        });
      }
    });

    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for first failure
    await expect(page.locator('text=Tentativa 1 de 3')).toBeVisible();

    // Click retry
    await page.click('button:has-text("Tentar Novamente")');

    // Wait for second failure
    await expect(page.locator('text=Tentativa 2 de 3')).toBeVisible();

    // Click retry again
    await page.click('button:has-text("Tentar Novamente")');

    // Wait for success
    await expect(page.locator('text=Upload concluído com sucesso')).toBeVisible({ timeout: 30000 });

    // Verify attempt count
    expect(attemptCount).toBe(3);
  });

  test('should allow canceling upload in progress', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    const testFilePath = path.join(__dirname, '../fixtures/large-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for progress to start
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

    // Click cancel button
    await page.click('button:has-text("Cancelar")');

    // Verify cancellation message
    await expect(page.locator('text=Upload cancelado')).toBeVisible();

    // Verify modal can be closed
    await page.click('button:has-text("Fechar")');
    await expect(page.locator('[data-testid="upload-modal"]')).not.toBeVisible();
  });

  test('should show file preview after successful upload', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for success
    await expect(page.locator('text=Upload concluído com sucesso')).toBeVisible({ timeout: 30000 });

    // Verify preview button is shown
    await expect(page.locator('button:has-text("Visualizar")')).toBeVisible();

    // Click preview button
    await page.click('button:has-text("Visualizar")');

    // Verify PDF viewer appears
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();
  });

  test('should validate filename format', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    // Try to upload file with invalid characters
    const testFilePath = path.join(__dirname, '../fixtures/invalid@name#file.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Verify error message
    await expect(page.locator('text=Nome do arquivo contém caracteres inválidos')).toBeVisible();
  });

  test('should track upload state transitions', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    const testFilePath = path.join(__dirname, '../fixtures/sample-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // State: pending (file selected)
    await expect(page.locator('[data-state="pending"]')).toBeVisible();

    await page.click('button:has-text("Enviar")');

    // State: uploading
    await expect(page.locator('[data-state="uploading"]')).toBeVisible();

    // State: success
    await expect(page.locator('[data-state="success"]')).toBeVisible({ timeout: 30000 });
  });
});

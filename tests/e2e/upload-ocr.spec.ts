/**
 * E2E Tests - OCR Upload System
 * 
 * Tests the OCR (Optical Character Recognition) functionality during upload:
 * - OCR extraction from PDF files
 * - Confidence score validation (> 70%)
 * - Pre-processing optimization
 * - Language detection
 * - Multiple standards detection (JORC, NI43-101, etc.)
 * - Error handling for unreadable files
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('OCR Upload System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should extract text from PDF using OCR', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    // Enable OCR option
    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/scanned-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for OCR processing
    await expect(page.locator('text=Processando OCR')).toBeVisible();

    // Wait for OCR completion
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 60000 });

    // Verify extracted text is shown
    await expect(page.locator('[data-testid="ocr-preview"]')).toBeVisible();
  });

  test('should show OCR confidence score', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/scanned-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for OCR processing
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 60000 });

    // Verify confidence score is displayed
    await expect(page.locator('[data-testid="ocr-confidence"]')).toBeVisible();
    
    // Verify confidence is above threshold
    const confidence = await page.locator('[data-testid="ocr-confidence"]').textContent();
    const confidenceValue = parseInt(confidence?.replace(/\D/g, '') || '0');
    expect(confidenceValue).toBeGreaterThan(70);
  });

  test('should validate minimum OCR confidence (70%)', async ({ page }) => {
    // Mock OCR service to return low confidence
    await page.route('**/api/trpc/ocr.extract*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            data: {
              text: 'Extracted text',
              confidence: 45,
              language: 'eng'
            }
          }
        })
      });
    });

    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/poor-quality.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for low confidence warning
    await expect(page.locator('text=Confiança baixa na extração')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('text=45%')).toBeVisible();
    await expect(page.locator('text=Recomendamos revisar o texto extraído')).toBeVisible();
  });

  test('should detect document language', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/portuguese-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for OCR completion
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 60000 });

    // Verify language detection
    await expect(page.locator('[data-testid="ocr-language"]')).toBeVisible();
    await expect(page.locator('text=Idioma detectado: Português')).toBeVisible();
  });

  test('should detect reporting standard from OCR text', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/jorc-scanned.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for OCR completion
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 60000 });

    // Verify standard detection
    await expect(page.locator('[data-testid="detected-standard"]')).toBeVisible();
    await expect(page.locator('text=Standard detectado: JORC')).toBeVisible();
  });

  test('should show OCR progress for large documents', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/large-scanned-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Verify OCR progress tracking
    await expect(page.locator('[data-testid="ocr-progress"]')).toBeVisible();
    await expect(page.locator('text=Página')).toBeVisible();
    await expect(page.locator('text=de')).toBeVisible();

    // Wait for completion
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 120000 });
  });

  test('should handle OCR errors gracefully', async ({ page }) => {
    // Mock OCR service to return error
    await page.route('**/api/trpc/ocr.extract*', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: {
            message: 'Erro ao processar OCR'
          }
        })
      });
    });

    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/corrupted-scan.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Verify error handling
    await expect(page.locator('text=Erro ao processar OCR')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('button:has-text("Prosseguir sem OCR")')).toBeVisible();
    await expect(page.locator('button:has-text("Tentar Novamente")')).toBeVisible();
  });

  test('should allow manual text correction after OCR', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/scanned-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for OCR completion
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 60000 });

    // Click edit button
    await page.click('button:has-text("Editar Texto Extraído")');

    // Verify text editor appears
    await expect(page.locator('[data-testid="ocr-text-editor"]')).toBeVisible();

    // Edit text
    const editor = page.locator('[data-testid="ocr-text-editor"]');
    await editor.fill('Texto corrigido manualmente');

    // Save changes
    await page.click('button:has-text("Salvar Correções")');

    // Verify changes are saved
    await expect(page.locator('text=Correções salvas')).toBeVisible();
  });

  test('should extract key information from OCR text', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    const testFilePath = path.join(__dirname, '../fixtures/complete-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for OCR completion
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 60000 });

    // Verify extracted key information
    await expect(page.locator('[data-testid="extracted-info"]')).toBeVisible();
    
    // Check for extracted fields
    await expect(page.locator('text=Competent Person')).toBeVisible();
    await expect(page.locator('text=Projeto')).toBeVisible();
    await expect(page.locator('text=Data')).toBeVisible();
  });

  test('should support multiple OCR languages', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    // Select language
    await page.click('select[name="ocrLanguage"]');
    await page.selectOption('select[name="ocrLanguage"]', 'por+eng');

    const testFilePath = path.join(__dirname, '../fixtures/bilingual-report.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Wait for OCR completion
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 60000 });

    // Verify bilingual detection
    await expect(page.locator('text=Idiomas detectados: Português, Inglês')).toBeVisible();
  });

  test('should pre-process images for better OCR results', async ({ page }) => {
    await page.click('button:has-text("Upload")');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    await page.click('input[type="checkbox"][name="enableOCR"]');

    // Enable pre-processing
    await page.click('input[type="checkbox"][name="preprocessImage"]');

    const testFilePath = path.join(__dirname, '../fixtures/low-quality-scan.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.click('button:has-text("Enviar")');

    // Verify pre-processing status
    await expect(page.locator('text=Pré-processando imagem')).toBeVisible();
    await expect(page.locator('text=Ajustando contraste e nitidez')).toBeVisible();

    // Wait for OCR completion
    await expect(page.locator('text=OCR concluído')).toBeVisible({ timeout: 60000 });
  });
});

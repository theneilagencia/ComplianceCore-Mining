/**
 * Enhanced OCR E2E Tests
 * 
 * Tests for ML-powered OCR functionality including:
 * - Image preprocessing
 * - OCR text extraction
 * - Table detection
 * - Text correction
 * - Confidence scoring
 * 
 * @sprint SPRINT5-001
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('Enhanced OCR with ML', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to OCR page (adjust route as needed)
    await page.click('text=OCR Processing');
  });

  test('should process simple document with high confidence', async ({ page }) => {
    // Upload a test document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/simple-document.pdf');

    // Enable all ML features
    await page.check('input[name="enablePreprocessing"]');
    await page.check('input[name="enableTextCorrection"]');

    // Start processing
    await page.click('button:has-text("Process Document")');

    // Wait for processing to complete
    await expect(page.locator('[data-testid="ocr-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify result
    const resultText = await page.locator('[data-testid="ocr-text"]').textContent();
    expect(resultText).toBeTruthy();
    expect(resultText!.length).toBeGreaterThan(10);

    // Verify confidence score
    const confidence = await page.locator('[data-testid="ocr-confidence"]').textContent();
    expect(confidence).toContain('%');
    
    const confidenceValue = parseFloat(confidence!.replace('%', ''));
    expect(confidenceValue).toBeGreaterThanOrEqual(70);
  });

  test('should detect and extract tables', async ({ page }) => {
    // Upload document with tables
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/document-with-tables.pdf');

    // Enable table detection
    await page.check('input[name="enableTableDetection"]');

    // Process
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify tables detected
    const tablesFound = page.locator('[data-testid="tables-detected"]');
    await expect(tablesFound).toBeVisible();
    
    const tableCount = await tablesFound.textContent();
    expect(parseInt(tableCount!)).toBeGreaterThan(0);

    // Verify table structure
    const firstTable = page.locator('[data-testid="table-0"]').first();
    await expect(firstTable).toBeVisible();

    // Check rows and columns
    const rows = await firstTable.locator('tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('should apply text corrections', async ({ page }) => {
    // Upload document with OCR errors
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/document-with-errors.pdf');

    // Enable text correction
    await page.check('input[name="enableTextCorrection"]');

    // Process
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify corrections applied
    const correctionsCount = page.locator('[data-testid="corrections-count"]');
    await expect(correctionsCount).toBeVisible();

    // View corrections list
    await page.click('button:has-text("View Corrections")');
    const correctionsList = page.locator('[data-testid="corrections-list"]');
    await expect(correctionsList).toBeVisible();

    // Verify correction details
    const firstCorrection = correctionsList.locator('[data-testid="correction-item"]').first();
    await expect(firstCorrection).toBeVisible();
    await expect(firstCorrection.locator('[data-testid="original"]')).toBeVisible();
    await expect(firstCorrection.locator('[data-testid="corrected"]')).toBeVisible();
  });

  test('should handle document orientation detection', async ({ page }) => {
    // Upload rotated document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/rotated-document.pdf');

    // Enable preprocessing
    await page.check('input[name="enablePreprocessing"]');

    // Process
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify orientation detected
    const metadata = page.locator('[data-testid="ocr-metadata"]');
    await expect(metadata).toBeVisible();

    const orientation = await metadata.locator('[data-testid="orientation"]').textContent();
    expect(orientation).toMatch(/0°|90°|180°|270°/);
  });

  test('should classify document type', async ({ page }) => {
    // Upload technical report
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/technical-report.pdf');

    // Enable preprocessing
    await page.check('input[name="enablePreprocessing"]');

    // Process
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify document type
    const docType = await page.locator('[data-testid="document-type"]').textContent();
    expect(docType).toBeTruthy();
    expect(['technical-report', 'geological-survey', 'assay-results']).toContain(
      docType
    );
  });

  test('should process batch of documents', async ({ page }) => {
    // Navigate to batch OCR
    await page.click('button:has-text("Batch Processing")');

    // Upload multiple files
    const fileInput = page.locator('input[type="file"][multiple]');
    await fileInput.setInputFiles([
      'tests/fixtures/doc1.pdf',
      'tests/fixtures/doc2.pdf',
      'tests/fixtures/doc3.pdf',
    ]);

    // Start batch processing
    await page.click('button:has-text("Process All")');

    // Monitor progress
    const progressBar = page.locator('[data-testid="batch-progress"]');
    await expect(progressBar).toBeVisible();

    // Wait for completion
    await expect(page.locator('[data-testid="batch-complete"]')).toBeVisible({
      timeout: 90000,
    });

    // Verify all processed
    const processedCount = await page.locator('[data-testid="processed-count"]').textContent();
    expect(processedCount).toBe('3');

    // Verify results table
    const resultsTable = page.locator('[data-testid="batch-results"]');
    await expect(resultsTable).toBeVisible();
    
    const rows = await resultsTable.locator('tbody tr').count();
    expect(rows).toBe(3);
  });

  test('should handle processing errors gracefully', async ({ page }) => {
    // Upload invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/invalid-file.txt');

    // Process
    await page.click('button:has-text("Process Document")');

    // Verify error message
    const errorMessage = page.locator('[data-testid="ocr-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText('Error');
  });

  test('should cancel ongoing processing', async ({ page }) => {
    // Upload large document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/large-document.pdf');

    // Start processing
    await page.click('button:has-text("Process Document")');

    // Wait for progress indicator
    await expect(page.locator('[data-testid="ocr-progress"]')).toBeVisible();

    // Cancel
    await page.click('button:has-text("Cancel")');

    // Verify cancelled state
    await expect(page.locator('[data-testid="ocr-cancelled"]')).toBeVisible();
  });

  test('should show confidence levels with visual indicators', async ({ page }) => {
    // Upload document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/mixed-quality.pdf');

    // Process
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify confidence indicator
    const confidenceIndicator = page.locator('[data-testid="confidence-indicator"]');
    await expect(confidenceIndicator).toBeVisible();

    // Check color coding (high/medium/low)
    const classes = await confidenceIndicator.getAttribute('class');
    expect(classes).toMatch(/text-(green|yellow|red)-600/);
  });

  test('should export OCR results', async ({ page }) => {
    // Process document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/simple-document.pdf');
    
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Export as JSON
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export JSON")'),
    ]);

    const fileName = download.suggestedFilename();
    expect(fileName).toContain('.json');

    // Verify download content
    const path = await download.path();
    const content = readFileSync(path!, 'utf-8');
    const data = JSON.parse(content);

    expect(data.text).toBeTruthy();
    expect(data.confidence).toBeGreaterThanOrEqual(0);
    expect(data.confidence).toBeLessThanOrEqual(1);
  });

  test('should display processing time statistics', async ({ page }) => {
    // Process document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/simple-document.pdf');
    
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify processing time displayed
    const processingTime = page.locator('[data-testid="processing-time"]');
    await expect(processingTime).toBeVisible();

    const timeText = await processingTime.textContent();
    expect(timeText).toMatch(/\d+\s*ms/);
  });

  test('should meet 95% accuracy target on standard documents', async ({ page }) => {
    // Upload high-quality standard document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/standard-document.pdf');

    // Enable all features
    await page.check('input[name="enablePreprocessing"]');
    await page.check('input[name="enableTextCorrection"]');

    // Process
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify accuracy target met
    const confidence = await page.locator('[data-testid="ocr-confidence"]').textContent();
    const confidenceValue = parseFloat(confidence!.replace('%', ''));

    expect(confidenceValue).toBeGreaterThanOrEqual(95);
    console.log(`✅ Accuracy target met: ${confidenceValue}%`);
  });

  test('should process page in under 5 seconds', async ({ page }) => {
    const startTime = Date.now();

    // Upload single page document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/single-page.pdf');

    // Process
    await page.click('button:has-text("Process Document")');
    await expect(page.locator('[data-testid="ocr-result"]')).toBeVisible({
      timeout: 30000,
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    expect(processingTime).toBeLessThan(5000);
    console.log(`✅ Processing time: ${processingTime}ms (target: <5000ms)`);
  });
});

/**
 * Enhanced OCR Service
 * 
 * Advanced OCR service with ML-powered preprocessing, table detection,
 * and text correction for superior accuracy.
 * 
 * Integrates:
 * - ML Preprocessor (layout detection, orientation, quality enhancement)
 * - Tesseract OCR Engine
 * - Table Detector (structure extraction)
 * - Text Corrector (domain-specific corrections)
 * 
 * Target: 95%+ accuracy, <5s per page processing
 * 
 * @module EnhancedOCRService
 * @sprint SPRINT5-001
 */

import Tesseract, { createWorker, Worker } from 'tesseract.js';
import { mlPreprocessor, PreprocessingResult } from './ml-preprocessor.service';
import { tableDetector, TableDetectionResult } from './table-detector.service';
import { textCorrector, CorrectionResult } from './text-corrector.service';

/**
 * OCR processing result
 */
export interface OCRResult {
  text: string;
  confidence: number;
  preprocessing: PreprocessingResult;
  tables: TableDetectionResult;
  corrections: CorrectionResult;
  metadata: OCRMetadata;
  processingTimeMs: number;
}

/**
 * OCR metadata
 */
export interface OCRMetadata {
  pageCount: number;
  language: string;
  documentType: string;
  orientation: number;
  hasTable: boolean;
  tableCount: number;
  wordCount: number;
  characterCount: number;
}

/**
 * OCR processing options
 */
export interface OCROptions {
  language?: string;
  enablePreprocessing?: boolean;
  enableTableDetection?: boolean;
  enableTextCorrection?: boolean;
  confidenceThreshold?: number;
}

/**
 * Enhanced OCR Service with ML capabilities
 */
export class EnhancedOCRService {
  private worker: Worker | null = null;
  private initialized: boolean = false;
  private processingCount: number = 0;

  /**
   * Initialize OCR engine and ML models
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const startTime = Date.now();
    console.log('[EnhancedOCR] Initializing OCR engine and ML models...');

    try {
      // Initialize Tesseract worker
      this.worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[Tesseract] Progress: ${(m.progress * 100).toFixed(0)}%`);
          }
        },
      });

      // Initialize ML models
      await Promise.all([
        mlPreprocessor.initialize(),
        tableDetector.initialize(),
      ]);

      this.initialized = true;
      console.log(`[EnhancedOCR] Initialized in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[EnhancedOCR] Failed to initialize:', error);
      throw new Error('Failed to initialize Enhanced OCR Service');
    }
  }

  /**
   * Process document image with enhanced OCR
   */
  async processImage(
    imageBuffer: Buffer,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    this.processingCount++;
    const jobId = this.processingCount;

    console.log(`[EnhancedOCR] Job #${jobId}: Starting processing...`);

    try {
      const {
        language = 'eng',
        enablePreprocessing = true,
        enableTableDetection = true,
        enableTextCorrection = true,
        confidenceThreshold = 0.7,
      } = options;

      // Step 1: ML-powered preprocessing
      let processedImage = imageBuffer;
      let preprocessing: PreprocessingResult | undefined;

      if (enablePreprocessing) {
        console.log(`[EnhancedOCR] Job #${jobId}: Preprocessing...`);
        preprocessing = await mlPreprocessor.preprocess(imageBuffer);
        processedImage = preprocessing.processedImage;
        console.log(
          `[EnhancedOCR] Job #${jobId}: Preprocessing complete (${preprocessing.documentType}, ${preprocessing.orientation}°)`
        );
      } else {
        // Create minimal preprocessing result
        preprocessing = {
          processedImage: imageBuffer,
          orientation: 0,
          layoutRegions: [],
          documentType: 'general-document',
          confidence: 1.0,
          processingTimeMs: 0,
        };
      }

      // Step 2: Table detection
      let tables: TableDetectionResult | undefined;

      if (enableTableDetection) {
        console.log(`[EnhancedOCR] Job #${jobId}: Detecting tables...`);
        tables = await tableDetector.detectTables(processedImage);
        console.log(`[EnhancedOCR] Job #${jobId}: Found ${tables.totalTablesFound} tables`);
      } else {
        tables = { tables: [], totalTablesFound: 0, processingTimeMs: 0 };
      }

      // Step 3: OCR with Tesseract
      console.log(`[EnhancedOCR] Job #${jobId}: Running OCR...`);
      const ocrStartTime = Date.now();

      if (!this.worker) {
        throw new Error('Tesseract worker not initialized');
      }

      const ocrResult = await this.worker.recognize(processedImage);
      const ocrTimeMs = Date.now() - ocrStartTime;

      console.log(
        `[EnhancedOCR] Job #${jobId}: OCR complete in ${ocrTimeMs}ms (confidence: ${ocrResult.data.confidence.toFixed(2)})`
      );

      // Step 4: Text correction
      let corrections: CorrectionResult | undefined;
      let finalText = ocrResult.data.text;

      if (enableTextCorrection && ocrResult.data.confidence < 0.95) {
        console.log(`[EnhancedOCR] Job #${jobId}: Applying text corrections...`);
        corrections = await textCorrector.correct(
          ocrResult.data.text,
          ocrResult.data.confidence / 100
        );
        finalText = corrections.correctedText;
        console.log(
          `[EnhancedOCR] Job #${jobId}: Applied ${corrections.corrections.length} corrections`
        );
      } else {
        corrections = {
          originalText: finalText,
          correctedText: finalText,
          corrections: [],
          confidenceScore: ocrResult.data.confidence / 100,
          processingTimeMs: 0,
        };
      }

      // Step 5: Build metadata
      const metadata: OCRMetadata = {
        pageCount: 1,
        language,
        documentType: preprocessing.documentType,
        orientation: preprocessing.orientation,
        hasTable: tables.totalTablesFound > 0,
        tableCount: tables.totalTablesFound,
        wordCount: finalText.split(/\s+/).filter((w) => w.length > 0).length,
        characterCount: finalText.length,
      };

      const processingTimeMs = Date.now() - startTime;
      const finalConfidence = Math.min(
        ocrResult.data.confidence / 100,
        corrections.confidenceScore,
        preprocessing.confidence
      );

      console.log(
        `[EnhancedOCR] Job #${jobId}: Processing complete in ${processingTimeMs}ms (confidence: ${finalConfidence.toFixed(2)})`
      );

      return {
        text: finalText,
        confidence: finalConfidence,
        preprocessing,
        tables,
        corrections,
        metadata,
        processingTimeMs,
      };
    } catch (error) {
      console.error(`[EnhancedOCR] Job #${jobId}: Processing failed:`, error);
      throw error;
    }
  }

  /**
   * Process multiple pages
   */
  async processMultipleImages(
    images: Buffer[],
    options: OCROptions = {}
  ): Promise<OCRResult[]> {
    console.log(`[EnhancedOCR] Processing ${images.length} images...`);

    const results: OCRResult[] = [];

    for (let i = 0; i < images.length; i++) {
      console.log(`[EnhancedOCR] Processing page ${i + 1}/${images.length}...`);
      const result = await this.processImage(images[i], options);
      results.push(result);
    }

    console.log(`[EnhancedOCR] Batch processing complete`);
    return results;
  }

  /**
   * Extract tables from image
   */
  async extractTables(imageBuffer: Buffer): Promise<TableDetectionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('[EnhancedOCR] Extracting tables...');
    
    // Preprocess for better table detection
    const preprocessing = await mlPreprocessor.preprocess(imageBuffer);
    const tables = await tableDetector.detectTables(preprocessing.processedImage);

    console.log(`[EnhancedOCR] Extracted ${tables.totalTablesFound} tables`);
    return tables;
  }

  /**
   * Get OCR statistics
   */
  getStatistics(): {
    initialized: boolean;
    totalProcessed: number;
    workerStatus: string;
  } {
    return {
      initialized: this.initialized,
      totalProcessed: this.processingCount,
      workerStatus: this.worker ? 'ready' : 'not-initialized',
    };
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    console.log('[EnhancedOCR] Disposing resources...');

    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }

    await Promise.all([
      mlPreprocessor.dispose(),
      tableDetector.dispose(),
    ]);

    this.initialized = false;
    console.log('[EnhancedOCR] Resources disposed');
  }
}

// Export singleton instance
export const enhancedOCR = new EnhancedOCRService();

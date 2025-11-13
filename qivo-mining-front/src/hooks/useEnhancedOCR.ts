/**
 * Enhanced OCR React Hooks
 * 
 * React hooks for integrating ML-powered OCR functionality
 * into the frontend application.
 * 
 * Features:
 * - Real-time OCR processing with progress
 * - Table extraction
 * - Confidence scoring
 * - Error handling
 * 
 * @module useEnhancedOCR
 * @sprint SPRINT5-001
 */

import { useState, useCallback, useRef } from 'react';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * OCR processing state
 */
export interface OCRState {
  isProcessing: boolean;
  progress: number;
  result: OCRResultData | null;
  error: string | null;
}

/**
 * OCR result data
 */
export interface OCRResultData {
  text: string;
  confidence: number;
  tables: TableData[];
  metadata: {
    documentType: string;
    orientation: number;
    wordCount: number;
    characterCount: number;
    hasTable: boolean;
  };
  corrections: {
    count: number;
    list: Array<{
      original: string;
      corrected: string;
      reason: string;
    }>;
  };
  processingTimeMs: number;
}

/**
 * Table data structure
 */
export interface TableData {
  rows: number;
  columns: number;
  cells: Array<{
    rowIndex: number;
    columnIndex: number;
    text?: string;
    confidence: number;
  }>;
}

/**
 * OCR processing options
 */
export interface OCRProcessOptions {
  enablePreprocessing?: boolean;
  enableTableDetection?: boolean;
  enableTextCorrection?: boolean;
  language?: string;
}

/**
 * Hook for enhanced OCR processing
 * 
 * @example
 * ```tsx
 * const { processImage, state, reset } = useEnhancedOCR();
 * 
 * const handleFileUpload = async (file: File) => {
 *   const result = await processImage(file, {
 *     enablePreprocessing: true,
 *     enableTableDetection: true,
 *   });
 *   console.log('OCR Result:', result);
 * };
 * ```
 */
export function useEnhancedOCR() {
  const [state, setState] = useState<OCRState>({
    isProcessing: false,
    progress: 0,
    result: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Process image with enhanced OCR
   */
  const processImage = useCallback(
    async (
      file: File | Blob,
      options: OCRProcessOptions = {}
    ): Promise<OCRResultData | null> => {
      // Reset state
      setState({
        isProcessing: true,
        progress: 0,
        result: null,
        error: null,
      });

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Convert file to FormData
        const formData = new FormData();
        formData.append('file', file);
        
        if (options.enablePreprocessing !== undefined) {
          formData.append('enablePreprocessing', String(options.enablePreprocessing));
        }
        if (options.enableTableDetection !== undefined) {
          formData.append('enableTableDetection', String(options.enableTableDetection));
        }
        if (options.enableTextCorrection !== undefined) {
          formData.append('enableTextCorrection', String(options.enableTextCorrection));
        }
        if (options.language) {
          formData.append('language', options.language);
        }

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }));
        }, 500);

        // Make API request
        const response = await fetch(`${API_BASE_URL}/api/ocr/process`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          signal: abortControllerRef.current.signal,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'OCR processing failed');
        }

        const result: OCRResultData = await response.json();

        // Update state with result
        setState({
          isProcessing: false,
          progress: 100,
          result,
          error: null,
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';

        setState({
          isProcessing: false,
          progress: 0,
          result: null,
          error: errorMessage,
        });

        console.error('[useEnhancedOCR] Processing failed:', error);
        return null;
      }
    },
    []
  );

  /**
   * Extract tables from image
   */
  const extractTables = useCallback(
    async (file: File | Blob): Promise<TableData[] | null> => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/ocr/extract-tables`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Table extraction failed');
        }

        const { tables } = await response.json();
        setState((prev) => ({ ...prev, isProcessing: false }));

        return tables;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));

        console.error('[useEnhancedOCR] Table extraction failed:', error);
        return null;
      }
    },
    []
  );

  /**
   * Cancel ongoing OCR processing
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      isProcessing: false,
      progress: 0,
      result: null,
      error: 'Processing cancelled',
    });
  }, []);

  /**
   * Reset OCR state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  return {
    processImage,
    extractTables,
    cancel,
    reset,
    state,
    isProcessing: state.isProcessing,
    progress: state.progress,
    result: state.result,
    error: state.error,
  };
}

/**
 * Hook for OCR confidence scoring
 * 
 * Provides utilities for working with OCR confidence scores
 */
export function useOCRConfidence() {
  /**
   * Get confidence level category
   */
  const getConfidenceLevel = useCallback((confidence: number): 'high' | 'medium' | 'low' => {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }, []);

  /**
   * Get confidence color
   */
  const getConfidenceColor = useCallback((confidence: number): string => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  /**
   * Format confidence as percentage
   */
  const formatConfidence = useCallback((confidence: number): string => {
    return `${(confidence * 100).toFixed(1)}%`;
  }, []);

  /**
   * Check if confidence is acceptable
   */
  const isAcceptable = useCallback((confidence: number, threshold = 0.7): boolean => {
    return confidence >= threshold;
  }, []);

  return {
    getConfidenceLevel,
    getConfidenceColor,
    formatConfidence,
    isAcceptable,
  };
}

/**
 * Hook for batch OCR processing
 * 
 * Process multiple files in parallel with progress tracking
 */
export function useBatchOCR() {
  const [batchState, setBatchState] = useState<{
    isProcessing: boolean;
    totalFiles: number;
    processedFiles: number;
    results: OCRResultData[];
    errors: Array<{ file: string; error: string }>;
  }>({
    isProcessing: false,
    totalFiles: 0,
    processedFiles: 0,
    results: [],
    errors: [],
  });

  /**
   * Process multiple files
   */
  const processBatch = useCallback(
    async (
      files: File[],
      options: OCRProcessOptions = {}
    ): Promise<OCRResultData[]> => {
      setBatchState({
        isProcessing: true,
        totalFiles: files.length,
        processedFiles: 0,
        results: [],
        errors: [],
      });

      const results: OCRResultData[] = [];
      const errors: Array<{ file: string; error: string }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          const formData = new FormData();
          formData.append('file', file);

          Object.entries(options).forEach(([key, value]) => {
            formData.append(key, String(value));
          });

          const response = await fetch(`${API_BASE_URL}/api/ocr/process`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('OCR processing failed');
          }

          const result: OCRResultData = await response.json();
          results.push(result);

          setBatchState((prev) => ({
            ...prev,
            processedFiles: i + 1,
            results: [...prev.results, result],
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          errors.push({ file: file.name, error: errorMessage });

          setBatchState((prev) => ({
            ...prev,
            processedFiles: i + 1,
            errors: [...prev.errors, { file: file.name, error: errorMessage }],
          }));
        }
      }

      setBatchState((prev) => ({
        ...prev,
        isProcessing: false,
      }));

      return results;
    },
    []
  );

  /**
   * Reset batch state
   */
  const resetBatch = useCallback(() => {
    setBatchState({
      isProcessing: false,
      totalFiles: 0,
      processedFiles: 0,
      results: [],
      errors: [],
    });
  }, []);

  /**
   * Get batch progress percentage
   */
  const getBatchProgress = useCallback((): number => {
    if (batchState.totalFiles === 0) return 0;
    return (batchState.processedFiles / batchState.totalFiles) * 100;
  }, [batchState]);

  return {
    processBatch,
    resetBatch,
    getBatchProgress,
    batchState,
    isProcessing: batchState.isProcessing,
    progress: getBatchProgress(),
  };
}

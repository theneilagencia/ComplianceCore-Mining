/**
 * Parsing Job Queue
 * 
 * In-memory job queue for processing file parsing in background
 * 
 * Features:
 * - Async job processing
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Real-time progress events via SSE
 * - Concurrent job processing with limits
 * 
 * In production, replace with Bull/BullMQ + Redis for:
 * - Persistence across restarts
 * - Horizontal scaling
 * - Advanced job management
 */

import { getDb } from '../../../db';
import { reports } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  emitParsingStarted,
  emitParsingProgress,
  emitParsingCompleted,
  emitParsingFailed,
  emitReviewRequired,
  emitAuditReady,
} from './event-emitter';
import { parseAndNormalize, saveNormalizedToS3 } from './parsing';

interface ParsingJob {
  id: string;
  reportId: string;
  tenantId: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

class ParsingJobQueue {
  private queue: ParsingJob[] = [];
  private processing: Set<string> = new Set();
  private maxConcurrent: number = 3; // Process max 3 files simultaneously
  private isRunning: boolean = false;

  constructor() {
    // Start the queue processor
    this.start();
  }

  /**
   * Add a new parsing job to the queue
   */
  async enqueue(
    reportId: string,
    tenantId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<void> {
    const job: ParsingJob = {
      id: `job_${reportId}_${Date.now()}`,
      reportId,
      tenantId,
      fileName,
      fileBuffer,
      mimeType,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      status: 'pending',
    };

    this.queue.push(job);
    console.log(`[ParsingQueue] Job enqueued: ${job.id} (${fileName}) - Queue length: ${this.queue.length}`);

    // Emit event
    emitParsingStarted(reportId, fileName);

    // Trigger processing
    this.processNext();
  }

  /**
   * Start the queue processor
   */
  private start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[ParsingQueue] Queue processor started');
  }

  /**
   * Stop the queue processor (for graceful shutdown)
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('[ParsingQueue] Queue processor stopping...');
    
    // Wait for all processing jobs to complete (max 30s)
    const timeout = Date.now() + 30000;
    while (this.processing.size > 0 && Date.now() < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('[ParsingQueue] Queue processor stopped');
  }

  /**
   * Process next job in queue if capacity available
   */
  private async processNext(): Promise<void> {
    if (!this.isRunning) return;
    if (this.processing.size >= this.maxConcurrent) return;

    const job = this.queue.find(j => j.status === 'pending');
    if (!job) return;

    // Mark as processing
    job.status = 'processing';
    this.processing.add(job.id);

    // Process job in background
    this.processJob(job)
      .finally(() => {
        this.processing.delete(job.id);
        this.processNext(); // Try to process next job
      });
  }

  /**
   * Process a single parsing job
   */
  private async processJob(job: ParsingJob): Promise<void> {
    const { reportId, tenantId, fileName, fileBuffer, mimeType } = job;
    
    console.log(`[ParsingQueue] Processing job ${job.id} (attempt ${job.attempts + 1}/${job.maxAttempts})`);
    
    try {
      job.attempts++;

      // Stage 1: Parse file (25% progress)
      emitParsingProgress(reportId, 25, 'Lendo arquivo...');
      
      // Extrair texto do arquivo baseado no tipo
      let fileText: string;
      if (mimeType === 'application/pdf') {
        // Para PDFs, tentar extrair texto básico (melhorar depois com biblioteca)
        // Por enquanto, usar nome do arquivo como fallback principal
        fileText = fileBuffer.toString('utf-8', 0, Math.min(10000, fileBuffer.length));
        // Se o texto extraído for muito pequeno ou parecer binário, usar apenas nome do arquivo
        if (fileText.length < 100 || !/[a-zA-Z]{10,}/.test(fileText)) {
          fileText = ''; // Forçar uso do nome do arquivo
        }
      } else {
        // Para outros tipos, converter buffer para string
        fileText = fileBuffer.toString('utf-8');
      }
      
      const parsingResult: any = await Promise.race([
        parseAndNormalize(fileText, mimeType, reportId, tenantId, fileName),
        this.timeout(120000, 'Parsing timeout após 2 minutos'), // 2 min timeout
      ]);

      // Stage 2: Normalize data (50% progress)
      emitParsingProgress(reportId, 50, 'Normalizando dados...');
      
      // Give parsing result time to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 3: Save to S3 (75% progress)
      emitParsingProgress(reportId, 75, 'Salvando dados normalizados...');
      
      const normalizedUrl: any = await Promise.race([
        saveNormalizedToS3(parsingResult.normalized, tenantId, reportId),
        this.timeout(30000, 'S3 upload timeout após 30 segundos'),
      ]);

      // Stage 4: Update database (90% progress)
      emitParsingProgress(reportId, 90, 'Atualizando banco de dados...');
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Validar standard antes de salvar (garantir que é um valor válido do enum)
      const validStandards = ['JORC_2012', 'NI_43_101', 'PERC', 'SAMREC', 'CRIRSCO', 'CBRR', 'SEC_SK_1300'] as const;
      const detectedStandard = validStandards.includes(parsingResult.summary.detectedStandard as any)
        ? parsingResult.summary.detectedStandard
        : 'JORC_2012'; // Fallback para JORC_2012 se inválido

      await db
        .update(reports)
        .set({
          detectedStandard: detectedStandard as any,
          standard: detectedStandard as any,
          status: (parsingResult.status === 'needs_review' ? 'needs_review' : 'ready_for_audit') as any,
          s3NormalizedUrl: normalizedUrl,
          parsingSummary: {
            ...parsingResult.summary,
            detectedStandard: detectedStandard, // Garantir que o summary também tenha valor válido
            attemptCount: job.attempts,
            parsedAt: new Date().toISOString(),
          },
        })
        .where(eq(reports.id, reportId));

      // Complete (100% progress)
      emitParsingProgress(reportId, 100, 'Concluído!');
      
      // Emit completion event
      emitParsingCompleted(reportId, parsingResult.status, parsingResult.summary);

      // Emit additional events based on status
      if (parsingResult.status === 'needs_review') {
        const uncertainFieldsCount = parsingResult.summary.uncertainFields || 0;
        emitReviewRequired(reportId, uncertainFieldsCount);
      } else {
        emitAuditReady(reportId, parsingResult.summary.detectedStandard);
      }

      // Mark job as completed
      job.status = 'completed';
      this.removeFromQueue(job.id);

      console.log(`[ParsingQueue] Job ${job.id} completed successfully`);

    } catch (error: any) {
      console.error(`[ParsingQueue] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, error);

      // Check if should retry
      const shouldRetry = job.attempts < job.maxAttempts && this.isRetryableError(error);

      if (shouldRetry) {
        // Calculate backoff delay: 2^attempts * 1000ms (1s, 2s, 4s, 8s...)
        const delayMs = Math.pow(2, job.attempts) * 1000;
        
        console.log(`[ParsingQueue] Retrying job ${job.id} in ${delayMs}ms`);
        
        emitParsingProgress(
          reportId,
          0,
          `Erro encontrado. Tentando novamente (${job.attempts + 1}/${job.maxAttempts})...`
        );

        // Reset to pending after delay
        setTimeout(() => {
          job.status = 'pending';
          this.processNext();
        }, delayMs);

      } else {
        // Job failed permanently
        job.status = 'failed';
        job.error = error.message;

        // Update database
        try {
          const db = await getDb();
          if (db) {
            await db
              .update(reports)
              .set({
                status: 'parsing_failed' as any,
                parsingSummary: {
                  error: error.message,
                  errorStack: error.stack,
                  failedAt: new Date().toISOString(),
                  attemptCount: job.attempts,
                  detectedStandard: 'JORC_2012',
                  confidence: 0,
                  warnings: ['Parsing failed after all retry attempts'],
                  totalFields: 0,
                  uncertainFields: 0,
                } as any,
              })
              .where(eq(reports.id, reportId));
          }
        } catch (dbError) {
          console.error('[ParsingQueue] Failed to update DB with error status:', dbError);
        }

        // Emit failure event
        const retryable = job.attempts < job.maxAttempts;
        emitParsingFailed(reportId, error.message, retryable);

        // Remove from queue
        this.removeFromQueue(job.id);

        console.log(`[ParsingQueue] Job ${job.id} failed permanently`);
      }
    }
  }

  /**
   * Remove job from queue
   */
  private removeFromQueue(jobId: string): void {
    const index = this.queue.findIndex(j => j.id === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      console.log(`[ParsingQueue] Job ${jobId} removed from queue - Remaining: ${this.queue.length}`);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Don't retry validation errors
    if (errorMessage.includes('invalid file') || 
        errorMessage.includes('unsupported format') ||
        errorMessage.includes('corrupted')) {
      return false;
    }
    
    // Retry network/timeout errors
    return true;
  }

  /**
   * Timeout helper
   */
  private timeout<T>(ms: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Get queue status (for monitoring)
   */
  getStatus(): {
    queueLength: number;
    processing: number;
    maxConcurrent: number;
    jobs: Array<{ id: string; reportId: string; fileName: string; status: string; attempts: number }>;
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      jobs: this.queue.map(j => ({
        id: j.id,
        reportId: j.reportId,
        fileName: j.fileName,
        status: j.status,
        attempts: j.attempts,
      })),
    };
  }
}

// Singleton instance
export const parsingQueue = new ParsingJobQueue();

// Export for graceful shutdown
export const shutdownParsingQueue = () => parsingQueue.stop();

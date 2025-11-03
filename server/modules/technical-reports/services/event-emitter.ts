/**
 * Event Emitter Service for Upload Pipeline
 * 
 * Provides real-time event broadcasting for:
 * - Upload progress
 * - Parsing status
 * - Review requirements
 * - Audit readiness
 * 
 * Events are broadcast via Server-Sent Events (SSE) to subscribed clients
 */

import { EventEmitter } from 'events';

export type UploadPipelineEvent =
  | { type: 'upload.completed'; data: { reportId: string; uploadId: string; fileName: string } }
  | { type: 'parsing.started'; data: { reportId: string; fileName: string } }
  | { type: 'parsing.progress'; data: { reportId: string; progress: number; stage: string } }
  | { type: 'parsing.completed'; data: { reportId: string; status: 'needs_review' | 'ready_for_audit'; summary: any } }
  | { type: 'parsing.failed'; data: { reportId: string; error: string; retryable: boolean } }
  | { type: 'review.required'; data: { reportId: string; uncertainFieldsCount: number } }
  | { type: 'review.completed'; data: { reportId: string; newStatus: string } }
  | { type: 'audit.ready'; data: { reportId: string; standard: string } }
  | { type: 'audit.started'; data: { reportId: string; auditId: string } }
  | { type: 'audit.completed'; data: { reportId: string; auditId: string; score: number } };

/**
 * Global event emitter instance
 * In production, replace with Redis pub/sub for horizontal scaling
 */
class UploadPipelineEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Support many concurrent uploads
  }

  /**
   * Emit an upload pipeline event
   */
  emit(eventName: string, event: UploadPipelineEvent): boolean {
    console.log(`[EventEmitter] Emitting: ${event.type} for report ${this.extractReportId(event)}`);
    return super.emit(eventName, event);
  }

  /**
   * Subscribe to events for a specific report
   */
  subscribeToReport(reportId: string, callback: (event: UploadPipelineEvent) => void): () => void {
    const wrappedCallback = (event: UploadPipelineEvent) => {
      if (this.extractReportId(event) === reportId) {
        callback(event);
      }
    };

    this.on('pipeline:event', wrappedCallback);

    // Return unsubscribe function
    return () => {
      this.off('pipeline:event', wrappedCallback);
    };
  }

  /**
   * Broadcast event to all subscribers of a report
   */
  broadcastToReport(reportId: string, event: UploadPipelineEvent): void {
    this.emit('pipeline:event', event);
  }

  /**
   * Extract reportId from event
   */
  private extractReportId(event: UploadPipelineEvent): string {
    return event.data.reportId;
  }
}

// Singleton instance
export const uploadPipelineEmitter = new UploadPipelineEventEmitter();

/**
 * Helper functions to emit specific events
 */

export const emitUploadCompleted = (reportId: string, uploadId: string, fileName: string) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'upload.completed',
    data: { reportId, uploadId, fileName },
  });
};

export const emitParsingStarted = (reportId: string, fileName: string) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'parsing.started',
    data: { reportId, fileName },
  });
};

export const emitParsingProgress = (reportId: string, progress: number, stage: string) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'parsing.progress',
    data: { reportId, progress, stage },
  });
};

export const emitParsingCompleted = (
  reportId: string,
  status: 'needs_review' | 'ready_for_audit',
  summary: any
) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'parsing.completed',
    data: { reportId, status, summary },
  });
};

export const emitParsingFailed = (reportId: string, error: string, retryable: boolean = true) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'parsing.failed',
    data: { reportId, error, retryable },
  });
};

export const emitReviewRequired = (reportId: string, uncertainFieldsCount: number) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'review.required',
    data: { reportId, uncertainFieldsCount },
  });
};

export const emitReviewCompleted = (reportId: string, newStatus: string) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'review.completed',
    data: { reportId, newStatus },
  });
};

export const emitAuditReady = (reportId: string, standard: string) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'audit.ready',
    data: { reportId, standard },
  });
};

export const emitAuditStarted = (reportId: string, auditId: string) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'audit.started',
    data: { reportId, auditId },
  });
};

export const emitAuditCompleted = (reportId: string, auditId: string, score: number) => {
  uploadPipelineEmitter.broadcastToReport(reportId, {
    type: 'audit.completed',
    data: { reportId, auditId, score },
  });
};

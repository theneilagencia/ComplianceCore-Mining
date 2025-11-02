/**
 * SSE Integration with Webhook System
 * 
 * Automatically broadcasts webhook events via SSE
 * 
 * @module sse-webhook-integration
 * @sprint SPRINT5-003
 */

import { sseService, SSEEventType } from './sse.service';

/**
 * Webhook to SSE Event Type mapping
 */
const WEBHOOK_TO_SSE_MAPPING: Record<string, SSEEventType> = {
  // Report events
  'report.created': SSEEventType.REPORT_CREATED,
  'report.updated': SSEEventType.REPORT_UPDATED,
  'report.deleted': SSEEventType.REPORT_DELETED,
  'report.exported': SSEEventType.REPORT_EXPORTED,
  
  // Upload events
  'upload.started': SSEEventType.UPLOAD_STARTED,
  'upload.progress': SSEEventType.UPLOAD_PROGRESS,
  'upload.completed': SSEEventType.UPLOAD_COMPLETED,
  'upload.failed': SSEEventType.UPLOAD_FAILED,
  
  // OCR events
  'ocr.started': SSEEventType.OCR_STARTED,
  'ocr.progress': SSEEventType.OCR_PROGRESS,
  'ocr.completed': SSEEventType.OCR_COMPLETED,
  'ocr.failed': SSEEventType.OCR_FAILED,
  
  // Export events
  'export.started': SSEEventType.EXPORT_STARTED,
  'export.progress': SSEEventType.EXPORT_PROGRESS,
  'export.completed': SSEEventType.EXPORT_COMPLETED,
  'export.failed': SSEEventType.EXPORT_FAILED,
};

/**
 * Setup webhook to SSE integration
 * 
 * Listens to webhook events and broadcasts them via SSE
 */
export function setupWebhookIntegration(): void {
  try {
    // Import webhook service dynamically to avoid circular dependencies
    const { webhookService } = require('../webhooks/webhook.service');

    console.log('[SSE] Setting up webhook integration...');

    // Listen to all webhook events
    webhookService.on('event', (payload: any) => {
      const sseEventType = WEBHOOK_TO_SSE_MAPPING[payload.event];

      if (!sseEventType) {
        // console.log(`[SSE] No SSE mapping for webhook event: ${payload.event}`);
        return;
      }

      console.log(`[SSE] Broadcasting webhook event: ${payload.event} → ${sseEventType}`);

      // Broadcast to all clients
      sseService.broadcast({
        type: sseEventType,
        data: payload.data,
        metadata: {
          webhookEvent: payload.event,
          webhookId: payload.id,
          timestamp: payload.timestamp,
        },
      });

      // If user ID is present, also send to specific user
      if (payload.data?.userId) {
        sseService.sendToUser(payload.data.userId, {
          type: sseEventType,
          data: payload.data,
          metadata: {
            webhookEvent: payload.event,
            webhookId: payload.id,
            timestamp: payload.timestamp,
          },
        });
      }
    });

    console.log('[SSE] Webhook integration complete');
  } catch (error) {
    console.error('[SSE] Failed to setup webhook integration:', error);
  }
}

/**
 * Trigger SSE event manually (helper function)
 */
export function triggerSSEEvent(
  type: SSEEventType,
  data: any,
  userId?: string
): void {
  if (userId) {
    sseService.sendToUser(userId, { type, data });
  } else {
    sseService.broadcast({ type, data });
  }
}

/**
 * Send notification via SSE
 */
export function sendNotification(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
  userId?: string,
  metadata?: Record<string, any>
): void {
  const data = {
    message,
    type,
    ...metadata,
  };

  if (userId) {
    sseService.sendToUser(userId, {
      type: SSEEventType.NOTIFICATION,
      data,
    });
  } else {
    sseService.broadcast({
      type: SSEEventType.NOTIFICATION,
      data,
    });
  }
}

/**
 * Send system status update
 */
export function sendSystemStatus(
  status: 'healthy' | 'degraded' | 'down',
  message?: string,
  metadata?: Record<string, any>
): void {
  sseService.broadcast({
    type: SSEEventType.SYSTEM_STATUS,
    data: {
      status,
      message,
      ...metadata,
    },
  });
}

/**
 * Send cache invalidation notification
 */
export function sendCacheInvalidation(
  pattern: string,
  count: number
): void {
  sseService.broadcast({
    type: SSEEventType.CACHE_INVALIDATED,
    data: {
      pattern,
      count,
      timestamp: Date.now(),
    },
  });
}

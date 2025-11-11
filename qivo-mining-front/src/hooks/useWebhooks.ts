import { useEffect, useCallback, useRef } from 'react';
import { notifications } from '@/components/NotificationCenter';

/**
 * Webhook Event Types
 */
export enum WebhookEvent {
  UPLOAD_STARTED = 'upload.started',
  UPLOAD_COMPLETED = 'upload.completed',
  UPLOAD_FAILED = 'upload.failed',
  BATCH_COMPLETED = 'batch.completed',
  EXPORT_COMPLETED = 'export.completed',
  EXPORT_FAILED = 'export.failed',
  OCR_COMPLETED = 'ocr.completed',
  PROCESSING_FAILED = 'processing.failed',
}

/**
 * Webhook Event Payload
 */
export interface WebhookEventPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Webhook Event Handler
 */
type WebhookEventHandler = (payload: WebhookEventPayload) => void;

/**
 * Webhook Subscription Options
 */
interface WebhookSubscriptionOptions {
  events: WebhookEvent[];
  onEvent?: WebhookEventHandler;
  showNotification?: boolean;
}

/**
 * Use Webhooks Hook
 * 
 * Manages webhook subscriptions and event handling
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useWebhooks({
 *     events: [WebhookEvent.UPLOAD_COMPLETED],
 *     onEvent: (payload) => {
 *       console.log('Upload completed:', payload.data);
 *     },
 *     showNotification: true,
 *   });
 * }
 * ```
 */
export function useWebhooks(options: WebhookSubscriptionOptions) {
  const { events, onEvent, showNotification = true } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<Map<WebhookEvent, WebhookEventHandler[]>>(new Map());

  /**
   * Subscribe to event
   */
  const subscribe = useCallback((event: WebhookEvent, handler: WebhookEventHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, []);
    }
    handlersRef.current.get(event)!.push(handler);
  }, []);

  /**
   * Unsubscribe from event
   */
  const unsubscribe = useCallback((event: WebhookEvent, handler: WebhookEventHandler) => {
    const handlers = handlersRef.current.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }, []);

  /**
   * Handle webhook event
   */
  const handleEvent = useCallback((payload: WebhookEventPayload) => {
    console.log('[Webhook] Event received:', payload.event, payload.data);

    // Call custom handler
    if (onEvent) {
      onEvent(payload);
    }

    // Call subscribed handlers
    const handlers = handlersRef.current.get(payload.event);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }

    // Show notification
    if (showNotification) {
      handleNotification(payload);
    }
  }, [onEvent, showNotification]);

  /**
   * Handle notification display
   */
  const handleNotification = (payload: WebhookEventPayload) => {
    const { event, data } = payload;

    switch (event) {
      case WebhookEvent.UPLOAD_COMPLETED:
        notifications.uploadCompleted(
          data.fileName || 'File',
          data.reportId
        );
        break;

      case WebhookEvent.BATCH_COMPLETED:
        notifications.batchCompleted(
          data.successCount || 0,
          data.totalCount || 0
        );
        break;

      case WebhookEvent.EXPORT_COMPLETED:
        notifications.exportCompleted(
          data.format || 'PDF',
          data.fileUrl
        );
        break;

      case WebhookEvent.OCR_COMPLETED:
        notifications.ocrCompleted(
          data.confidence || 0
        );
        break;

      case WebhookEvent.UPLOAD_FAILED:
      case WebhookEvent.EXPORT_FAILED:
      case WebhookEvent.PROCESSING_FAILED:
        notifications.processingFailed(
          data.fileName || 'File',
          data.error || 'Unknown error'
        );
        break;

      case WebhookEvent.UPLOAD_STARTED:
        notifications.info(
          'Upload Started',
          `Uploading ${data.fileName || 'file'}...`
        );
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }
  };

  /**
   * Connect to webhook server (Server-Sent Events)
   */
  useEffect(() => {
    // In production, connect to SSE endpoint
    // For now, simulate with polling
    
    const simulateWebhook = () => {
      // This would be replaced with actual SSE connection
      // const eventSource = new EventSource('/api/webhooks/stream');
      
      // eventSource.onmessage = (event) => {
      //   const payload: WebhookEventPayload = JSON.parse(event.data);
      //   handleEvent(payload);
      // };
      
      // return eventSource;
    };

    // Subscribe to events
    events.forEach(event => {
      if (onEvent) {
        subscribe(event, onEvent);
      }
    });

    // Connect to webhook server
    // eventSourceRef.current = simulateWebhook();
    simulateWebhook();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Unsubscribe from events
      events.forEach(event => {
        if (onEvent) {
          unsubscribe(event, onEvent);
        }
      });
    };
  }, [events, onEvent, subscribe, unsubscribe]);

  return {
    subscribe,
    unsubscribe,
  };
}

/**
 * Use Webhook Event Hook
 * 
 * Simplified hook for subscribing to a single event
 * 
 * @example
 * ```tsx
 * useWebhookEvent(WebhookEvent.UPLOAD_COMPLETED, (payload) => {
 *   console.log('Upload completed!', payload.data);
 * });
 * ```
 */
export function useWebhookEvent(
  event: WebhookEvent,
  handler: WebhookEventHandler,
  showNotification: boolean = true
) {
  useWebhooks({
    events: [event],
    onEvent: handler,
    showNotification,
  });
}

/**
 * Trigger Webhook Event (for testing)
 * 
 * @example
 * ```tsx
 * triggerWebhook(WebhookEvent.UPLOAD_COMPLETED, {
 *   fileName: 'test.pdf',
 *   reportId: 'report-123',
 * });
 * ```
 */
export function triggerWebhook(event: WebhookEvent, data: any) {
  const payload: WebhookEventPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Dispatch custom event
  const customEvent = new CustomEvent('webhook', { detail: payload });
  window.dispatchEvent(customEvent);

  console.log('[Webhook] Triggered:', event, data);
}

/**
 * Global Webhook Listener
 * 
 * Listens to all webhook events globally
 */
export function setupWebhookListener() {
  window.addEventListener('webhook', (event: any) => {
    const payload: WebhookEventPayload = event.detail;
    
    // Trigger notification
    const customEvent = new CustomEvent(payload.event, { detail: payload });
    window.dispatchEvent(customEvent);
  });

  console.log('[Webhook] Global listener initialized');
}

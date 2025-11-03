import { EventEmitter } from 'events';
import crypto from 'crypto';
// import { db } from '@/db';
// import { webhooks, webhookEvents } from '@/db/schema';
// import { eq, and, desc } from 'drizzle-orm';

// Mock DB for now - replace with actual implementation
const db: any = {
  insert: () => ({ values: () => ({ returning: () => Promise.resolve([{ id: 'mock-id' }]) }) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  delete: () => ({ where: () => Promise.resolve() }),
  select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => Promise.resolve([]) }) }) }) }),
  raw: (sql: string) => sql,
};

const webhooks: any = {};
const webhookEvents: any = {};
const eq = (a: any, b: any) => ({ a, b });
const desc = (a: any) => a;

/**
 * Webhook Event Types
 */
export enum WebhookEventType {
  // Upload events
  UPLOAD_STARTED = 'upload.started',
  UPLOAD_COMPLETED = 'upload.completed',
  UPLOAD_FAILED = 'upload.failed',
  UPLOAD_RETRY = 'upload.retry',
  
  // Batch events
  BATCH_STARTED = 'batch.started',
  BATCH_COMPLETED = 'batch.completed',
  BATCH_PARTIAL = 'batch.partial',
  
  // Processing events
  PROCESSING_STARTED = 'processing.started',
  PROCESSING_COMPLETED = 'processing.completed',
  PROCESSING_FAILED = 'processing.failed',
  
  // Export events
  EXPORT_STARTED = 'export.started',
  EXPORT_COMPLETED = 'export.completed',
  EXPORT_FAILED = 'export.failed',
  EXPORT_CANCELED = 'export.canceled',
  
  // OCR events
  OCR_STARTED = 'ocr.started',
  OCR_COMPLETED = 'ocr.completed',
  OCR_FAILED = 'ocr.failed',
  
  // Template events
  TEMPLATE_CREATED = 'template.created',
  TEMPLATE_UPDATED = 'template.updated',
  TEMPLATE_DELETED = 'template.deleted',
}

/**
 * Webhook Payload Interface
 */
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: Date;
  data: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Webhook Configuration
 */
export interface WebhookConfig {
  url: string;
  events: WebhookEventType[];
  secret?: string;
  enabled: boolean;
  retryAttempts?: number;
  timeout?: number;
}

/**
 * Webhook Delivery Result
 */
export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  attempt: number;
}

/**
 * Webhook Service
 * Manages webhook subscriptions and event delivery
 */
export class WebhookService {
  private eventEmitter: EventEmitter;
  private deliveryQueue: Map<string, WebhookPayload[]>;
  
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.deliveryQueue = new Map();
    
    // Set max listeners to avoid warnings
    this.eventEmitter.setMaxListeners(100);
    
    // Start delivery worker
    this.startDeliveryWorker();
  }

  /**
   * Register a webhook
   */
  async registerWebhook(
    userId: string,
    config: WebhookConfig
  ): Promise<string> {
    const [webhook] = await db.insert(webhooks).values({
      userId,
      url: config.url,
      events: config.events,
      secret: config.secret,
      enabled: config.enabled,
      retryAttempts: config.retryAttempts || 3,
      timeout: config.timeout || 30000,
    }).returning();

    // Subscribe to events
    config.events.forEach((event) => {
      this.subscribeToEvent(webhook.id, event);
    });

    return webhook.id;
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(
    webhookId: string,
    config: Partial<WebhookConfig>
  ): Promise<void> {
    await db.update(webhooks)
      .set({
        ...config,
        updatedAt: new Date(),
      })
      .where(eq(webhooks.id, webhookId));

    // Re-subscribe if events changed
    if (config.events) {
      this.unsubscribeFromAllEvents(webhookId);
      config.events.forEach((event) => {
        this.subscribeToEvent(webhookId, event);
      });
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, webhookId));
    this.unsubscribeFromAllEvents(webhookId);
  }

  /**
   * Get user webhooks
   */
  async getUserWebhooks(userId: string): Promise<any[]> {
    return db.select()
      .from(webhooks)
      .where(eq(webhooks.userId, userId))
      .orderBy(desc(webhooks.createdAt));
  }

  /**
   * Emit webhook event
   */
  async emitEvent(payload: WebhookPayload): Promise<void> {
    console.log(`[Webhook] Emitting event: ${payload.event}`);
    
    // Get all webhooks subscribed to this event
    const subscribedWebhooks = await this.getSubscribedWebhooks(
      payload.event,
      payload.userId
    );

    // Queue delivery for each webhook
    for (const webhook of subscribedWebhooks) {
      if (webhook.enabled) {
        await this.queueDelivery(webhook.id, payload);
      }
    }

    // Emit to internal listeners
    this.eventEmitter.emit(payload.event, payload);
  }

  /**
   * Subscribe to webhook event (internal)
   */
  subscribe(
    event: WebhookEventType,
    callback: (payload: WebhookPayload) => void
  ): () => void {
    this.eventEmitter.on(event, callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(event, callback);
    };
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(
    webhookId: string,
    limit: number = 50
  ): Promise<any[]> {
    return db.select()
      .from(webhookEvents)
      .where(eq(webhookEvents.webhookId, webhookId))
      .orderBy(desc(webhookEvents.createdAt))
      .limit(limit);
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(eventId: string): Promise<void> {
    const [event] = await db.select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId));

    if (!event) {
      throw new Error('Event not found');
    }

    const [webhook] = await db.select()
      .from(webhooks)
      .where(eq(webhooks.id, event.webhookId));

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    await this.deliverWebhook(webhook, event.payload as any);
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookId: string): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    lastDelivery: Date | null;
  }> {
    const events = await db.select()
      .from(webhookEvents)
      .where(eq(webhookEvents.webhookId, webhookId));

    const successful = events.filter((e: any) => e.success);
    const failed = events.filter((e: any) => !e.success);
    
    const avgResponseTime = events.length > 0
      ? events.reduce((sum: number, e: any) => sum + (e.responseTime || 0), 0) / events.length
      : 0;

    return {
      totalDeliveries: events.length,
      successfulDeliveries: successful.length,
      failedDeliveries: failed.length,
      averageResponseTime: avgResponseTime,
      lastDelivery: events.length > 0 ? events[0].createdAt : null,
    };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Subscribe webhook to event
   */
  private subscribeToEvent(webhookId: string, event: WebhookEventType): void {
    // Store subscription (in-memory for now)
    // In production, use Redis or database
  }

  /**
   * Unsubscribe from all events
   */
  private unsubscribeFromAllEvents(webhookId: string): void {
    // Remove all subscriptions
  }

  /**
   * Get webhooks subscribed to event
   */
  private async getSubscribedWebhooks(
    event: WebhookEventType,
    userId?: string
  ): Promise<any[]> {
    let query = db.select().from(webhooks);

    // Filter by user if provided
    if (userId) {
      query = query.where(eq(webhooks.userId, userId)) as any;
    }

    const allWebhooks = await query;

    // Filter by event subscription
    return allWebhooks.filter((webhook: any) => 
      webhook.events.includes(event)
    );
  }

  /**
   * Queue webhook delivery
   */
  private async queueDelivery(
    webhookId: string,
    payload: WebhookPayload
  ): Promise<void> {
    if (!this.deliveryQueue.has(webhookId)) {
      this.deliveryQueue.set(webhookId, []);
    }

    this.deliveryQueue.get(webhookId)!.push(payload);
  }

  /**
   * Start delivery worker
   */
  private startDeliveryWorker(): void {
    setInterval(async () => {
      this.deliveryQueue.forEach(async (payloads, webhookId) => {
        if (payloads.length === 0) return;

        const payload = payloads.shift()!;
        
        const [webhook] = await db.select()
          .from(webhooks)
          .where(eq(webhooks.id, webhookId));

        if (webhook) {
          await this.deliverWebhook(webhook, payload);
        }
      });
    }, 1000); // Process every second
  }

  /**
   * Deliver webhook to endpoint
   */
  private async deliverWebhook(
    webhook: any,
    payload: WebhookPayload
  ): Promise<void> {
    const startTime = Date.now();
    let attempt = 0;
    let result: WebhookDeliveryResult | null = null;

    while (attempt < webhook.retryAttempts) {
      attempt++;

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': this.generateSignature(payload, webhook.secret),
            'X-Webhook-Event': payload.event,
            'X-Webhook-Timestamp': payload.timestamp.toISOString(),
            'X-Webhook-Attempt': attempt.toString(),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(webhook.timeout),
        });

        const responseTime = Date.now() - startTime;

        result = {
          success: response.ok,
          statusCode: response.status,
          responseTime,
          attempt,
        };

        if (response.ok) {
          break; // Success, exit retry loop
        } else {
          result.error = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        result = {
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt,
        };
      }

      // Wait before retry (exponential backoff)
      if (attempt < webhook.retryAttempts) {
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    // Save delivery result
    await db.insert(webhookEvents).values({
      webhookId: webhook.id,
      event: payload.event,
      payload: payload as any,
      success: result!.success,
      statusCode: result!.statusCode,
      responseTime: result!.responseTime,
      error: result!.error,
      attempts: attempt,
    });

    // Update webhook stats
    await db.update(webhooks)
      .set({
        lastDelivery: new Date(),
        deliveryCount: db.raw('delivery_count + 1'),
        failureCount: result!.success ? undefined : db.raw('failure_count + 1'),
      })
      .where(eq(webhooks.id, webhook.id));

    console.log(
      `[Webhook] Delivered ${payload.event} to ${webhook.url}: ` +
      `${result!.success ? 'SUCCESS' : 'FAILED'} ` +
      `(${result!.responseTime}ms, attempt ${attempt})`
    );
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: WebhookPayload, secret?: string): string {
    if (!secret) return '';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const webhookService = new WebhookService();

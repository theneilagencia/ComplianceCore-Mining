/**
 * Server-Sent Events (SSE) Service
 * 
 * Real-time event streaming service with:
 * - Connection management with auto-reconnect
 * - Event routing and filtering
 * - Heartbeat mechanism
 * - Connection pooling
 * - Integration with webhook system
 * 
 * Target: <100ms latency, 99%+ connection stability
 * 
 * @module SSEService
 * @sprint SPRINT5-003
 */

import { Response } from 'express';
import { EventEmitter } from 'events';

/**
 * SSE Event types
 */
export enum SSEEventType {
  // Technical Reports
  REPORT_CREATED = 'report:created',
  REPORT_UPDATED = 'report:updated',
  REPORT_DELETED = 'report:deleted',
  REPORT_EXPORTED = 'report:exported',
  
  // Upload Events
  UPLOAD_STARTED = 'upload:started',
  UPLOAD_PROGRESS = 'upload:progress',
  UPLOAD_COMPLETED = 'upload:completed',
  UPLOAD_FAILED = 'upload:failed',
  
  // OCR Events
  OCR_STARTED = 'ocr:started',
  OCR_PROGRESS = 'ocr:progress',
  OCR_COMPLETED = 'ocr:completed',
  OCR_FAILED = 'ocr:failed',
  
  // Export Events
  EXPORT_STARTED = 'export:started',
  EXPORT_PROGRESS = 'export:progress',
  EXPORT_COMPLETED = 'export:completed',
  EXPORT_FAILED = 'export:failed',
  
  // System Events
  NOTIFICATION = 'notification',
  CACHE_INVALIDATED = 'cache:invalidated',
  SYSTEM_STATUS = 'system:status',
  
  // Connection Events
  HEARTBEAT = 'heartbeat',
  CONNECTED = 'connected',
  RECONNECT = 'reconnect',
}

/**
 * SSE Event data
 */
export interface SSEEvent {
  id: string;
  type: SSEEventType;
  data: any;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * SSE Client connection
 */
interface SSEClient {
  id: string;
  userId: string;
  response: Response;
  connectedAt: number;
  lastActivity: number;
  subscribedEvents: Set<SSEEventType>;
  metadata: Record<string, any>;
}

/**
 * SSE Service Statistics
 */
export interface SSEStats {
  activeConnections: number;
  totalConnections: number;
  totalEventsSent: number;
  avgLatency: number;
  connectionUptime: number;
  droppedConnections: number;
}

/**
 * SSE Configuration
 */
export interface SSEConfig {
  heartbeatInterval?: number; // ms
  connectionTimeout?: number; // ms
  maxConnections?: number;
  enableCompression?: boolean;
  retryInterval?: number; // ms for client retry
}

/**
 * Server-Sent Events Service
 * 
 * Manages real-time event streaming to clients
 */
export class SSEService extends EventEmitter {
  private clients: Map<string, SSEClient>;
  private eventBuffer: Map<string, SSEEvent[]>; // userId -> events
  private heartbeatInterval: NodeJS.Timeout | null;
  private config: Required<SSEConfig>;
  private stats: SSEStats;
  private eventLatencies: number[];

  constructor(config: SSEConfig = {}) {
    super();
    
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 30000, // 30s
      connectionTimeout: config.connectionTimeout || 300000, // 5 min
      maxConnections: config.maxConnections || 1000,
      enableCompression: config.enableCompression ?? false,
      retryInterval: config.retryInterval || 3000, // 3s
    };

    this.clients = new Map();
    this.eventBuffer = new Map();
    this.heartbeatInterval = null;
    this.eventLatencies = [];

    this.stats = {
      activeConnections: 0,
      totalConnections: 0,
      totalEventsSent: 0,
      avgLatency: 0,
      connectionUptime: 0,
      droppedConnections: 0,
    };

    this.startHeartbeat();
  }

  /**
   * Initialize SSE connection for client
   */
  connect(
    clientId: string,
    userId: string,
    response: Response,
    subscribedEvents: SSEEventType[] = [],
    metadata: Record<string, any> = {}
  ): void {
    // Check max connections
    if (this.clients.size >= this.config.maxConnections) {
      console.warn('[SSE] Max connections reached, rejecting new connection');
      response.status(503).json({ error: 'Server capacity reached' });
      return;
    }

    // Setup SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Enable compression if configured
    if (this.config.enableCompression) {
      response.setHeader('Content-Encoding', 'gzip');
    }

    // Create client record
    const client: SSEClient = {
      id: clientId,
      userId,
      response,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      subscribedEvents: new Set(subscribedEvents),
      metadata,
    };

    this.clients.set(clientId, client);
    this.stats.activeConnections = this.clients.size;
    this.stats.totalConnections++;

    console.log(`[SSE] Client connected: ${clientId} (user: ${userId}, total: ${this.clients.size})`);

    // Send initial connection event
    this.sendToClient(client, {
      id: this.generateEventId(),
      type: SSEEventType.CONNECTED,
      data: {
        clientId,
        retryInterval: this.config.retryInterval,
        subscribedEvents: Array.from(client.subscribedEvents),
      },
      timestamp: Date.now(),
    });

    // Send buffered events
    this.flushBufferedEvents(client);

    // Handle client disconnect
    response.on('close', () => {
      this.disconnect(clientId);
    });

    this.emit('client:connected', { clientId, userId });
  }

  /**
   * Disconnect client
   */
  disconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      client.response.end();
      this.clients.delete(clientId);
      this.stats.activeConnections = this.clients.size;
      
      console.log(`[SSE] Client disconnected: ${clientId} (total: ${this.clients.size})`);
      this.emit('client:disconnected', { clientId, userId: client.userId });
    }
  }

  /**
   * Broadcast event to all clients
   */
  broadcast(event: Omit<SSEEvent, 'id' | 'timestamp'>): void {
    const fullEvent: SSEEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    };

    console.log(`[SSE] Broadcasting event: ${fullEvent.type} to ${this.clients.size} clients`);

    let sentCount = 0;
    const startTime = Date.now();

    this.clients.forEach((client) => {
      if (this.shouldSendToClient(client, fullEvent)) {
        this.sendToClient(client, fullEvent);
        sentCount++;
      }
    });

    const latency = Date.now() - startTime;
    this.recordLatency(latency);
    this.stats.totalEventsSent += sentCount;

    console.log(`[SSE] Event sent to ${sentCount} clients in ${latency}ms`);
  }

  /**
   * Send event to specific user
   */
  sendToUser(userId: string, event: Omit<SSEEvent, 'id' | 'timestamp' | 'userId'>): void {
    const fullEvent: SSEEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
      userId,
    };

    let sentCount = 0;
    const startTime = Date.now();

    this.clients.forEach((client) => {
      if (client.userId === userId && this.shouldSendToClient(client, fullEvent)) {
        this.sendToClient(client, fullEvent);
        sentCount++;
      }
    });

    // Buffer event if no active connection
    if (sentCount === 0) {
      this.bufferEvent(userId, fullEvent);
    }

    const latency = Date.now() - startTime;
    this.recordLatency(latency);
    this.stats.totalEventsSent += sentCount;

    console.log(`[SSE] Event sent to user ${userId} (${sentCount} connections) in ${latency}ms`);
  }

  /**
   * Send event to specific client
   */
  sendToClient(client: SSEClient, event: SSEEvent): void {
    try {
      const data = `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\nretry: ${this.config.retryInterval}\n\n`;
      
      client.response.write(data);
      client.lastActivity = Date.now();
    } catch (error) {
      console.error(`[SSE] Error sending to client ${client.id}:`, error);
      this.disconnect(client.id);
      this.stats.droppedConnections++;
    }
  }

  /**
   * Check if event should be sent to client
   */
  private shouldSendToClient(client: SSEClient, event: SSEEvent): boolean {
    // If no subscriptions, send all events
    if (client.subscribedEvents.size === 0) {
      return true;
    }

    // Check if client is subscribed to this event type
    return client.subscribedEvents.has(event.type);
  }

  /**
   * Buffer event for offline user
   */
  private bufferEvent(userId: string, event: SSEEvent): void {
    if (!this.eventBuffer.has(userId)) {
      this.eventBuffer.set(userId, []);
    }

    const buffer = this.eventBuffer.get(userId)!;
    buffer.push(event);

    // Keep only last 50 events per user
    if (buffer.length > 50) {
      buffer.shift();
    }

    console.log(`[SSE] Event buffered for user ${userId} (${buffer.length} events)`);
  }

  /**
   * Flush buffered events to client
   */
  private flushBufferedEvents(client: SSEClient): void {
    const buffer = this.eventBuffer.get(client.userId);
    
    if (!buffer || buffer.length === 0) {
      return;
    }

    console.log(`[SSE] Flushing ${buffer.length} buffered events to client ${client.id}`);

    buffer.forEach((event) => {
      this.sendToClient(client, event);
    });

    this.eventBuffer.delete(client.userId);
  }

  /**
   * Subscribe client to event types
   */
  subscribe(clientId: string, eventTypes: SSEEventType[]): void {
    const client = this.clients.get(clientId);
    
    if (!client) {
      console.warn(`[SSE] Client ${clientId} not found for subscription`);
      return;
    }

    eventTypes.forEach((type) => client.subscribedEvents.add(type));
    
    console.log(`[SSE] Client ${clientId} subscribed to: ${eventTypes.join(', ')}`);
  }

  /**
   * Unsubscribe client from event types
   */
  unsubscribe(clientId: string, eventTypes: SSEEventType[]): void {
    const client = this.clients.get(clientId);
    
    if (!client) {
      console.warn(`[SSE] Client ${clientId} not found for unsubscription`);
      return;
    }

    eventTypes.forEach((type) => client.subscribedEvents.delete(type));
    
    console.log(`[SSE] Client ${clientId} unsubscribed from: ${eventTypes.join(', ')}`);
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const clientsToRemove: string[] = [];

      this.clients.forEach((client) => {
        const idleTime = now - client.lastActivity;

        // Remove inactive connections
        if (idleTime > this.config.connectionTimeout) {
          console.log(`[SSE] Client ${client.id} timed out (idle: ${idleTime}ms)`);
          clientsToRemove.push(client.id);
          return;
        }

        // Send heartbeat
        try {
          const heartbeat = `:heartbeat ${now}\n\n`;
          client.response.write(heartbeat);
        } catch (error) {
          console.error(`[SSE] Heartbeat failed for client ${client.id}`);
          clientsToRemove.push(client.id);
        }
      });

      // Remove disconnected clients
      clientsToRemove.forEach((clientId) => this.disconnect(clientId));

      // Update stats
      this.stats.activeConnections = this.clients.size;
    }, this.config.heartbeatInterval);

    console.log(`[SSE] Heartbeat started (interval: ${this.config.heartbeatInterval}ms)`);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('[SSE] Heartbeat stopped');
    }
  }

  /**
   * Record event latency
   */
  private recordLatency(latency: number): void {
    this.eventLatencies.push(latency);

    // Keep only last 1000 measurements
    if (this.eventLatencies.length > 1000) {
      this.eventLatencies.shift();
    }

    // Calculate average
    this.stats.avgLatency =
      this.eventLatencies.reduce((sum, l) => sum + l, 0) / this.eventLatencies.length;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get service statistics
   */
  getStats(): SSEStats {
    return { ...this.stats };
  }

  /**
   * Get active clients
   */
  getClients(): Array<{ id: string; userId: string; connectedAt: number; subscribedEvents: string[] }> {
    return Array.from(this.clients.values()).map((client) => ({
      id: client.id,
      userId: client.userId,
      connectedAt: client.connectedAt,
      subscribedEvents: Array.from(client.subscribedEvents),
    }));
  }

  /**
   * Health check
   */
  healthCheck(): { healthy: boolean; activeConnections: number; avgLatency: number } {
    return {
      healthy: this.clients.size < this.config.maxConnections && this.stats.avgLatency < 100,
      activeConnections: this.clients.size,
      avgLatency: this.stats.avgLatency,
    };
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    console.log('[SSE] Shutting down...');

    this.stopHeartbeat();

    // Disconnect all clients
    this.clients.forEach((client) => {
      client.response.end();
    });

    this.clients.clear();
    this.eventBuffer.clear();

    console.log('[SSE] Shutdown complete');
  }
}

// Export singleton instance
export const sseService = new SSEService();

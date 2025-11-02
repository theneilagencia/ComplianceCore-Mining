/**
 * Server-Sent Events (SSE) React Hook
 * 
 * React hooks for consuming real-time events via SSE.
 * 
 * Features:
 * - Auto-reconnect on connection loss
 * - Event filtering and subscription
 * - Connection status tracking
 * - Buffered events during disconnection
 * - TypeScript support
 * 
 * @module useSSE
 * @sprint SPRINT5-003
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * SSE Event types (mirrored from server)
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
 * SSE Event data structure
 */
export interface SSEEvent<T = any> {
  id: string;
  type: SSEEventType;
  data: T;
  timestamp: number;
}

/**
 * Connection state
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * SSE Hook options
 */
export interface UseSSEOptions {
  url?: string;
  subscribedEvents?: SSEEventType[];
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * SSE Hook return value
 */
export interface UseSSEReturn {
  connectionState: ConnectionState;
  events: SSEEvent[];
  lastEvent: SSEEvent | null;
  connect: () => void;
  disconnect: () => void;
  clearEvents: () => void;
  isConnected: boolean;
  reconnectAttempts: number;
}

/**
 * Hook for consuming Server-Sent Events
 * 
 * @example
 * ```tsx
 * const { events, lastEvent, isConnected, connectionState } = useSSE({
 *   subscribedEvents: [SSEEventType.UPLOAD_PROGRESS, SSEEventType.OCR_COMPLETED],
 *   onConnected: () => console.log('Connected to SSE'),
 * });
 * 
 * useEffect(() => {
 *   if (lastEvent?.type === SSEEventType.UPLOAD_COMPLETED) {
 *     toast.success('Upload completed!');
 *   }
 * }, [lastEvent]);
 * ```
 */
export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    url = '/api/events/stream',
    subscribedEvents = [],
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onConnected,
    onDisconnected,
    onError,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      console.warn('[useSSE] Already connected');
      return;
    }

    console.log('[useSSE] Connecting to SSE...');
    setConnectionState(ConnectionState.CONNECTING);
    isManualDisconnectRef.current = false;

    try {
      // Build URL with query parameters
      const params = new URLSearchParams();
      if (subscribedEvents.length > 0) {
        params.append('events', subscribedEvents.join(','));
      }
      const fullUrl = `${url}?${params.toString()}`;

      // Create EventSource
      const eventSource = new EventSource(fullUrl);
      eventSourceRef.current = eventSource;

      // Handle connection opened
      eventSource.onopen = () => {
        console.log('[useSSE] Connection opened');
        setConnectionState(ConnectionState.CONNECTED);
        setReconnectAttempts(0);
        onConnected?.();
      };

      // Handle generic messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const sseEvent: SSEEvent = {
            id: event.lastEventId,
            type: SSEEventType.NOTIFICATION,
            data,
            timestamp: Date.now(),
          };

          setEvents((prev) => [...prev, sseEvent]);
          setLastEvent(sseEvent);
        } catch (error) {
          console.error('[useSSE] Error parsing message:', error);
        }
      };

      // Handle connection errors
      eventSource.onerror = (error) => {
        console.error('[useSSE] Connection error:', error);
        setConnectionState(ConnectionState.ERROR);

        // Close connection
        eventSource.close();
        eventSourceRef.current = null;

        onError?.(new Error('SSE connection error'));

        // Auto-reconnect if enabled and not manual disconnect
        if (autoReconnect && !isManualDisconnectRef.current) {
          if (reconnectAttempts < maxReconnectAttempts) {
            console.log(
              `[useSSE] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`
            );
            setConnectionState(ConnectionState.RECONNECTING);
            setReconnectAttempts((prev) => prev + 1);

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectInterval);
          } else {
            console.error('[useSSE] Max reconnect attempts reached');
            setConnectionState(ConnectionState.ERROR);
            onDisconnected?.();
          }
        }
      };

      // Setup event listeners for specific event types
      subscribedEvents.forEach((eventType) => {
        eventSource.addEventListener(eventType, (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            const sseEvent: SSEEvent = {
              id: event.lastEventId,
              type: eventType,
              data,
              timestamp: Date.now(),
            };

            setEvents((prev) => [...prev, sseEvent]);
            setLastEvent(sseEvent);
          } catch (error) {
            console.error(`[useSSE] Error parsing ${eventType} event:`, error);
          }
        });
      });

      // Listen for 'connected' event
      eventSource.addEventListener(SSEEventType.CONNECTED, (event: MessageEvent) => {
        console.log('[useSSE] Received connected event:', event.data);
      });
    } catch (error) {
      console.error('[useSSE] Failed to create EventSource:', error);
      setConnectionState(ConnectionState.ERROR);
      onError?.(error as Error);
    }
  }, [
    url,
    subscribedEvents,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    reconnectAttempts,
    onConnected,
    onDisconnected,
    onError,
  ]);

  /**
   * Disconnect from SSE
   */
  const disconnect = useCallback(() => {
    console.log('[useSSE] Disconnecting...');
    isManualDisconnectRef.current = true;

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setReconnectAttempts(0);
    onDisconnected?.();
  }, [onDisconnected]);

  /**
   * Clear event history
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []); // Only run once on mount

  return {
    connectionState,
    events,
    lastEvent,
    connect,
    disconnect,
    clearEvents,
    isConnected: connectionState === ConnectionState.CONNECTED,
    reconnectAttempts,
  };
}

/**
 * Hook for listening to specific SSE event type
 * 
 * @example
 * ```tsx
 * useSSEEvent(SSEEventType.UPLOAD_PROGRESS, (event) => {
 *   console.log('Upload progress:', event.data.progress);
 *   setProgress(event.data.progress);
 * });
 * ```
 */
export function useSSEEvent<T = any>(
  eventType: SSEEventType,
  callback: (event: SSEEvent<T>) => void,
  options: UseSSEOptions = {}
): void {
  const { lastEvent } = useSSE({
    ...options,
    subscribedEvents: [eventType, ...(options.subscribedEvents || [])],
  });

  useEffect(() => {
    if (lastEvent && lastEvent.type === eventType) {
      callback(lastEvent as SSEEvent<T>);
    }
  }, [lastEvent, eventType, callback]);
}

/**
 * Hook for SSE connection status indicator
 * 
 * @example
 * ```tsx
 * const { status, indicator } = useSSEStatus();
 * 
 * return (
 *   <div>
 *     <span className={indicator.color}>{indicator.icon}</span>
 *     <span>{status}</span>
 *   </div>
 * );
 * ```
 */
export function useSSEStatus(options: UseSSEOptions = {}): {
  status: ConnectionState;
  indicator: { color: string; icon: string; label: string };
} {
  const { connectionState } = useSSE(options);

  const indicator = {
    [ConnectionState.DISCONNECTED]: {
      color: 'text-gray-500',
      icon: '⚪',
      label: 'Disconnected',
    },
    [ConnectionState.CONNECTING]: {
      color: 'text-yellow-500',
      icon: '🟡',
      label: 'Connecting...',
    },
    [ConnectionState.CONNECTED]: {
      color: 'text-green-500',
      icon: '🟢',
      label: 'Connected',
    },
    [ConnectionState.RECONNECTING]: {
      color: 'text-orange-500',
      icon: '🟠',
      label: 'Reconnecting...',
    },
    [ConnectionState.ERROR]: {
      color: 'text-red-500',
      icon: '🔴',
      label: 'Error',
    },
  }[connectionState];

  return {
    status: connectionState,
    indicator,
  };
}

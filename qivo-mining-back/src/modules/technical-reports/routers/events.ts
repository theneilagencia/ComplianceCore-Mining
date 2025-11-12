/**
 * Server-Sent Events (SSE) Router
 * 
 * Provides real-time event streaming for upload pipeline
 * Endpoint: GET /api/events/:reportId
 * 
 * Usage from client:
 * const eventSource = new EventSource(`/api/events/${reportId}`);
 * eventSource.onmessage = (e) => {
 *   const event = JSON.parse(e.data);
 *   // Handle event
 * };
 */

import { Router, Request, Response } from 'express';
import { uploadPipelineEmitter, UploadPipelineEvent } from '../services/event-emitter';

export const eventsRouter = Router();

/**
 * SSE endpoint for a specific report
 * Client maintains persistent connection to receive real-time updates
 */
eventsRouter.get('/events/:reportId', (req: Request, res: Response) => {
  const { reportId } = req.params;

  console.log(`[SSE] Client connected for report: ${reportId}`);

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'connected', reportId })}\n\n`);

  // Subscribe to events for this report
  const unsubscribe = uploadPipelineEmitter.subscribeToReport(
    reportId,
    (event: UploadPipelineEvent) => {
      try {
        // Format event for SSE
        const eventData = JSON.stringify(event);
        res.write(`data: ${eventData}\n\n`);
        
        console.log(`[SSE] Sent event to client: ${event.type} for report ${reportId}`);
      } catch (error) {
        console.error(`[SSE] Error sending event:`, error);
      }
    }
  );

  // Handle client disconnect
  req.on('close', () => {
    console.log(`[SSE] Client disconnected for report: ${reportId}`);
    unsubscribe();
  });

  // Keep-alive ping every 30 seconds to prevent timeout
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  // Cleanup on connection close
  req.on('close', () => {
    clearInterval(keepAliveInterval);
  });
});

/**
 * Health check endpoint for SSE system
 */
eventsRouter.get('/events/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'upload-pipeline-events',
    timestamp: new Date().toISOString(),
    activeConnections: uploadPipelineEmitter.listenerCount('pipeline:event'),
  });
});

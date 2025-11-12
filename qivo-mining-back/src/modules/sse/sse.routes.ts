/**
 * SSE API Routes
 * 
 * Express routes for Server-Sent Events endpoints
 * 
 * @module sse-routes
 * @sprint SPRINT5-003
 */

import { Router, Request, Response } from 'express';
import { sseService, SSEEventType } from './sse.service';

const router = Router();

/**
 * SSE Stream endpoint
 * GET /api/events/stream
 * 
 * Query params:
 * - events: comma-separated list of event types to subscribe
 * - userId: user ID for filtering (optional, can use auth instead)
 */
router.get('/stream', (req: Request, res: Response) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Get user ID from session/auth or query
  const userId = (req.user as any)?.id || req.query.userId as string || 'anonymous';
  
  // Parse subscribed events
  const eventsParam = req.query.events as string;
  const subscribedEvents: SSEEventType[] = eventsParam
    ? eventsParam.split(',').map((e) => e.trim() as SSEEventType)
    : [];

  // Metadata
  const metadata = {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };

  console.log(`[SSE Routes] New connection request: ${clientId} (user: ${userId})`);

  // Connect client
  sseService.connect(clientId, userId, res, subscribedEvents, metadata);
});

/**
 * Broadcast event to all clients
 * POST /api/events/broadcast
 * 
 * Body:
 * {
 *   "type": "notification",
 *   "data": { ... }
 * }
 */
router.post('/broadcast', (req: Request, res: Response) => {
  const { type, data, metadata } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Event type is required' });
  }

  sseService.broadcast({ type, data, metadata });

  res.json({ success: true, message: 'Event broadcasted' });
});

/**
 * Send event to specific user
 * POST /api/events/send/:userId
 * 
 * Body:
 * {
 *   "type": "notification",
 *   "data": { ... }
 * }
 */
router.post('/send/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { type, data, metadata } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Event type is required' });
  }

  sseService.sendToUser(userId, { type, data, metadata });

  res.json({ success: true, message: `Event sent to user ${userId}` });
});

/**
 * Get SSE service statistics
 * GET /api/events/stats
 */
router.get('/stats', (req: Request, res: Response) => {
  const stats = sseService.getStats();
  const clients = sseService.getClients();

  res.json({
    ...stats,
    clients: clients.length,
    clientDetails: clients,
  });
});

/**
 * Get active clients
 * GET /api/events/clients
 */
router.get('/clients', (req: Request, res: Response) => {
  const clients = sseService.getClients();
  
  res.json({
    count: clients.length,
    clients,
  });
});

/**
 * Health check
 * GET /api/events/health
 */
router.get('/health', (req: Request, res: Response) => {
  const health = sseService.healthCheck();
  
  res.status(health.healthy ? 200 : 503).json(health);
});

/**
 * Disconnect specific client (admin only)
 * DELETE /api/events/client/:clientId
 */
router.delete('/client/:clientId', (req: Request, res: Response) => {
  const { clientId } = req.params;
  
  sseService.disconnect(clientId);
  
  res.json({ success: true, message: `Client ${clientId} disconnected` });
});

export default router;

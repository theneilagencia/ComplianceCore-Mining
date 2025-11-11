import "dotenv/config";
import express from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { rateLimit } from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import paymentRouter from "../modules/payment/router";
import licenseRouter from "../modules/licenses/router";
import authRouter from "../modules/auth/router";
import googleHealthRouter from "../modules/auth/google-health-router";
import adminRouter from "../modules/admin/router";
import debugRouter from "../modules/admin/debug-router";
import createAdminRouter from "../modules/admin/create-admin-router";
import fixAdminLicenseRouter from "../modules/admin/fix-admin-license";
import reportsRouter from "../modules/reports/router";
import auditsRouter from "../modules/audits/router";
import settingsRouter from "../modules/settings/router";
import uxRouter from "../modules/ux/router";
import systemRouter from "../modules/system/router";
import supportRouter from "../modules/support/router";
import radarRouter from "../modules/radar/router";
import diagnosticRouter from "../modules/radar/diagnosticRouter";
import { startDiagnosticCron } from "../modules/radar/services/diagnosticCron";
import { startScheduler } from "../modules/radar/services/scheduler";
// import { startScheduler as startRadarAdminScheduler } from "../modules/radar/jobs/scheduler"; // Temporariamente desabilitado
import templatesRouter from "../modules/templates/router";
import validateRouter from "../modules/validate/router";
import contactRouter from "../modules/contact/router";
import storageDownloadRouter from "../routes/storage-download";
import fixS3UrlRouter from "../routes/fix-s3url";
import { initStorage } from "../storage-hybrid";
import { installS3UrlTrigger } from "../install-s3url-trigger";
import { passport } from "../modules/auth/google-oauth";
import devRouter from "../modules/dev/router";
import initDbRouter from "../modules/dev/init-db-router";
import makeAdminRouter from "../modules/dev/make-admin-router";
import initProdRouter from "../modules/dev/init-prod-router";
import createTablesRouter from "../modules/dev/create-tables-router";
import populateDbRouter from "../modules/dev/populate-db-router";
import stripeWebhookSetupRouter from "../modules/dev/setup-stripe-webhook";
import { runDevSeeds } from "../modules/dev/seed";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { antiRedirectMiddleware } from "./anti-redirect-middleware";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Set server timeout to 5 minutes (300 seconds)
  server.timeout = 300000; // 5 minutes
  server.keepAliveTimeout = 305000; // Slightly longer than timeout
  server.headersTimeout = 310000; // Slightly longer than keepAliveTimeout
  
  // Configure CORS with credentials - GCP + localhost
  // CORS is applied ONLY to /api routes to avoid blocking static files
  const allowedOrigins = [
    // Production (GCP)
    'https://qivo-mining-586444405059.southamerica-east1.run.app',
    'https://qivo-mining-kfw7vgq5xa-rj.a.run.app',
    'https://www.qivomining.com',
    'http://www.qivomining.com',
    'https://qivomining.com',
    // Staging
    'https://qivo-mining-staging-586444405059.southamerica-east1.run.app',
    // Development
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'https://dev-qivo-mining.vercel.app'

  ];
  
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  
  // Gzip compression for all responses (should be early in middleware chain)
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses > 1KB
    level: 6, // Compression level (0-9, 6 is default balance)
  }));
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Cookie parser for reading cookies
  app.use(cookieParser());
  
  // Anti-redirect middleware (MUST be early in the chain)
  app.use(antiRedirectMiddleware);
  
  // Rate limiting - General API protection
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // Máximo 300 requisições por IP por janela (20 req/min)
    standardHeaders: true,
    legacyHeaders: false,
    // Handler customizado que retorna JSON em vez de texto
    handler: (req, res) => {
      res.status(429).json({
        error: {
          message: 'Muitas requisições. Aguarde 15 minutos.',
          code: 'TOO_MANY_REQUESTS',
          retryAfter: 15 * 60, // segundos
        }
      });
    },
  });
  
  // Rate limiting - Strict para uploads
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 50, // Máximo 50 uploads por IP por hora
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          message: 'Limite de uploads excedido. Aguarde 1 hora.',
          code: 'TOO_MANY_UPLOADS',
          retryAfter: 60 * 60,
        }
      });
    },
  });
  
  // Rate limiting - Muito strict para autenticação
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 tentativas de login por IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          message: 'Muitas tentativas de login. Aguarde 15 minutos.',
          code: 'TOO_MANY_AUTH_ATTEMPTS',
          retryAfter: 15 * 60,
        }
      });
    },
  });
  
  // Aplicar CORS e rate limiting apenas para rotas /api
  app.use('/api/', cors(corsOptions));
  app.use('/api/', generalLimiter);
  
  // Health check endpoint (enhanced v2.0)
  app.get('/api/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Check database connection
      const { getDb } = await import('../db');
      const db = await getDb();
      const dbHealthy = !!db;
      
      // Get system metrics
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Response time
      const responseTime = Date.now() - startTime;
      
      // Overall health status
      const isHealthy = dbHealthy && responseTime < 1000;
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'degraded',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        service: 'QIVO Mining Platform',
        checks: {
          database: {
            status: dbHealthy ? 'connected' : 'disconnected',
            healthy: dbHealthy
          },
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            unit: 'MB',
            healthy: memUsage.heapUsed / memUsage.heapTotal < 0.9
          },
          uptime: {
            seconds: Math.round(uptime),
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
            healthy: uptime > 60 // Healthy if running for > 1min
          }
        },
        performance: {
          responseTime: `${responseTime}ms`,
          healthy: responseTime < 100
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        version: '2.0.0',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        service: 'QIVO Mining Platform'
      });
    }
  });
  
  // Initialize Passport
  app.use(passport.initialize());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Authentication routes (com rate limiting strict)
  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/auth", authLimiter, googleHealthRouter);
  
  // Development routes (only in dev mode)
  app.use("/api/dev", devRouter);
  
  // Database initialization route (temporary, for setup)
  app.use("/api", initDbRouter);
  
  // Production initialization route (one-time setup)
  app.use("/api", initProdRouter);
  
  // Make admin route (temporary, for setup)
  app.use("/api/dev", makeAdminRouter);
  
  // Create tables route (temporary, for setup)
  app.use("/api/dev", createTablesRouter);
  
  // Populate database route (temporary, for setup)
  app.use("/api/dev", populateDbRouter);
  
  // Migrations route (temporary, for setup)
  const migrationsRouter = (await import("../modules/dev/migrations-router.js")).default;
  app.use("/api/dev", migrationsRouter);
  
  // Stripe webhook setup route (temporary, for setup)
  app.use("/api", stripeWebhookSetupRouter);
  
  // Payment and License routes
  app.use("/api/payment", paymentRouter);
  app.use("/api/license", licenseRouter);
  
  // Admin routes
  app.use("/api/admin", adminRouter);
  app.use("/api/admin", debugRouter); // Debug endpoint
  app.use("/api/create-admin", createAdminRouter);
  app.use("/api/fix-admin-license", fixAdminLicenseRouter);
  
  // Reports, Audits, and Settings routes
  app.use("/api/reports", reportsRouter);
  app.use("/api/audits", auditsRouter);
  app.use("/api/settings", settingsRouter);
  
  // UX monitoring route
  app.use("/api/ux", uxRouter);
  
  // System status route
  app.use("/api/system", systemRouter);
  
  // Support routes
  app.use("/api/support", supportRouter);
  
  // Radar routes
  app.use("/api/radar", radarRouter);
  app.use("/api/radar", diagnosticRouter);
  
  // Start diagnostic cron job
  startDiagnosticCron();
  
  // Templates routes
  app.use("/api/templates", templatesRouter);
  
  // Validation routes
  app.use("/api/validate", validateRouter);
  
  // Contact form routes
  app.use("/api/contact", contactRouter);
  
  // Storage download routes
  app.use("/api/storage", storageDownloadRouter);
  
  // Fix s3Url migration route
  app.use("/api", fixS3UrlRouter);
  
  // Server-Sent Events (SSE) for real-time upload pipeline updates
  const { eventsRouter } = await import("../modules/technical-reports/routers/events");
  app.use("/api", eventsRouter);
  
  // tRPC API (com rate limiting para uploads)
  // Note: uploadLimiter será aplicado especificamente no endpoint de upload via tRPC middleware
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // IMPORTANT: Static files and catch-all MUST be registered LAST
  // to avoid intercepting API routes
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Increase timeout for large file uploads (default is 2 minutes)
  // Base64 encoding increases size by ~33%, so a 50MB file becomes ~66MB
  server.timeout = 5 * 60 * 1000; // 5 minutes
  server.keepAliveTimeout = 65 * 1000; // Slightly higher than ALB idle timeout (60s)
  server.headersTimeout = 66 * 1000; // Slightly higher than keepAliveTimeout

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Server timeout: ${server.timeout}ms (${server.timeout / 1000}s)`);
    
    // Initialize storage
    await initStorage();
    
    // Install database trigger to auto-fix s3Url
    await installS3UrlTrigger();
    
    // Initialize Radar Scheduler (cron jobs for data aggregation and notifications)
    if (process.env.NODE_ENV !== 'test') {
      try {
        await startScheduler();
        console.log('✅ [Radar Scheduler] Initialized successfully - Jobs scheduled for data aggregation and DOU scraping');
      } catch (error) {
        console.error('❌ [Radar Scheduler] Failed to initialize:', error);
        // Non-blocking - continue server startup even if scheduler fails
      }
      
      // Initialize Radar Admin Scheduler (API monitoring, health checks, cleanup)
      // Temporariamente desabilitado
      // try {
      //   startRadarAdminScheduler();
      //   console.log('✅ [Radar Admin Scheduler] Initialized successfully - Jobs scheduled for API monitoring and maintenance');
      // } catch (error) {
      //   console.error('❌ [Radar Admin Scheduler] Failed to initialize:', error);
      //   // Non-blocking - continue server startup even if scheduler fails
      // }
    }
    
    // Auto-seed disabled - use POST /api/dev/init to create test users
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Dev] Development mode enabled. Use POST /api/dev/init to create test users.');
    }
  });
}

startServer().catch(console.error);
